---
title: 사용자 이벤트 로그 데이터 파이프라인
tags: [AWS Firehose, S3, Athena, Redshift, Tableau]
github: https://github.com/banggeunho
date: 2024-04-01
---

## 개요
AWS 관리형 서비스 기반 실시간 데이터 파이프라인을 구축하여 데이터 확인 속도를 2~3일에서 1시간~1일로 단축했습니다.

## 문제 상황
**기존 데이터 수집:**
- 데이터 담당자가 수동으로 어드민 또는 DB 조회
- 전일 데이터를 정제하여 수동 적재
- 데이터 확인: 2~3일 소요

## 주요 성과
- 데이터 확인: 2~3일 → 1시간~1일
- 월 비용: 약 9,000원 (3,000만 건 처리)
- Tableau 작업: 50% 이상 자동화
- 주요 이벤트: 100% 수집

## 시스템 아키텍처
```mermaid
graph LR
    A[사용자 행동] --> B[Firehose]
    B --> C[Lambda<br/>Parquet 변환]
    C --> D[S3]
    D --> E[Athena]
    E --> F[Redshift]
    F --> G[Tableau]
```

## 주요 이벤트
- 구매, 상품상세, 장바구니 담기
- 로그인, 회원가입
- 장바구니 조회, 구매페이지 진입

## 주요 기능
**실시간 수집:**
- Firehose로 이벤트 스트리밍
- Lambda로 Parquet 변환
- S3 원본 백업 (장애 대비)

**데이터 분석:**
- Athena 간단 조회
- S3 → Redshift 적재
- Tableau 대시보드 연동

## 기술 스택
- AWS Firehose, Lambda, S3, Athena, Redshift, Tableau

## 배운 점
- AWS 관리형 서비스 활용
- 저비용 고효율 파이프라인
- 데이터 엔지니어링 기초
