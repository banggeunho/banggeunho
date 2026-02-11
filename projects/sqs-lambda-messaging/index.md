---
title: SQS + Lambda 대량 문자 발송 시스템
tags: [AWS SQS, Lambda, NestJS, MySQL]
github: https://github.com/banggeunho
thumbnail: images/thumbnail.svg
date: 2024-03-01
---

## 개요

월 100만 건 이상의 문자 메시지를 안정적으로 발송하는 비동기 시스템을 설계하고 구축했습니다.

## 배경

기존에는 API 서버에서 문자 발송을 동기적으로 처리하고 있었습니다. 마케팅 캠페인이나 대량 알림 발송 시 서버에 부하가 집중되어 다른 API 응답 속도까지 영향을 받았고, 발송 실패 시 재처리 로직도 없었습니다.

## 아키텍처

SQS + Lambda 기반의 비동기 처리 구조를 도입했습니다.

1. **NestJS API 서버**: 발송 요청을 받아 SQS 큐에 메시지를 전달
2. **SQS**: 메시지를 큐에 저장하고 Lambda로 전달 (배치 처리)
3. **Lambda**: 큐에서 메시지를 꺼내 외부 문자 발송 API 호출

## 주요 성과

- 월 100만 건 이상 안정 처리
- API 서버 부하 분리로 응답 속도 영향 제거
- 실패 메시지 DLQ(Dead Letter Queue) 기반 재처리
- 서버리스 구조로 트래픽에 따른 자동 스케일링

## 기술적 포인트

- SQS 배치 사이즈 및 동시 실행 수 튜닝
- Lambda 콜드 스타트 최소화를 위한 설정 최적화
- DLQ + CloudWatch 알람을 통한 실패 모니터링
