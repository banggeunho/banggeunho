# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a static portfolio website for Geunho Bang (방근호), a Backend Engineer working on commerce platforms serving 3M+ users. The site is built with vanilla HTML, CSS, and JavaScript - no build tools, no dependencies, no package managers.

## Development Workflow

### Local Development
Since this is a pure static site, simply open `docs/index.html` in a browser to view changes. No build step required.

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
docs/           # Main portfolio site (deployable static content)
├── index.html  # Single-page portfolio with sections: hero, about, skills, projects, contact
├── style.css   # GitHub dark theme-inspired design with custom CSS variables
└── script.js   # Three main modules: code rain canvas animation, navigation, scroll reveal

assets/         # Static assets
└── header.svg  # Animated SVG header with tech stack badges and code rain effect

.github/workflows/  # CI/CD automation
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
