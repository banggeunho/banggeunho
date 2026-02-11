# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a static portfolio website for Geunho Bang (방근호), a Software Engineer working on commerce platforms serving 3M+ users. The site consists of:
- Main portfolio site: Vanilla HTML, CSS, and JavaScript
- Project detail pages: Markdown-based with automated build system

## Development Workflow

### Local Development

**Main site:**
Open `portfolio/index.html` in a browser to view changes. No build step required.

**Project pages:**
1. Edit markdown files in `portfolio/projects/*/index.md`
2. Run build: `cd scripts && npm run build`
3. View: `open ../portfolio/build/projects/*/index.html`

### GitHub Actions Automation
This repository uses two Claude Code workflows for automated assistance:

1. **Claude Code Review** (`.github/workflows/claude-code-review.yml`)
   - Triggers on: PR opened, synchronized, ready_for_review, reopened
   - Uses: `anthropics/claude-code-action@v1` with `code-review` plugin
   - Provides automated code quality reviews on pull requests

2. **Claude PR Assistant** (`.github/workflows/claude.yml`)
   - Triggers on: issue comments, PR review comments, issues opened/assigned, PR reviews submitted
   - Activates when: `@claude` is mentioned in comments or issue/PR body
   - Uses: `anthropics/claude-code-action@v1`
   - Responds to tagged requests in issues and pull requests

## Architecture

### File Organization
```
portfolio/           # Portfolio site
├── index.html       # Main portfolio page
├── style.css        # GitHub dark theme-inspired design
├── script.js        # Navigation, animations
├── data/
│   └── projects.json  # Project metadata and links
├── projects/
│   ├── cdc-kafka-debezium/
│   │   ├── index.md      # Markdown content (EDIT THIS!)
│   │   └── images/       # Project images
│   ├── *.html            # Other projects (legacy HTML)
├── templates/
│   ├── project.ejs       # Project page template
│   └── partials/         # Reusable template parts
└── build/               # Build output (auto-generated)

scripts/
├── build.js         # Build system (MD → HTML)
└── package.json

assets/              # Static assets
└── header.svg       # Animated SVG header

.github/workflows/   # CI/CD automation
├── deploy.yml       # Auto-build and deploy
└── [claude workflows]
```

### Key Design Patterns

**docs/index.html:**
- Single-page application structure with semantic sections
- Korean language content (`lang="ko"`)
- External fonts: Inter (UI), JetBrains Mono (code)
- Projects link to actual GitHub repositories: CDC-Kafka-Debezium, concurrent-handler-lock, terraform-ecs-example, Spring-Boot-MSA

