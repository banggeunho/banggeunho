---
title: 실시간 이미지 최적화 시스템
tags: [Lambda@Edge, CloudFront, S3, WebP, AVIF]
github: https://github.com/banggeunho
thumbnail: images/thumbnail.svg
date: 2024-03-01
---

## 목차
1. [배경: 트래픽 30% 증가, 비용은 어떻게?](#배경-트래픽-30-증가-비용은-어떻게)
2. [문제 분석: 원본 이미지 서빙의 낭비](#문제-분석-원본-이미지-서빙의-낭비)
3. [해결 목표: 비용 절감과 속도 개선](#해결-목표-비용-절감과-속도-개선)
4. [아키텍처 설계: Lambda@Edge 선택 이유](#아키텍처-설계-lambdaedge-선택-이유)
5. [핵심 구현 1: CloudFront Functions로 어뷰징 방지](#핵심-구현-1-cloudfront-functions로-어뷰징-방지)
6. [핵심 구현 2: Lambda@Edge로 On-demand 처리](#핵심-구현-2-lambdaedge로-on-demand-처리)
7. [핵심 구현 3: 캐시 전략으로 히트율 극대화](#핵심-구현-3-캐시-전략으로-히트율-극대화)
8. [결과: 비용 68% 절감, 속도 50% 개선](#결과-비용-68-절감-속도-50-개선)

---

## 배경: 트래픽 30% 증가, 비용은 어떻게?

에브리타임은 대학생 커뮤니티 앱입니다. 2024년 3월, 우리 커머스 서비스가 앱 내 전용 '혜택탭'으로 노출되기 시작했습니다.

**변화의 규모:**
- 거의 모든 페이지에 배너와 상품 이미지 노출
- 출시 후 트래픽 30% 급증
- CloudFront 데이터 전송 비용 피크 월 90만 원 도달

"트래픽이 늘어나는 건 좋은데, 비용도 같이 늘어나네요." 팀 리더의 한마디에서 이 프로젝트가 시작되었습니다.

---

## 문제 분석: 원본 이미지 서빙의 낭비

### 기존 시스템의 문제

**1. 원본 이미지를 그대로 전송**
```
- 업로드: 1920x1080 (300KB) 이미지
- 실제 사용: 400x300 크기로 리사이징해서 표시
- 전송: 300KB 전체를 다운로드 😱
- 낭비: 200KB (66%)
```

**2. 서비스별 요구 크기가 제각각**
- 썸네일: 200x200
- 리스트뷰: 400x300
- 상세페이지: 800x600
- 배너: 1200x400

하지만 시스템은 모든 경우에 동일한 원본 이미지를 전송했습니다.

**3. 차세대 포맷 미지원**
```
- JPEG (100KB)
- WebP (60KB) - 40% 절감
- AVIF (45KB) - 55% 절감
```

JPEG만 지원했기 때문에 WebP, AVIF를 지원하는 모던 브라우저에서도 큰 파일을 다운로드했습니다.

**4. 클라이언트 단에서 크롭**
```html
<img src="original.jpg" style="width: 200px; height: 200px; object-fit: cover;">
```

이미지는 300KB를 전부 다운로드하고, 브라우저에서 200x200으로 잘라서 표시. UX 저하 + 대역폭 낭비.

---

## 해결 목표: 비용 절감과 속도 개선

### 정량적 목표
- **CloudFront 비용**: 50% 이상 절감
- **캐시 히트율**: 85% 이상 달성
- **페이지 로딩 속도**: 50% 개선
- **Lambda 타임아웃**: 95% 감소

### 정성적 목표
- On-demand 이미지 처리로 다양한 크기 요구사항 대응
- 차세대 포맷(WebP, AVIF) 자동 지원
- 악의적 요청 차단으로 비용 폭증 방지
- 기존 URL 구조 유지 (호환성 보장)

---

## 아키텍처 설계: Lambda@Edge 선택 이유

### Lambda@Edge vs EC2 vs ECS

이미지 리사이징 시스템을 구축할 때 고려한 3가지 옵션:

| 기준 | EC2/ECS | Lambda@Edge | S3 Pre-processing |
|------|---------|-------------|-------------------|
| 비용 | 상시 과금 | 요청당 과금 | 저장 공간 과다 |
| 확장성 | 수동 스케일링 | 자동 무한 확장 | 사전 생성 필요 |
| 지연시간 | Origin까지 왕복 | Edge에서 처리 | 빠름 |
| 유지보수 | 서버 관리 필요 | 완전 관리형 | 스크립트 관리 |
| 유연성 | 높음 | 중간 | 낮음 |

**Lambda@Edge를 선택한 이유:**
- **비용 효율**: 트래픽이 적을 때는 비용 거의 0원
- **글로벌 배포**: 전 세계 Edge Location에서 실행
- **완전 관리형**: 서버 관리 불필요
- **캐시 통합**: CloudFront와 네이티브 통합

### 전체 아키텍처

```mermaid
graph TB
    A[브라우저] -->|?w=400&h=300&f=webp&q=80| B[CloudFront]
    B --> C[CloudFront Functions]
    C -->|검증 OK| D{캐시 확인}
    C -.검증 실패.-> E[403 Forbidden]

    D -->|캐시 HIT| A
    D -->|캐시 MISS| F[Lambda@Edge]

    F -->|원본 요청| G[S3]
    G -->|원본 이미지| F
    F -->|리사이징<br/>포맷 변환| B
    B -->|캐시 저장| D
```

### URL 파라미터 설계

```
https://cdn.example.com/products/123.jpg?w=400&h=300&f=webp&q=80

- w: width (너비)
- h: height (높이)
- f: format (webp, avif, jpg, png)
- q: quality (1-100, 기본 80)
```

---

## 핵심 구현 1: CloudFront Functions로 어뷰징 방지

### 문제: 악의적 요청으로 비용 폭증

Lambda@Edge는 요청당 과금입니다. 악의적인 사용자가 다음과 같은 요청을 보내면?

```
?w=1&h=1    // 1x1 픽셀
?w=2&h=2    // 2x2 픽셀
?w=3&h=3    // 3x3 픽셀
...
?w=5000&h=5000  // 5000x5000 픽셀
```

각각 Lambda 실행 → 캐시되지 않음 → 비용 폭증 💸

### 해결: CloudFront Functions로 검증

CloudFront Functions는 Lambda@Edge보다 **1/6 저렴**하고 **10배 빠릅니다**.

**검증 로직:**
```javascript
function handler(event) {
  var request = event.request;
  var querystring = request.querystring;

  // 1. 포맷 검증
  var format = querystring.f?.value || 'jpg';
  var allowedFormats = ['jpg', 'jpeg', 'png', 'webp', 'avif'];
  if (!allowedFormats.includes(format)) {
    return {
      statusCode: 403,
      statusDescription: 'Invalid format'
    };
  }

  // 2. 크기 정규화 (100px 단위로 반올림)
  var width = parseInt(querystring.w?.value || 0);
  var height = parseInt(querystring.h?.value || 0);

  if (width > 0) {
    width = Math.round(width / 100) * 100;
    querystring.w = { value: width.toString() };
  }

  if (height > 0) {
    height = Math.round(height / 100) * 100;
    querystring.h = { value: height.toString() };
  }

  // 3. 범위 제한
  if (width > 2000 || height > 2000 || width < 50 || height < 50) {
    return {
      statusCode: 403,
      statusDescription: 'Invalid size'
    };
  }

  // 4. 품질 검증
  var quality = parseInt(querystring.q?.value || 80);
  if (quality < 1 || quality > 100) {
    quality = 80;
  }
  querystring.q = { value: quality.toString() };

  request.querystring = querystring;
  return request;
}
```

**효과:**
- `?w=387&h=287` → `?w=400&h=300` (정규화)
- 캐시 키 개수 **10배 감소**
- 캐시 히트율 **70% → 85%** 향상

---

## 핵심 구현 2: Lambda@Edge로 On-demand 처리

### Sharp 라이브러리 최적화

Sharp는 Node.js에서 가장 빠른 이미지 처리 라이브러리입니다. libvips 기반으로 C++로 작성되어 매우 빠릅니다.

**Lambda 코드 (Node.js 18):**
```javascript
const AWS = require('aws-sdk');
const sharp = require('sharp');
const s3 = new AWS.S3();

exports.handler = async (event) => {
  const request = event.Records[0].cf.request;
  const querystring = request.querystring;

  // 1. 원본 이미지 가져오기
  const key = request.uri.substring(1); // /products/123.jpg -> products/123.jpg
  const s3Object = await s3.getObject({
    Bucket: 'my-images-bucket',
    Key: key
  }).promise();

  // 2. 파라미터 파싱
  const width = parseInt(querystring.w?.value) || null;
  const height = parseInt(querystring.h?.value) || null;
  const format = querystring.f?.value || 'jpg';
  const quality = parseInt(querystring.q?.value) || 80;

  // 3. 이미지 처리
  let image = sharp(s3Object.Body);

  // 리사이징
  if (width || height) {
    image = image.resize({
      width: width,
      height: height,
      fit: 'inside',  // 비율 유지
      withoutEnlargement: true  // 원본보다 크게 안 함
    });
  }

  // 포맷 변환
  if (format === 'webp') {
    image = image.webp({ quality: quality });
  } else if (format === 'avif') {
    image = image.avif({ quality: quality });
  } else if (format === 'png') {
    image = image.png({ quality: quality });
  } else {
    image = image.jpeg({ quality: quality });
  }

  const buffer = await image.toBuffer();

  // 4. 응답 생성
  return {
    status: '200',
    headers: {
      'content-type': [{ key: 'Content-Type', value: `image/${format}` }],
      'cache-control': [{ key: 'Cache-Control', value: 'public, max-age=31536000' }], // 1년
      'content-length': [{ key: 'Content-Length', value: buffer.length.toString() }]
    },
    body: buffer.toString('base64'),
    bodyEncoding: 'base64'
  };
};
```

### Sharp Native Binary 배포 이슈

**문제: 로컬과 Lambda 환경의 차이**

Sharp는 네이티브 바이너리(libvips)에 의존하는 라이브러리입니다. 로컬 macOS(ARM64)에서 `npm install`하면 ARM64용 바이너리가 설치되지만, Lambda@Edge는 x64 Linux 환경에서 실행됩니다.

**해결: Docker로 Lambda 환경에서 빌드**

```dockerfile
# Lambda@Edge와 동일한 환경 (Amazon Linux 2)
FROM public.ecr.aws/lambda/nodejs:18

WORKDIR /app

# Sharp 설치 (x64 Linux용 바이너리)
RUN npm install sharp --platform=linux --arch=x64

# 나머지 의존성 설치
COPY package.json package-lock.json ./
RUN npm ci --production

# Lambda 함수 코드
COPY index.js ./
```

**배포 과정:**
1. Docker 컨테이너에서 `npm install` 실행
2. x64 Linux용 Sharp 바이너리 포함된 node_modules 생성
3. 전체를 zip으로 압축하여 Lambda@Edge에 배포

**주의사항:**
- 로컬에서 직접 zip으로 압축하면 ARM64 바이너리가 포함되어 Lambda에서 실행 실패
- CI/CD 파이프라인에서 Docker 빌드 자동화 필수

### Lambda 메모리 최적화

**문제:**
- 512MB 메모리: 평균 5초, 타임아웃 빈번 😱
- 1024MB 메모리: 평균 2초, 타임아웃 거의 없음 ✅
- 2048MB 메모리: 평균 1.8초, 비용 2배 💸

**선택: 1024MB**
- 비용은 512MB 대비 10% 증가
- 타임아웃 95% 감소 → 사용자 경험 대폭 개선

### A/B 테스트: 크기 정규화

**테스트 설계:**
```
- 그룹 A: 정규화 없음 (387px → 387px)
- 그룹 B: 100px 단위 정규화 (387px → 400px)
```

**결과:**
- 육안 차이: 거의 없음 (95% 사용자가 구분 못함)
- 캐시 키 개수: 10배 감소
- 캐시 히트율: 70% → 85%

**결론: 정규화 도입** ✅

---

## 핵심 구현 3: 캐시 전략으로 히트율 극대화

### 단계별 캐시 히트율 개선

**1단계: 기본 캐시 (히트율 50%)**
```
- URL 그대로 캐시
- ?w=387 과 ?w=388 은 다른 캐시
```

**2단계: 크기 정규화 (히트율 70%)**
```
- ?w=387 → ?w=400
- ?w=388 → ?w=400
- 같은 캐시 사용!
```

**3단계: 인기 크기 사전 워밍 (히트율 85%)**
```
- CloudWatch 분석: 상위 10개 크기가 전체의 80% 차지
- 인기 크기 (200, 400, 800, 1200px)를 배포 시 사전 생성
```

**사전 워밍 스크립트:**
```bash
#!/bin/bash

POPULAR_SIZES=(200 400 800 1200)
BUCKET="my-images-bucket"

for size in "${POPULAR_SIZES[@]}"; do
  aws s3 ls s3://$BUCKET/products/ | while read -r line; do
    file=$(echo $line | awk '{print $4}')

    # CloudFront URL 호출 (Lambda 실행 → 캐시 생성)
    curl -s "https://cdn.example.com/products/$file?w=$size&h=$size&f=webp" > /dev/null

    echo "Warmed: $file @ ${size}px"
  done
done
```

**최종 히트율: 85%** 🎉

---

## 결과: 비용 68% 절감, 속도 50% 개선

### 비용 절감

| 항목 | Before | After | 절감률 |
|------|--------|-------|--------|
| **CloudFront 전송** | $900/월 | $360/월 | 60% ⬇️ |
| **Lambda 실행** | - | $50/월 | - |
| **S3 스토리지** | $30/월 | $30/월 | - |
| **합계** | $930/월 | $440/월 | **68% ⬇️** |

**연간 절감액: $5,880 (약 780만 원)**

### 성능 개선

| 지표 | Before | After | 개선률 |
|------|--------|-------|--------|
| **평균 이미지 크기** | 300KB | 80KB | 73% ⬇️ |
| **페이지 로딩 속도** | 4.2초 | 2.1초 | 50% ⬇️ |
| **캐시 히트율** | 없음 | 85% | - |
| **Lambda 타임아웃** | - | <5% | 95% ⬇️ |

### Before vs After

**이미지 크기 비교 (상품 썸네일):**
```
Before:
- JPEG 원본: 1920x1080 (300KB)
- 브라우저에서 400x300으로 크롭

After:
- WebP 리사이징: 400x300 (60KB)
- 80% 절감!
```

**사용자 경험:**
```
Before:
- 상품 리스트 페이지 로딩: 4.2초
- 20개 상품 × 300KB = 6MB

After:
- 상품 리스트 페이지 로딩: 2.1초
- 20개 상품 × 60KB = 1.2MB
- 50% 빨라짐!
```

---

## 배운 점

**1. CloudFront Functions는 필수**
- Lambda@Edge만 쓰면 어뷰징에 취약
- Functions로 검증하면 비용 90% 절감
- 검증 로직은 가볍게, Lambda는 무겁게

**2. 크기 정규화의 위력**
- 387px → 400px 반올림
- 육안으로 거의 구분 못함
- 캐시 히트율 70% → 85% 향상

**3. Sharp 최적화 설정**
```javascript
resize({
  fit: 'inside',           // 비율 유지
  withoutEnlargement: true // 원본보다 크게 안 함
})
```
- 이 두 옵션으로 품질 유지 + 파일 크기 최소화

**4. Lambda 메모리는 비용이 아닌 투자**
- 512MB → 1024MB: 비용 10% 증가
- 타임아웃 95% 감소
- 사용자 이탈률 50% 감소
- ROI가 10배 이상!

**5. 사전 워밍의 중요성**
- CloudWatch로 인기 크기 분석
- 상위 10개가 전체의 80% 차지
- 배포 시 미리 캐시 생성 → 첫 요청도 빠르게
