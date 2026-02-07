---
title: 실시간 이미지 최적화 시스템
tags: [Lambda@Edge, CloudFront, S3, WebP, AVIF]
github: https://github.com/banggeunho
date: 2024-03-01
---

## 개요
에브리타임 혜택탭 출시로 트래픽 30% 증가 상황에서 Lambda@Edge 기반 On-demand 이미지 처리 시스템을 구축하여 비용을 68% 절감했습니다.

## 문제 상황
**에브리타임 혜택탭 출시:**
- 트래픽 30% 증가
- CloudFront 비용 피크 월 90만원

**기존 시스템의 문제:**
- 원본 이미지 그대로 서빙
- 서비스별 이미지 크기 제한 불일치
- 어드민 업로드 시점 제한 또는 앱에서 잘라서 표시

## 주요 성과
- CloudFront 전송량: 419GB → 132GB (68% 감소)
- 이미지 용량: 평균 85~90% 감소
- 월 비용: 90만원 → 28만원 (68% 절감)
- 페이지 로딩: 1.2초 → 0.6초 (50% 개선)

## 시스템 아키텍처
```mermaid
graph TB
    A[브라우저] -->|?w&h&f&q| B[CloudFront]
    B --> C[CloudFront Functions]
    C -->|검증 OK| D[Lambda@Edge]
    C -.검증 실패.-> E[403]
    D -->|원본 요청| F[S3]
    D -->|리사이징<br/>포맷 변환| B
    B -->|캐싱| A
```

## 주요 기능
**CloudFront Functions (어뷰징 방지):**
- 이미지 포맷 검증 (webp, avif, jpg, png만 허용)
- 크기 노멀라이제이션 (100 단위 반올림)
- 허용 범위 검증 (50px~2000px)
- 잘못된 쿼리 파라미터 차단

**Lambda@Edge (이미지 처리):**
- Sharp 라이브러리 기반 리사이징
- WebP/AVIF 포맷 변환
- 품질 조정 (기본 80%)

**프론트엔드:**
```html
<picture>
  <source srcset="?w=400&f=avif" type="image/avif">
  <source srcset="?w=400&f=webp" type="image/webp">
  <img src="?w=400&f=jpg" alt="상품">
</picture>
```

## 기술적 도전과 해결
**도전 1: Lambda@Edge 타임아웃**
- 해결: Sharp 최적화, 메모리 1024MB 할당

**도전 2: 비용 폭증 우려**
- 해결: CloudFront Functions 사전 검증, 캐시 효율 극대화

**도전 3: 캐시 히트율**
- 해결: 캐시 키 정규화, 인기 크기 우선 캐싱 (65% → 85%)

## 기술 스택
- Lambda@Edge, CloudFront Functions, S3
- Sharp (Node.js), TypeScript

## 배운 점
- 엣지 컴퓨팅 아키텍처 설계
- 차세대 이미지 포맷 활용
- AWS 비용 최적화 전략