**docs/style.css:**
- CSS custom properties (variables) for theming: `--bg-primary`, `--accent`, `--text-primary`, etc.
- GitHub dark theme color palette (#0d1117, #58a6ff, #7ee787, etc.)
- Mobile-first responsive design with breakpoints at 768px and 480px
- Fade-in scroll reveal animations using IntersectionObserver

**docs/script.js:**
- **Code Rain Module**: Canvas-based animation with code snippets falling (similar to header.svg concept)
- **Navigation Module**: Scroll-based sticky nav, mobile hamburger menu, active link highlighting
- **Scroll Reveal Module**: IntersectionObserver-based fade-in animations for content sections

**assets/header.svg:**
- Self-contained animated SVG (no external dependencies)
- Three-layer code rain animation with varying speeds (14s-25s durations)
- Tech stack badges organized by category: Languages, Backend, Infrastructure, Data, Frontend
- Featured projects section with GitHub repository links
- Bottom wave animation for visual polish

## Repository Context

This portfolio showcases backend engineering expertise with focus on:
- Spring Boot, NestJS, Express (backend frameworks)
- Kafka, Debezium, CDC (data pipelines)
- AWS, Docker, Terraform (infrastructure)
- MySQL, Redis (data stores)

The static site approach (no build step) keeps deployment simple - the `docs/` folder can be served directly via GitHub Pages or any static host.

---

## Markdown-Based Project System

### Overview

Project detail pages use a markdown-based system that separates content from presentation. **DO NOT edit HTML files directly** - write markdown instead.

### Creating a New Project

**Step 1: Create project folder**
```bash
mkdir -p portfolio/projects/my-project/images
```

**Step 2: Write `index.md`**
```markdown
---
title: My Project Title
tags: [Tag1, Tag2, Tag3]
github: https://github.com/username/repo
thumbnail: images/thumbnail.png
date: 2025-02-07
---

## 개요

Project description here...

![Screenshot](images/screenshot.png)

## 주요 기능

- Feature 1
- Feature 2

## 기술 스택

Technologies used...

## 배운 점

What you learned...
```

**Step 3: Add images**
```bash
cp ~/your-images/*.png portfolio/projects/my-project/images/
```

**Step 4: Update projects.json**
Edit `portfolio/data/projects.json`:
```json
{
  "id": "my-project",
  "title": "My Project Title",
  "description": "Short description for main page",
  "tags": ["Tag1", "Tag2"],
  "github": "https://github.com/username/repo",
  "link": "projects/my-project/"
}
```

**Step 5: Build and deploy**
```bash
cd scripts
npm run build
cd ..
git add portfolio/projects/my-project/ portfolio/data/projects.json
git commit -m "Add: My Project"
git push
```

GitHub Actions will automatically build and deploy!

### Frontmatter Fields

**Required:**
- `title`: Project title (string)
- `tags`: Technology tags (array)
- `date`: Project date (YYYY-MM-DD)

**Optional:**
- `github`: GitHub repository URL (string)
- `thumbnail`: Thumbnail image path (string, relative to project folder)
- `demo`: Live demo URL (string)

### Markdown Guidelines

**Images:**
- Use relative paths: `![Description](images/filename.png)`
- Images are automatically copied during build
- Supported formats: PNG, JPG, GIF, SVG

**Headings:**
- Use `## Heading` for sections (H2)
- Avoid `# Heading` (H1 is reserved for title)

**Code blocks:**
```java
// Syntax highlighting supported
public class Example {
    // Your code here
}
```

**Links:**
- External: `[Link text](https://example.com)`
- GitHub repo is linked automatically via frontmatter

### Build System

**How it works:**
1. Scans `portfolio/projects/*/index.md` files
2. Parses frontmatter (YAML metadata)
3. Converts markdown content to HTML
4. Renders EJS template with data
5. Copies entire project folder (including images)
6. Outputs to `portfolio/build/`

**Build locally:**
```bash
cd scripts
npm run build
```

**Auto-deploy:**
Push to `main` branch → GitHub Actions builds → Deploys to GitHub Pages

### Template Customization

**DO NOT edit templates** unless changing site-wide design.

Templates are in `portfolio/templates/`:
- `project.ejs`: Main project page template
- `partials/nav.ejs`: Navigation bar
- `partials/footer.ejs`: Footer

### Troubleshooting

**Build fails:**
- Check frontmatter syntax (must be valid YAML)
- Ensure `index.md` exists in project folder
- Verify image paths are correct

**Images not showing:**
- Use relative paths: `images/file.png` not `/images/file.png`
- Check file exists in `portfolio/projects/*/images/`
- Supported extensions: `.png`, `.jpg`, `.jpeg`, `.gif`, `.svg`

**Project not appearing on main site:**
- Add entry to `portfolio/data/projects.json`
- Link should be `projects/project-name/` (with trailing slash)

### Migration from HTML

To migrate existing HTML project to markdown:

1. Create project folder: `portfolio/projects/project-name/`
2. Extract content from HTML file to `index.md`
3. Add frontmatter with metadata
4. Move images to `images/` subfolder
5. Update `projects.json` link
6. Delete old `.html` file
7. Test build and deploy
