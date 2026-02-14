---
title: 배너 성과 집계 API 성능 최적화
tags: [Redis, MySQL, Lambda, EventBridge, Write-back]
github: https://github.com/banggeunho
thumbnail: images/thumbnail.svg
date: 2024-05-01
---

## 목차
1. [배경: 일일 70만 건의 배너 이벤트 수집](#배경-일일-70만-건의-배너-이벤트-수집)
2. [문제 분석: Row-level Lock과 Deadlock](#문제-분석-row-level-lock과-deadlock)
3. [해결 방안 검토: 3가지 옵션 비교](#해결-방안-검토-3가지-옵션-비교)
4. [아키텍처 설계: Redis Write-back 전략](#아키텍처-설계-redis-write-back-전략)
5. [핵심 구현 1: Redis Hash로 실시간 집계](#핵심-구현-1-redis-hash로-실시간-집계)
6. [핵심 구현 2: EventBridge + Lambda 배치 동기화](#핵심-구현-2-eventbridge--lambda-배치-동기화)
7. [핵심 구현 3: SQS Fallback으로 데이터 유실 방지](#핵심-구현-3-sqs-fallback으로-데이터-유실-방지)
8. [결과: DB 부하 10배 감소](#결과-db-부하-10배-감소)

---

## 배경: 일일 70만 건의 배너 이벤트 수집

에브리타임 혜택탭이 출시되면서 거의 모든 페이지에 프로모션 배너가 배치되었습니다. 배너가 노출되거나 클릭될 때마다 성과 집계 API가 호출되어, **전체 API 중 호출량 1위**를 기록하게 되었습니다.

**트래픽 규모:**
```
- 일일 배너 이벤트(노출+클릭): 약 70만 건
- 평균 초당 약 8건이지만, 인기 배너에 동시 요청이 집중되는 핫스팟 패턴
```

평균 수치만 보면 MySQL이 충분히 처리할 수 있는 수준이지만, 문제는 트래픽이 균등하게 분산되지 않는다는 점입니다. 특정 프로모션 배너에 노출/클릭이 집중되면 **같은 row에 동시 UPDATE가 몰려** Lock 경합이 발생합니다. 이는 단순 트래픽 과부하가 아닌, `INSERT ON DUPLICATE KEY UPDATE`의 구조적 Lock 메커니즘에 기인한 문제였습니다.

---

## 문제 분석: Row-level Lock과 Deadlock

### 기존 구조의 문제

**배너 이벤트 발생 시 동작:**
```javascript
router.post("/api/banner/performance/impression", async (req, res, next) => {
  const { bannerId } = req.body;
  const date = new Date();

  await usMapper.queryWithValues(`
    INSERT INTO banner_performance (banner_id, impression, click, date) VALUES (?)
    ON DUPLICATE KEY UPDATE impression = impression + 1
  `, [[bannerId, 1, 0, date]]);

  apiHandler.send(res, { success: true }, next);
});
```

**문제점:**

**1. `INSERT ON DUPLICATE KEY UPDATE`의 Lock 경합**

이 구문은 단순 UPDATE와 달리, 먼저 Shared Lock(S)을 획득한 뒤 중복 키 감지 시 Exclusive Lock(X)으로 업그레이드하는 과정을 거칩니다. 같은 키(banner_id + date)에 동시 요청이 들어오면 Lock 대기가 발생합니다.

```
요청 A: INSERT 시도 → S Lock 획득 → 중복 감지 → X Lock 대기
요청 B: INSERT 시도 → S Lock 획득 → 중복 감지 → X Lock 대기
요청 C: INSERT 시도 → S Lock 획득 → 중복 감지 → X Lock 대기
```

**2. Deadlock 발생**

동시에 같은 키에 여러 요청이 `INSERT ON DUPLICATE KEY UPDATE`를 실행하면, S Lock → X Lock 업그레이드 과정에서 서로의 S Lock 해제를 기다리며 교착 상태가 발생합니다.

```
트랜잭션 A: S Lock 획득 → X Lock 필요 (B의 S Lock 대기)
트랜잭션 B: S Lock 획득 → X Lock 필요 (A의 S Lock 대기)
→ Deadlock!
```

**3. 다른 API에 대한 연쇄 영향**

배너 집계 API의 DB 부하로 인해 같은 RDS를 사용하는 다른 API들도 느려지는 현상이 발생했습니다.

---

## 해결 방안 검토: 3가지 옵션 비교

### 방안 1: 데이터 구조 변경 (Row INSERT)

집계 테이블 UPDATE 대신 이벤트를 Row로 저장하는 방식입니다.

```sql
-- 클릭 이벤트를 Row로 저장
INSERT INTO banner_clicks (banner_id, clicked_at) VALUES (1, NOW());

-- 집계는 별도 쿼리
SELECT COUNT(*) FROM banner_clicks WHERE banner_id = 1 AND clicked_at >= '2024-05-01';
```

**불채택 이유:**
- 데이터 적재량 증가로 인한 스토리지 비용 부담 (일일 70만 건 × 365일)
- 실시간 집계 쿼리(`COUNT`, `GROUP BY`)가 느림
- 개발 리소스 및 인프라 변경 비용이 높음

### 방안 2: 메시지 큐 비동기 처리

SQS 등 메시지 큐로 이벤트를 비동기 처리하는 방식입니다.

**불채택 이유:**
- 운영 복잡도 증가
- 메시지 큐 인프라 추가 비용
- 결국 DB에 쓰는 구조는 동일하여 근본적 해결이 아님

### 방안 3: Redis 집계 + 배치 동기화 (채택)

Redis에서 실시간 집계 후 주기적으로 DB에 동기화하는 Write-back 방식입니다.

**채택 이유:**
- 기존 ElastiCache 인프라를 그대로 활용 (추가 비용 없음)
- 성능, 비용, 안정성 모두 균형
- DB 부하를 근본적으로 해소

> 당시에는 "고빈도 카운터 성능 문제를 가장 빠르게 해소"하는 것이 1순위였기 때문에 Redis Write-back이 최적의 선택이었습니다.
> 다만 이후 정산/과금 데이터로 활용 범위가 확대되면서, 운영 과정에서 예외 처리 비용과 정합성 관리 비용이 예상보다 크게 증가했고 아키텍처를 재검토하게 되었습니다.

---

## 아키텍처 설계: Redis Write-back 전략

### 전체 아키텍처

```mermaid
graph TB
    A[배너 이벤트] --> B[API Server]
    B --> C[Redis HINCRBY]
    C -->|성공| D[즉시 응답]

    B -.Redis 실패.-> E[SQS Fallback]
    E --> F[SQS Consumer]
    F --> G[MySQL RDS]
    J[배너 성과 조회 API] --> G

    H[EventBridge Scheduler] -->|10분마다| I[AWS Lambda]
    I -->|SCAN으로 데이터 조회| C
    I -->|Bulk REPLACE| G
```

### 배치 주기: 일일 1회에서 10분으로 변경

초기에는 일일 1회(오전 6시, 트래픽 최소 시간대) 배치로 운영했습니다. 그러나 Redis 장애 발생 시 하루치 데이터가 유실될 위험이 있어, **10분 주기로 변경**했습니다.

| 주기 | 장점 | 단점 | 결정 |
|------|-----|------|------|
| 1분 | 데이터 유실 최소화 | DB 부하 여전히 높음 | ❌ |
| **10분** | **유실 위험 최소화 + DB 부하 감소** | **약간의 데이터 지연** | **✅** |
| 1시간 | DB 부하 크게 감소 | 유실 시 1시간 데이터 손실 | ❌ |
| 일일 1회 | DB 부하 최소 | 장애 시 하루치 데이터 유실 | ❌ (기존) |

---

## 핵심 구현 1: Redis Hash로 실시간 집계

### Redis Hash 구조

단순 카운터 누적 용도에는 인메모리 데이터 스토어가 적합합니다. 개별 String Key 대신 Hash Key로 통합하여 메모리를 최적화했습니다.

**데이터 모델:**
```
Key: {date}:{banner_id}
Fields:
  - IMPRESSION: 노출 수
  - CLICK: 클릭 수
명령어: HINCRBY
```

**예시:**
```
20240501:1
  IMPRESSION: 12345
  CLICK: 890

20240501:2
  IMPRESSION: 8765
  CLICK: 432
```

Redis는 싱글스레드로 동작하기 때문에 HINCRBY 명령어로 Lock 경합 없이 안정적으로 값을 누적할 수 있습니다. MySQL에서 발생하던 Row-level Lock과 Deadlock 문제가 원천적으로 해소됩니다.

**TTL 및 메모리 관리:**

각 키에 7일 TTL을 설정했습니다. 배치 동기화가 정상 작동하면 DB에 이미 반영된 데이터이므로 7일 이상 보관할 필요가 없습니다.

```
- 일당 활성 배너 수: 약 200~300개
- 키 수: 일당 약 2,000개 (배너 × 날짜)
- 7일 보관: 약 14,000개 키
- 키당 크기: Hash 2필드 (IMPRESSION, CLICK) ≈ 100바이트
- 총 메모리: 약 1.4MB
```

기존 ElastiCache 인스턴스에서 유의미한 메모리 영향이 없는 수준이며, 별도의 메모리 관리 전략이 불필요했습니다.

### API 구현

**이벤트 카운트 증가:**
```typescript
@Post('/banners/:id/click')
async incrementClick(@Param('id') bannerId: number) {
  const dateKey = dayjs().format('YYYYMMDD');

  try {
    // Redis HINCRBY (원자적 연산, Lock 없음)
    await this.redis.hincrby(
      `${dateKey}:${bannerId}`,
      'CLICK',
      1
    );
    return { success: true };

  } catch (error) {
    // Redis 실패 시 SQS Fallback
    await this.sqsService.sendMessage({
      type: 'BANNER_CLICK',
      bannerId,
      timestamp: Date.now()
    });
    return { success: true, fallback: true };
  }
}
```

**조회 API (DB only):**

배너 성과 조회 API는 **Redis를 직접 조회하지 않고 DB만 단일 소스(Source of Truth)로 사용**합니다.  
Write 경로만 Redis를 거치고, Read 경로는 항상 `banner_daily_stats`를 조회하도록 분리했습니다.

- 장점: 조회 로직 단순화, 이중 합산/정합성 오류 방지
- 트레이드오프: 최대 10분 지연 허용
- 운영 보강: 매일 00시 이후 전일 데이터 1회 최종 REPLACE로 마감 정합성 보장

```typescript
@Get('/banners/:id/stats')
async getStats(
  @Param('id') bannerId: number,
  @Query('startDate') startDate: string,
  @Query('endDate') endDate: string,
) {
  // 조회는 DB 단일 소스만 사용
  const stats = await this.statsRepository.findByDateRange(
    bannerId, startDate, endDate,
  );

  return {
    impressions: stats.impressions,
    clicks: stats.clicks,
  };
}
```

---

## 핵심 구현 2: EventBridge + Lambda 배치 동기화

### 배치 아키텍처

EventBridge Scheduler가 Lambda를 두 가지 모드로 트리거합니다.

1. **정기 동기화 (10분마다)**: 당일 데이터를 REPLACE
2. **전일 최종 확정 (자정 이후 1회)**: 전일 데이터(D-1)를 한 번 더 REPLACE

전일 최종 확정 작업으로 날짜 경계(23:59~00:xx) 구간의 지연 이벤트까지 정리해, 조회 API가 DB만 바라봐도 일자별 정합성을 유지할 수 있습니다.

**Lambda 함수:**
```typescript
export const handler = async () => {
  let cursor = '0';
  const statsData = [];

  // 1. SCAN으로 Redis 데이터 조회
  do {
    const [nextCursor, keys] = await redis.scan(
      cursor, 'MATCH', '*:*', 'COUNT', 100
    );
    cursor = nextCursor;

    for (const key of keys) {
      const [date, bannerId] = key.split(':');
      const stats = await redis.hgetall(key);

      if (stats.IMPRESSION || stats.CLICK) {
        statsData.push({
          date,
          bannerId: parseInt(bannerId),
          impressions: parseInt(stats.IMPRESSION || '0'),
          clicks: parseInt(stats.CLICK || '0'),
        });
      }
    }
  } while (cursor !== '0');

  if (statsData.length === 0) return;

  // 2. RDS에 Bulk REPLACE (누적값 통째로 교체)
  // 정산 안전장치: GREATEST로 카운트 역행 방지 (아래 "운영 보강" 참조)
  await db.transaction(async (trx) => {
    await trx.raw(`
      INSERT INTO banner_daily_stats (date, banner_id, impressions, clicks)
      VALUES ${statsData.map(() => '(?, ?, ?, ?)').join(', ')}
      ON DUPLICATE KEY UPDATE
        impressions = GREATEST(banner_daily_stats.impressions, VALUES(impressions)),
        clicks = GREATEST(banner_daily_stats.clicks, VALUES(clicks))
    `, statsData.flatMap(s => [s.date, s.bannerId, s.impressions, s.clicks]));
  });

  // 3. TTL 7일 이상 된 Redis 데이터 정리
  await cleanupOldRedisData(7);
};
```

**전일 최종 확정 스케줄 (예시):**

```yaml
# 10분마다 정기 동기화
BannerStatsSyncSchedule:
  Type: AWS::Scheduler::Schedule
  Properties:
    ScheduleExpression: rate(10 minutes)
    Target:
      Input: '{"mode":"regular"}'

# 매일 00:05 전일(D-1) 최종 REPLACE
BannerStatsFinalizeSchedule:
  Type: AWS::Scheduler::Schedule
  Properties:
    ScheduleExpression: cron(5 0 * * ? *)
    Target:
      Input: '{"mode":"finalize_yesterday"}'
```

**REPLACE 방식의 데이터 정합성:**

배치 동기화는 INCREMENT(증분)가 아닌 **REPLACE(교체)** 방식입니다. Redis에 저장된 값은 HINCRBY로 계속 누적되는 값이므로, DB에는 Redis의 최신 누적값으로 통째로 교체합니다.

이 방식의 장점은 정합성 관리가 단순해진다는 점입니다:

- **SCAN~INSERT 사이에 새로운 HINCRBY가 발생하면?** → 다음 배치에서 최신 누적값으로 교체되므로 유실 없음
- **Lambda가 DB INSERT 중 실패하면?** → Redis 데이터는 그대로 유지되므로, 다음 배치에서 최신 값으로 재시도하여 자동 복구
- **같은 데이터가 2번 동기화되면?** → 동일한 값으로 교체될 뿐, 중복 적산되지 않음

**운영 보강 (정산 데이터 안전장치):**

정산/과금 데이터는 카운트 역행(값 감소)을 허용할 수 없기 때문에, 단순 REPLACE 대신 아래 가드레일을 추가했습니다.

1. **역행 방지 Upsert (`GREATEST`)**
```sql
INSERT INTO banner_daily_stats (date, banner_id, impressions, clicks)
VALUES (?, ?, ?, ?)
ON DUPLICATE KEY UPDATE
  impressions = GREATEST(banner_daily_stats.impressions, VALUES(impressions)),
  clicks = GREATEST(banner_daily_stats.clicks, VALUES(clicks));
```

2. **역행 감지 알람**
- 동기화 시 `incoming < current`가 감지되면 해당 키 동기화를 중단
- CloudWatch + Slack 알람으로 즉시 운영자 개입

이 가드레일로 Redis 데이터 이상 시 DB 카운트가 감소하는 사고를 방지했습니다.

### SCAN을 사용하는 이유

`KEYS` 명령어는 전체 키를 한 번에 탐색하여 Redis를 블로킹합니다. 반면 `SCAN`은 반복적으로 점진 탐색을 수행하기 때문에, Redis의 싱글스레드 특성상 다른 요청을 차단하지 않고 부하를 최소화합니다.

---

## 핵심 구현 3: SQS Fallback으로 데이터 유실 방지 (초기 운영 단계)

### Redis 장애 시나리오

- Redis 클러스터 재시작
- 네트워크 장애
- 메모리 부족 (OOM)

이런 상황에서도 배너 성과 데이터를 유실하면 안 됩니다.

> 이 Fallback은 **초기 운영 단계의 보호장치**로 도입했습니다.  
> 정산/과금 기준이 강화된 이후에는 `date + banner_id` 기준 REPLACE 동기화에 `GREATEST` 역행 방지와 역행 감지 알람을 주 정합성 전략으로 적용했습니다.

### SQS Fallback 메커니즘

**API에서 SQS 전송:**
```typescript
async incrementClick(bannerId: number) {
  try {
    // 1차: Redis 시도
    const dateKey = dayjs().format('YYYYMMDD');
    await this.redis.hincrby(`${dateKey}:${bannerId}`, 'CLICK', 1);
    return { success: true };

  } catch (error) {
    // 2차: SQS Fallback
    this.logger.warn(`Redis failed, fallback to SQS: ${bannerId}`);

    await this.sqs.sendMessage({
      QueueUrl: process.env.BANNER_STATS_QUEUE_URL,
      MessageBody: JSON.stringify({
        type: 'BANNER_CLICK',
        bannerId,
        timestamp: Date.now()
      })
    }).promise();

    return { success: true, fallback: true };
  }
}
```

**SQS Consumer:**
```typescript
@SqsMessageHandler('banner-stats-queue')
async handleMessage(message: Message) {
  const payload = JSON.parse(message.Body);

  // SQS 메시지는 DB에 직접 저장
  await this.db('banner_daily_stats')
    .where('banner_id', payload.bannerId)
    .increment('clicks', 1);
}
```

**DLQ (Dead Letter Queue) 설정:**
```yaml
BannerStatsQueue:
  Type: AWS::SQS::Queue
  Properties:
    QueueName: banner-stats-queue
    VisibilityTimeout: 60
    RedrivePolicy:
      deadLetterTargetArn: !GetAtt BannerStatsDLQ.Arn
      maxReceiveCount: 3

BannerStatsDLQ:
  Type: AWS::SQS::Queue
  Properties:
    QueueName: banner-stats-dlq
    MessageRetentionPeriod: 1209600  # 14일 보관
```

---

## 결과: DB 부하 10배 감소

### 지표 정의와 측정 기준

| 지표 | 값 | 측정 기준/기간 | 출처 |
|------|----|----------------|------|
| **Write IOPS 감소율** | **10배 이상 감소** | 적용 전/후 동일 트래픽 구간 비교 (운영 관측) | RDS 모니터링 대시보드 |
| **RDS CPU 사용률** | **약 20% 감소** | 적용 전/후 평균 CPU 비교 | CloudWatch `CPUUtilization` |
| **EC2 CPU 사용률** | **약 8% 감소** | 적용 전/후 평균 CPU 비교 | CloudWatch `CPUUtilization` |
| **Row-level Lock/Deadlock** | **운영 관측상 해소** | 적용 후 동일 이벤트 피크 구간 관찰 | DB lock/deadlock 로그 |

### 성능 개선

| 지표 | 개선 내용 |
|------|----------|
| **Write IOPS** | 10배 이상 감소 |
| **RDS CPU 사용률** | 약 20% 감소 |
| **EC2 CPU 사용률** | 약 8% 감소 |
| **Row-level Lock** | 완전 해소 |
| **Deadlock** | 완전 해소 |

ElastiCache 측은 CPU나 메모리 사용률에 유의미한 영향이 없었습니다. 단순 카운터 누적은 Redis에게 매우 가벼운 연산입니다.

### 비용

| 항목 | 변경 내용 |
|------|----------|
| **ElastiCache** | 기존 인프라 활용 (추가 비용 없음) |
| **EventBridge + Lambda** | 월 $1 미만 |
| **SQS** | Fallback 전용 (월 $0.5 미만) |

비용 지표는 AWS 청구서 기준 월 평균 관측값입니다. 기존 인프라를 그대로 활용하면서 성능, 비용, 안정성 모두 개선할 수 있었습니다.

### 다른 API 성능 회복

DB 부하가 감소하면서 같은 RDS를 사용하는 다른 API들의 응답 속도도 함께 개선되었습니다(운영 관측). 다만 서비스별 절대 응답시간은 트래픽/쿼리 특성이 달라 공통 단일 수치로 제시하지 않았습니다.

### 운영 후 회고: 아키텍처 전환 결정

Redis Write-back은 **성능 문제를 빠르게 해결**하는 데는 효과적이었습니다. 그러나 실제 운영에서는 설계 단계에서 과소평가했던 비용이 드러났습니다.

- 날짜 경계(23:59~00:xx) 정합성 보정
- Redis 장애/재시작 시 역행 방지 로직
- fallback, 재처리, 알람 운영 복잡도 증가
- 정산/과금 분쟁 대응을 위한 원본 근거 데이터 요구

결론적으로, 정산 데이터의 Source of Truth를 Redis 집계값에 두는 방식은 장기적으로 불리하다고 판단했습니다. 이후에는 **Firehose 기반 이벤트 원본 수집(S3 append-only) + 정산용 재집계 파이프라인**으로 전환했습니다.

전환 후 구조는 다음 원칙을 따릅니다.
- 원본 이벤트는 append-only로 보관 (감사 추적 가능)
- 정산 집계는 event_id 기준 dedup + watermark 기반 마감
- Redis는 정산 원장이 아니라 조회 성능 보조 용도로만 사용

---

## 배운 점

**1. 단순 카운터에는 인메모리 스토어가 적합**
- MySQL의 UPDATE + Lock 구조는 고빈도 카운터에 부적합
- Redis HINCRBY는 싱글스레드 특성으로 Lock 없이 원자적 처리

**2. 배치 주기는 데이터 유실 리스크와 타협**
- 일일 1회: DB 부하 최소지만 장애 시 하루치 유실 위험
- 10분: 유실 리스크와 DB 부하의 균형점
- EventBridge + Lambda로 서버리스 배치 구현

**3. SCAN은 프로덕션의 필수**
- KEYS 명령어는 Redis를 블로킹하여 서비스 장애 유발 가능
- SCAN으로 점진 탐색하여 부하 최소화

**4. Fallback 메커니즘은 필수**
- Redis 장애는 언제든 발생 가능
- SQS + DLQ로 데이터 유실 방지
- 추가 비용은 거의 없음

**5. Bulk REPLACE의 효과**
- 개별 INSERT 대비 DB 트랜잭션 횟수를 대폭 감소
- 10분간 누적된 데이터를 한 번의 트랜잭션으로 동기화

---

## 기술 스택

| 분류 | 기술 |
|------|------|
| **캐시/집계(초기)** | Redis (ElastiCache) |
| **데이터베이스** | MySQL (RDS) |
| **배치 스케줄러** | AWS EventBridge Scheduler |
| **배치 처리** | AWS Lambda |
| **Fallback** | AWS SQS + DLQ |
| **정산 파이프라인(후속 전환)** | AWS Firehose, S3, Athena/Redshift |
