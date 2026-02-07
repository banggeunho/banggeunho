# Portfolio - Markdown-based Static Site

마크다운으로 작성하는 포트폴리오 사이트입니다. HTML을 직접 편집하지 않고 마크다운 파일만 작성하면 자동으로 HTML로 변환됩니다.

## 🚀 Quick Start

### 새 프로젝트 추가하기

```bash
# 1. 프로젝트 폴더 생성
mkdir -p portfolio/projects/my-project/images

# 2. index.md 작성
cat > portfolio/projects/my-project/index.md << 'EOF'
---
title: My Project
tags: [React, TypeScript]
github: https://github.com/username/my-project
thumbnail: images/thumbnail.png
date: 2025-02-07
---

## 개요

프로젝트 설명...

![스크린샷](images/screenshot.png)
EOF

# 3. 이미지 추가
cp ~/your-images/* portfolio/projects/my-project/images/

# 4. Git 커밋 & 푸시
git add portfolio/projects/my-project/
git commit -m "Add: My Project"
git push
```

GitHub Actions가 자동으로 빌드하고 배포합니다!

### 로컬에서 테스트하기

```bash
cd scripts
npm install  # 최초 1회만
npm run build

# 결과 확인
open ../portfolio/build/projects/my-project/index.html
```

## 📁 디렉토리 구조

```
portfolio/
├── projects/
│   └── my-project/
│       ├── index.md          # 프로젝트 내용 (이것만 편집!)
│       └── images/           # 프로젝트 이미지
├── templates/
│   ├── project.ejs           # HTML 템플릿
│   └── partials/
└── build/                    # 빌드 결과 (자동 생성, git ignore)

scripts/
└── build.js                  # 빌드 스크립트
```

## ✍️ 마크다운 작성 가이드

### Frontmatter (필수)

```markdown
---
title: 프로젝트 제목
tags: [태그1, 태그2, 태그3]
github: https://github.com/username/repo  # 선택사항
thumbnail: images/thumbnail.png           # 선택사항
date: 2025-02-07
---
```

### 본문

일반적인 마크다운 문법을 사용하세요:

```markdown
## 제목

본문 텍스트...

- 리스트 항목 1
- 리스트 항목 2

![이미지 설명](images/image.png)

**굵게**, *기울임*, `코드`
```

### 이미지 추가

1. `portfolio/projects/프로젝트명/images/` 폴더에 이미지 복사
2. 마크다운에서 `![설명](images/파일명.png)` 사용
3. 상대 경로만 사용하면 됩니다!

## 🔧 기술 스택

- **빌드**: Node.js + Custom Script
- **템플릿**: EJS
- **마크다운**: marked, gray-matter
- **배포**: GitHub Actions + GitHub Pages

## 📝 기존 프로젝트 수정

```bash
# MD 파일만 수정
vim portfolio/projects/my-project/index.md

# 커밋 & 푸시
git add portfolio/projects/my-project/
git commit -m "Update: project description"
git push
```

## 🚢 배포

- **자동 배포**: `main` 브랜치에 푸시하면 GitHub Actions가 자동으로 빌드/배포
- **수동 배포**: GitHub Actions 페이지에서 "Run workflow" 클릭

빌드된 사이트는 `gh-pages` 브랜치에 배포됩니다.

## 📄 라이선스

MIT License
