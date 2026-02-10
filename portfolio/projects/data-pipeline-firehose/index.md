---
title: 사용자 이벤트 로그 데이터 파이프라인
tags: [AWS Firehose, S3, Athena, Redshift, Tableau]
github: https://github.com/banggeunho
thumbnail: images/thumbnail.svg
date: 2024-04-01
---

## 목차
1. [배경: 1~2일 걸리는 데이터 분석](#배경-1-2일-걸리는-데이터-분석)
2. [문제 분석: 수동 데이터 수집의 한계](#문제-분석-수동-데이터-수집의-한계)
3. [해결 목표: 30분~1시간 이내 데이터 제공](#해결-목표-30분-1시간-이내-데이터-제공)
4. [아키텍처 설계: AWS 관리형 서비스 선택 이유](#아키텍처-설계-aws-관리형-서비스-선택-이유)
5. [핵심 구현 1: Firehose로 실시간 수집](#핵심-구현-1-firehose로-실시간-수집)
6. [핵심 구현 2: Parquet 변환으로 비용 70% 절감](#핵심-구현-2-parquet-변환으로-비용-70-절감)
7. [핵심 구현 3: Athena와 Redshift로 분석 자동화](#핵심-구현-3-athena와-redshift로-분석-자동화)
8. [결과: 데이터 리드타임 1~2일→30분](#결과-데이터-리드타임-1-2일-30분)

---

## 배경: 1~2일 걸리는 데이터 분석

"지난 주 프로모션 배너의 클릭률을 분석하고 싶어요."

마케팅팀의 요청입니다. 하지만 데이터를 전달받기까지 평균 1~2일이 걸렸습니다. 그 사이 캠페인은 이미 끝나있고, 다음 기획은 과거 데이터 없이 진행될 수밖에 없었습니다.

**기존 프로세스:**
```
1. 데이터 담당자가 어드민에서 직접 다운로드 또는 개발팀에 데이터 요청
2. 개발팀이 DB 직접 조회 후 전달
3. 데이터 담당자가 전처리 (중복 제거, 포맷 변환)
4. 데이터 웨어하우스에 수동 적재
5. 1~2일 후 분석 가능
```

개발자는 반복적인 데이터 추출 작업에 시간을 빼앗기고, 데이터 담당자는 적시에 데이터를 확보하지 못하는 상황이었습니다.

---

## 문제 분석: 수동 데이터 수집의 한계

### 수동 프로세스의 문제점

**1. 데이터 리드타임 (1~2일)**
```
- 요청 접수: 수 시간 (업무 시간대 차이)
- DB 조회: 1시간 (쿼리 작성 + 실행)
- 데이터 전처리: 1시간 (중복 제거, 포맷 변환)
- 적재: 1시간
- 합계: 최소 반나절 → 보통 1~2일
```

**2. 개발자 리소스 낭비**
- 주당 5~10건의 데이터 추출 요청
- 개발자 1명이 주 10시간 소비
- 월 40시간 = 1주일치 생산성 손실

**3. 데이터 정합성 이슈**
```python
# 수동 전처리 과정에서 실수 가능
df = df.drop_duplicates()  # 어떤 컬럼 기준?
df['date'] = pd.to_datetime(df['date'])  # 포맷 일관성?
df.to_csv('output.csv', encoding='utf-8')  # 인코딩 이슈?
```

**4. 히스토리 추적 불가**
- 어제의 데이터와 오늘의 데이터가 다르면 원인 파악이 어렵습니다.
- 누가, 언제, 어떤 로직으로 전처리했는지 기록이 남지 않습니다.

---

## 해결 목표: 당일 데이터 제공

### 정량적 목표
- **데이터 리드타임**: 1~2일 → 당일 데이터 리드 가능
- **처리 용량**: 월 평균 3,000만 건, 피크 5,000만 건

### 정성적 목표
- 개발자 개입 없이 자동화
- Tableau 대시보드 자동 업데이트
- 데이터 유실률 0%

---

## 아키텍처 설계: AWS 관리형 서비스 선택 이유

### 직접 구축 vs AWS 관리형

| 기준 | Kafka + Spark | AWS Firehose |
|------|--------------|--------------|
| 초기 구축 시간 | 2주 | 1일 |
| 운영 부담 | 높음 (클러스터 관리) | 없음 (완전 관리형) |
| 비용 | 높음 (EC2 상시 운영) | 종량제 |
| 확장성 | 수동 스케일링 | 자동 무한 확장 |
| 학습 곡선 | 높음 | 낮음 |

**AWS 관리형 선택 이유:**
- 트래픽이 적을 때는 비용 거의 0원
- 서버 관리 불필요
- 5,000만 건/월 피크에도 문제없이 처리

### 전체 아키텍처

```mermaid
graph TB
    subgraph 이벤트_수집["① 이벤트 수집"]
        A[사용자 행동<br/>구매 · 조회 · 검색 · 클릭] -->|이벤트 전송| B[NestJS API<br/>putRecordBatch]
    end

    subgraph 수집_파이프라인["② 수집 파이프라인 (AWS Managed)"]
        B -->|JSON 스트림| C[AWS Firehose<br/>버퍼링: 5MB / 5분]
        C -->|배치 전달| D[Lambda<br/>Parquet + Snappy 변환]
    end

    subgraph 저장["③ 저장"]
        D -->|Parquet 파일| E["S3<br/>year=/month=/day= 파티셔닝"]
    end

    subgraph 분석_레이어["④ 분석 레이어"]
        E -->|"즉시 조회 (5분 지연)"| F[Athena<br/>서버리스 쿼리]
        E -->|"매일 새벽 COPY"| G[Redshift<br/>데이터 웨어하우스]
    end

    subgraph 시각화["⑤ 시각화"]
        F -->|실시간 대시보드| H[Tableau]
        G -->|정기 리포트| H
    end
```

### 수집 이벤트 예시

```typescript
// 구매
POST /events/purchase
{ userId, productId, amount, timestamp }

// 상품상세 조회
POST /events/view
{ userId, productId, timestamp }

// 장바구니 담기
POST /events/cart
{ userId, productId, timestamp }

// 검색
POST /events/search
{ userId, keyword, timestamp }

// 배너 클릭/노출
POST /events/banner
{ userId, bannerId, type: 'click' | 'view', timestamp }

// 페이지 이동
POST /events/pageview
{ userId, page, referrer, timestamp }

// 회원가입
POST /events/signup
{ userId, channel, timestamp }

// 로그인
POST /events/login
{ userId, timestamp }
```

---

## 핵심 구현 1: Firehose로 실시간 수집

### Firehose 설정

**CloudFormation 템플릿:**
```yaml
EventsFirehose:
  Type: AWS::KinesisFirehose::DeliveryStream
  Properties:
    DeliveryStreamName: user-events-stream
    ExtendedS3DestinationConfiguration:
      BucketARN: !GetAtt EventsBucket.Arn
      Prefix: events/year=!{timestamp:yyyy}/month=!{timestamp:MM}/day=!{timestamp:dd}/
      ErrorOutputPrefix: errors/
      CompressionFormat: GZIP
      BufferingHints:
        SizeInMBs: 5
        IntervalInSeconds: 300  # 5분마다 저장
      ProcessingConfiguration:
        Enabled: true
        Processors:
          - Type: Lambda
            Parameters:
              - ParameterName: LambdaArn
                ParameterValue: !GetAtt ParquetTransformLambda.Arn
```

**버퍼링 설정 선택 이유:**
- 5MB 또는 5분 중 먼저 도달하는 조건으로 동작합니다.
- 트래픽이 적으면 5분 대기 (비용 절감)
- 트래픽이 많으면 5MB마다 저장 (지연 최소화)

### API 통합

**NestJS 이벤트 전송:**
```typescript
@Injectable()
export class EventService {
  constructor(
    private readonly firehose: AWS.Firehose
  ) {}

  async trackEvent(event: UserEvent) {
    // Firehose에 전송
    await this.firehose.putRecord({
      DeliveryStreamName: 'user-events-stream',
      Record: {
        Data: JSON.stringify({
          ...event,
          timestamp: Date.now(),
          server_timestamp: new Date().toISOString()
        }) + '\n'  // 줄바꿈 필수 (Athena 파싱)
      }
    }).promise();
  }
}
```

**배치 전송 최적화:**
```typescript
// 개별 전송 (느림)
for (const event of events) {
  await firehose.putRecord({ ... });  // 10ms × 100건 = 1초
}

// 배치 전송 (빠름)
await firehose.putRecordBatch({
  DeliveryStreamName: 'user-events-stream',
  Records: events.map(e => ({
    Data: JSON.stringify(e) + '\n'
  }))
});  // 100ms × 1번 = 100ms
```

---

## 핵심 구현 2: Parquet 변환으로 비용 70% 절감

### JSON vs Parquet

| 포맷 | 크기 (100만 건) | Athena 스캔 비용 | 쿼리 속도 |
|------|----------------|-----------------|----------|
| JSON (GZIP) | 1GB | $5/TB × 1GB = $0.005 | 10초 |
| Parquet | 300MB | $5/TB × 0.3GB = $0.0015 | 2초 |
| **절감** | **70%** | **70%** | **5배** |

### Lambda Transform 함수

**Parquet 변환 (PyArrow):**

Firehose는 이벤트를 배치(최대 3MB 또는 900초)로 묶어서 Lambda에 전달합니다. Lambda는 배치 내 모든 레코드를 변환하여 반환합니다.

```python
import json
import base64
import pyarrow as pa
import pyarrow.parquet as pq
from io import BytesIO

def lambda_handler(event, context):
    output = []

    # Firehose가 배치로 전달한 레코드들을 순회
    for record in event['records']:
        # 1. Base64 디코딩
        payload = base64.b64decode(record['data']).decode('utf-8')
        data = json.loads(payload)

        # 2. 스키마 정의
        schema = pa.schema([
            ('user_id', pa.int64()),
            ('event_type', pa.string()),
            ('product_id', pa.int64()),
            ('amount', pa.float64()),
            ('timestamp', pa.timestamp('ms')),
            ('server_timestamp', pa.timestamp('ms'))
        ])

        # 3. Parquet로 변환
        table = pa.Table.from_pydict({
            'user_id': [data['userId']],
            'event_type': [data['eventType']],
            'product_id': [data.get('productId')],
            'amount': [data.get('amount')],
            'timestamp': [pa.scalar(data['timestamp'], type=pa.timestamp('ms'))],
            'server_timestamp': [pa.scalar(data['server_timestamp'], type=pa.timestamp('ms'))]
        }, schema=schema)

        # 4. 바이너리로 변환
        buf = BytesIO()
        pq.write_table(table, buf, compression='snappy')

        output.append({
            'recordId': record['recordId'],
            'result': 'Ok',
            'data': base64.b64encode(buf.getvalue()).decode('utf-8')
        })

    return {'records': output}
```

**압축 알고리즘 비교:**
```
- None: 500MB (빠름, 비쌈)
- GZIP: 300MB (느림, 저렴)
- Snappy: 350MB (빠름, 중간) ✅ 선택
```

---

## 핵심 구현 3: Athena와 Redshift로 분석 자동화

### Athena 테이블 생성

**Athena 쿼리 (즉시 조회):**
```sql
-- 일별 구매 금액
SELECT
  DATE(from_unixtime(timestamp / 1000)) as date,
  COUNT(*) as purchase_count,
  SUM(amount) as total_amount
FROM events
WHERE event_type = 'purchase'
  AND year = '2024' AND month = '05'
GROUP BY DATE(from_unixtime(timestamp / 1000))
ORDER BY date DESC;
```

**실행 시간:**
```
Before (JSON):
- 스캔 데이터: 10GB
- 실행 시간: 50초
- 비용: $0.05

After (Parquet):
- 스캔 데이터: 2GB
- 실행 시간: 10초 (5배 향상)
- 비용: $0.01 (80% 절감)
```

### Redshift 적재 (배치)

**30분 간격 배치:**
```sql
-- COPY 명령어로 S3 → Redshift
COPY analytics.events
FROM 's3://my-events-bucket/events/year=2026/month=01/day=08/'
IAM_ROLE 'arn:aws:iam::123456789:role/RedshiftS3Role'
FORMAT AS PARQUET;
```

**테이블 구조:**
```sql
CREATE TABLE analytics.events (
  user_id BIGINT,
  event_type VARCHAR(50),
  product_id BIGINT,
  amount DECIMAL(10,2),
  timestamp TIMESTAMP,
  server_timestamp TIMESTAMP
)
DISTKEY(user_id)
SORTKEY(timestamp);
```

S3의 Hive 스타일 파티셔닝(`year=/month=/day=`)은 Athena에서 자동으로 파티션으로 인식되며, Redshift에는 날짜별로 COPY 명령을 실행하여 적재합니다.

### Tableau 연동 및 최신 데이터 적재

**Redshift 커넥터:**
- 증분 적재 방식 사용 (비용 절감)

---

## 결과: 데이터 리드타임 1~2일→30분

### 리드타임 단축

| 단계 | Before            | After |
|------|-------------------|-------|
| 데이터 수집 | 어드민 다운로드 / 개발팀 요청 | 자동 (Firehose) |
| 전처리 | 수동 (1시간)          | 자동 (Lambda) |
| 적재 | 수동 (1시간)          | 자동 (S3) |
| **리드타임** | **1~2일**          | **30분** |

기존에는 데이터 담당자가 어드민에서 직접 다운로드하거나 개발팀에 데이터를 요청한 뒤, 전처리를 거쳐 수동으로 적재해야 했습니다. 파이프라인 구축 후 이 과정이 완전히 자동화되었습니다.

### 비용

| 항목 | 내용 |
|------|------|
| **추가 인프라 비용** | 월 약 10만원 |
| **스토리지 절감** | Parquet 적용으로 70% 절감 |
| **개발자 시간 절약** | 월 40시간 (데이터 추출 작업 제거) |

### 처리 성능

```
- 월 평균 처리량: 3,000만 건
- 월 피크 처리량: 5,000만 건
- 일 평균: 100만 건
- 데이터 유실: 측정 기간 6개월간 0건 (AWS SDK, Firehose 자동 재시도)
```

### 자동화 성과

- Tableau 대시보드 자동 업데이트
- 개발팀 데이터 요청 대응 시간: 1~2일 → 불필요

---

## 배운 점

**1. AWS 관리형 서비스의 위력**
- Firehose + Lambda + S3로 완전 자동화를 달성했습니다.
- 서버 관리 불필요, 종량제 과금으로 비용을 최소화했습니다.
- 비용 검증 필수

**2. Parquet는 필수**
- 스토리지 비용 70% 절감
- Athena 쿼리 속도 5배 향상
- 압축은 Snappy (빠르고 적절한 압축률, Recommend)

**3. 분석 레이어 이원화**
- Athena: 실시간 조회
- Redshift: 배치 적재 (30분 지연)
- 용도에 따라 적절한 도구를 선택하는 것이 중요합니다.

**4. 데이터 파티셔닝**
```
s3://bucket/events/year=2024/month=05/day=08/
```
- 날짜별 파티션으로 쿼리 성능을 향상시켰습니다.
- 불필요한 데이터 스캔을 방지하여 비용도 절감됩니다.

**5. 히스토리 추적**
- S3 버전 관리로 데이터 복구가 가능합니다.

---

## 기술 스택

| 분류 | 기술                               |
|------|----------------------------------|
| **이벤트 수집** | AWS Data Firehose  (서버리스) |
| **데이터 변환** | AWS Lambda (Python, PyArrow)     |
| **스토리지** | S3 (Parquet + Snappy)            |
| **쿼리 엔진** | Athena (서버리스)                    |
| **데이터 웨어하우스** | Redshift (서버리스)                  |
| **시각화** | Tableau                          |
