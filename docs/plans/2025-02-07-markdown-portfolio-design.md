# 마크다운 기반 포트폴리오 시스템 디자인

## 개요

현재 각 프로젝트마다 HTML 파일을 직접 작성해야 하는 구조를 마크다운 기반으로 전환합니다. 콘텐츠(마크다운)와 프레젠테이션(HTML 템플릿)을 분리하여 글 작성에만 집중할 수 있도록 합니다.

## 핵심 결정사항

1. **빌드 도구**: Node.js 스크립트 (정적 사이트 생성기 직접 구현)
2. **마크다운 구조**: 단일 파일 + Frontmatter
3. **템플릿 엔진**: EJS
4. **배포 방식**: GitHub Actions 자동 빌드
5. **이미지 관리**: 프로젝트별 폴더 (전체 폴더 복사 방식)

## 디렉토리 구조

```
portfolio/
├── projects/
│   ├── cdc-kafka-debezium/
│   │   ├── index.md               # 프로젝트 내용
│   │   └── images/                # 프로젝트 이미지들
│   │       ├── thumbnail.png
│   │       ├── architecture.png
│   │       └── screenshot-1.png
│   ├── bookbla/
│   │   ├── index.md
│   │   └── images/
│   └── ...
├── templates/
│   ├── project.ejs                # 프로젝트 상세 템플릿
│   └── partials/
│       ├── nav.ejs                # 공통 네비게이션
│       └── footer.ejs             # 공통 푸터
├── images/                        # 공통 이미지 (로고 등)
├── style.css
├── script.js
└── index.html                     # 메인 페이지
└── build/                         # 빌드 결과물 (git ignore)
    └── projects/
        └── cdc-kafka-debezium/
            ├── index.html         # 생성된 HTML
            ├── index.md           # 원본 MD (복사됨)
            └── images/            # 이미지들 (복사됨)

scripts/
├── build.js                       # 빌드 스크립트
└── package.json

.github/
└── workflows/
    └── deploy.yml                 # GitHub Actions 설정
```

## 마크다운 파일 형식

각 `index.md` 파일:

```markdown
---
title: CDC-Kafka-Debezium
tags: [Kafka, Debezium, CDC, MySQL, Java]
github: https://github.com/banggeunho/CDC-Kafka-Debezium
thumbnail: images/thumbnail.png
date: 2024-03-15
---

## 개요

CDC(Change Data Capture) 파이프라인을 Kafka와 Debezium을 활용하여 구축한 프로젝트입니다.

![아키텍처](images/architecture.png)

## 주요 기능

- MySQL binlog 기반의 실시간 변경 데이터 캡처
- Debezium Connector를 통한 Kafka 이벤트 스트리밍

![스크린샷](images/screenshot-1.png)

## 배운 점

프로젝트를 통해 배운 내용...
```

## 템플릿 구조 (EJS)

`templates/project.ejs`:

```html
<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <title><%= project.title %> | Geunho Bang</title>
  <link rel="stylesheet" href="../../style.css">
</head>
<body>
  <%- include('partials/nav') %>

  <main class="project-detail">
    <div class="container">
      <a href="../../index.html#projects" class="back-link">
        Projects
      </a>

      <% if (project.thumbnail) { %>
      <div class="project-detail-hero">
        <img src="<%= project.thumbnail %>" alt="<%= project.title %>">
      </div>
      <% } %>

      <div class="project-detail-header">
        <h1><%= project.title %></h1>
        <div class="project-detail-tags">
          <% project.tags.forEach(tag => { %>
            <span><%= tag %></span>
          <% }); %>
        </div>
        <% if (project.github) { %>
        <a href="<%= project.github %>" class="btn btn-outline" target="_blank">
          View on GitHub
        </a>
        <% } %>
      </div>

      <div class="project-detail-content">
        <%- project.content %>
      </div>
    </div>
  </main>

  <%- include('partials/footer') %>
  <script src="../../script.js"></script>
</body>
</html>
```

## 빌드 스크립트 로직

`scripts/build.js`:

```javascript
// 1. 프로젝트 폴더 스캔
const projects = scanProjects('portfolio/projects/');

// 2. 각 프로젝트 처리
projects.forEach(projectName => {
  // 2-1. index.md 읽기
  const mdContent = readFile(`projects/${projectName}/index.md`);

  // 2-2. Frontmatter 파싱 (gray-matter)
  const { data, content } = matter(mdContent);

  // 2-3. 마크다운 → HTML 변환 (marked)
  const htmlContent = marked.parse(content);

  // 2-4. 템플릿 렌더링 (ejs)
  const html = ejs.render(template, {
    project: { ...data, content: htmlContent }
  });

  // 2-5. 프로젝트 폴더 전체 복사
  copyFolder(
    `portfolio/projects/${projectName}/`,
    `portfolio/build/projects/${projectName}/`
  );

  // 2-6. HTML 파일 생성
  writeFile(`portfolio/build/projects/${projectName}/index.html`, html);
});
```

**필요한 npm 패키지:**
- `gray-matter`: frontmatter 파싱
- `marked`: 마크다운 → HTML 변환
- `ejs`: 템플릿 엔진
- `fs-extra`: 파일/폴더 복사

## GitHub Actions 자동 빌드/배포

`.github/workflows/deploy.yml`:

```yaml
name: Build and Deploy

on:
  push:
    branches: [ main ]
  workflow_dispatch:

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Install and Build
        run: |
          cd scripts
          npm install
          npm run build

      - uses: peaceiris/actions-gh-pages@v3
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./portfolio/build
          publish_branch: gh-pages
```

## 사용 워크플로우

### 새 프로젝트 추가

```bash
# 1. 폴더 생성
mkdir -p portfolio/projects/my-new-project/images

# 2. index.md 작성
vim portfolio/projects/my-new-project/index.md

# 3. 이미지 추가
cp ~/screenshots/*.png portfolio/projects/my-new-project/images/

# 4. 푸시
git add portfolio/projects/my-new-project/
git commit -m "Add: My New Project"
git push
```

### 기존 프로젝트 수정

```bash
# MD 파일만 수정
vim portfolio/projects/cdc-kafka-debezium/index.md
git add portfolio/projects/cdc-kafka-debezium/
git commit -m "Update: CDC project description"
git push
```

## 이미지 경로 처리

- **마크다운 작성 시**: `![설명](images/파일명.png)` (상대 경로)
- **빌드 시**: 프로젝트 폴더 전체 복사 (images/ 폴더 포함)
- **최종 HTML**: 경로 변환 불필요 (구조 동일 유지)
- **MD 에디터 미리보기**: 정상 작동

## 장점

1. **작성자 관점**: HTML 몰라도 됨, 마크다운만 작성
2. **유지보수**: 콘텐츠와 디자인 분리
3. **자동화**: 푸시만 하면 자동 배포
4. **미리보기**: MD 에디터에서 실시간 확인 가능
5. **버전 관리**: 소스(MD)만 Git 관리, 빌드 결과는 별도 브랜치

## 구현 계획

1. 빌드 스크립트 구현
2. 템플릿 파일 생성
3. 기존 HTML을 마크다운으로 마이그레이션
4. GitHub Actions 설정
5. 테스트 및 배포
