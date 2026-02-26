# Journey Timeline Section Design

## Overview

포트폴리오에 커리어 성장 스토리를 세로 타임라인으로 추가한다.

## Placement

Hero → **Journey (NEW)** → Projects → Skills → Footer

## Section Structure

### Header
- 섹션 타이틀: "Journey"
- 도입 문구: "책임감을 배운 군 복무에서 시작해, 연구와 실전을 거쳐 운영 서비스의 문제를 해결하는 엔지니어가 되기까지."

### Timeline Nodes (6개)

| # | 시기 뱃지 | 제목 | 핵심 요약 | 키워드 태그 |
|---|-----------|------|-----------|------------|
| 1 | 군 복무 | 대한민국 육군 하사 | 예하부대 연락 업무, 작전 상황 관리. 전문하사로 전환하여 맡은 업무를 끝까지 마무리 | 책임감, 리더십 |
| 2 | 대학교 | HCI 연구실 연구원 | AI 기반 행동분류 연구, CNN/시계열 논문 작성 (2년) | CNN, 시계열, 논문 |
| 3 | 아카데미 | 카카오엔터프라이즈 SW Academy 1기 | 50명 중 2명 인턴 전환. 웹 개발 라이프사이클, 클라우드, 데이터 엔지니어링 | Cloud Native, Web Dev |
| 4 | 인턴 | 카카오엔터프라이즈 RaaS플랫폼개발팀 | 주문 수집 배치, 상품 이미지 검증 API 구현. 실서비스 운영 첫 경험 | Spring Boot, Batch |
| 5 | 클라우드 | 카카오클라우드 | 클라우드 기반 콘텐츠 가이드 제작 및 POC | Cloud, POC |
| 6 | **현재** | **비누커머스 백엔드 엔지니어** | 300만 유저 커머스 플랫폼. 검색, 결제, 보안, 인프라 등 백엔드 전반 주도 | OpenSearch, AWS, Kafka |

## Visual Design

- **중앙 세로 라인**: `var(--border)` 색상, 2px
- **노드 점**: 12px 원형. 기본 `var(--border)`, 현재(6번)만 `var(--accent)` + glow
- **좌우 교차**: 홀수(1,3,5)는 왼쪽, 짝수(2,4,6)는 오른쪽
- **시기 뱃지**: mono 폰트, pill 형태
- **제목**: `--text-primary`, font-weight 600
- **요약**: `--text-secondary`, 1~2줄
- **태그**: 기존 프로젝트 태그와 동일 스타일 (accent border pill)
- **현재 단계**: accent border + 좌측 accent bar 강조
- **스크롤 애니메이션**: 기존 fade-in + IntersectionObserver
- **모바일 (768px 이하)**: 라인 왼쪽 이동, 모든 노드 오른쪽 정렬

## Data

`portfolio/data/journey.json`으로 분리 관리.

## Navigation

기존 nav에 Journey 링크 추가: Projects | Journey | Skills

## Files to Create/Modify

- CREATE: `portfolio/data/journey.json`
- MODIFY: `portfolio/index.html` (Journey 섹션 + nav 링크 추가)
- MODIFY: `portfolio/style.css` (타임라인 스타일)
- MODIFY: `portfolio/script.js` (JSON 로딩 + 렌더링 + 스크롤 애니메이션)
