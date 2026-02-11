# GitHub Header SVG Redesign

**Date:** 2026-02-07
**Type:** Design Document
**Status:** Ready for Implementation

## Design Concept

**Theme:** "Building Myself" - Code Architecture
**Style:** Creative & Artistic with 3D Isometric Building
**Message:** 다양한 기술들이 모여서 지금의 나를 만든 과정을 표현

## Visual Overview

### Layout Structure
- **Dimensions:** 1200px × 800px (viewBox="0 0 1200 800")
- **Split Layout:**
  - Left (0-500px): 3D Isometric Building
  - Right (500-1200px): Text Information & Tech Stack

### Color Palette (Dark Mode Premium)
- Background: #0d1117 (GitHub dark)
- Primary Accent: #58a6ff (blue)
- Success Green: #7ee787
- Warning Orange: #ff9900
- Purple Accent: #d2a8ff
- Borders: #30363d

## Left Section: Isometric Building

### Building Structure (Bottom to Top)

**1. Foundation Layer - LANGUAGES**
- 가장 넓은 기반층
- Technologies: C, Java, JavaScript, TypeScript, Python
- Visual: 단단한 블록 형태, 각 언어가 다른 색상의 큐브
- Colors: C=#A8B9CC, Java=#ED8B00, JS=#F7DF1E, TS=#3178C6, Python=#3776AB
- Animation: 0-3s, blocks rise from below with 0.2s stagger

**2. Second Layer - FRONTEND & BACKEND**
- 첫 번째 층보다 살짝 좁음
- Left Side (Backend): Spring (#6DB33F), NestJS (#E0234E), Express (#353535)
- Right Side (Frontend): React (#61DAFB), Vue (#4FC08D), jQuery (#0769AD), Handlebars (#000000)
- Visual: 투명하고 현대적인 느낌, 중앙에서 연결
- Animation: 2-5s, converge from left and right to center

**3. Third Layer - INFRASTRUCTURE**
- 반투명 유리 재질 효과
- Technologies: AWS (#FF9900), Docker (#2496ED), ECS (#FF9900), Kubernetes (#326CE5), GitHub Actions (#2088FF), GitLab (#FC6D26), nginx (#009639)
- Visual: 얇고 넓게 펼쳐진 형태
- Animation: 4-7s, fade-in with transparency effect

**4. Fourth Layer - DATA**
- 파이프와 노드가 연결된 회로 디자인
- Technologies: MySQL (#4479A1), Redis (#DC382D), Kafka (#231F20), Debezium (#FF6A00), AWS SQS (#FF9900), PyTorch (#EE4C2C)
- Visual: 선으로 연결되어 데이터 흐름 표현
- Animation: 6-9s, circuit lines draw with stroke animation

**5. Summit - CAREER**
- 최상층 플랫폼
- Text: "Software Engineer" in 3D
- Visual: 은은한 글로우 효과
- Animation: 8-10s, appear with glow pulse

### Isometric Perspective
- Angle: 30° isometric view
- Visible faces: Front, left side, top
- Depth: Drop shadow `filter: drop-shadow(0 4px 8px rgba(0,0,0,0.3))`
- Side faces: 20% darker than base color
- Top faces: 10% lighter than base color

## Right Section: Text & Information

### Header (Top 150px)
- **Name:** "Geunho Bang"
  - Font: 'Segoe UI', system-ui, sans-serif
  - Size: 60px
  - Weight: 700
  - Color: #ffffff
  - Letter-spacing: slight

- **Subtitle:** "Software Engineer · Commerce Platform · 3M+ Users"
  - Size: 18px
  - Color: #8b949e
  - Spacing below: divider line (#30363d)

### Tech Stack Categories (Middle Section)

Each category displayed vertically with compact badges:

**LANGUAGES** (Label: 11px, #8b949e, uppercase, letter-spacing: 2px)
- Badges: C, Java, JavaScript, TypeScript, Python

**FRONTEND**
- Badges: React, Vue, jQuery, Handlebars

**BACKEND**
- Badges: Spring, NestJS, Express

**INFRASTRUCTURE**
- Badges: AWS, Docker, ECS, Kubernetes, GitHub Actions, GitLab, nginx

**DATA**
- Badges: MySQL, Redis, Kafka, Debezium, AWS SQS, PyTorch

**Badge Styling:**
- Size: 12-13px
- Padding: 4px 8px
- Border-radius: 4px
- Font: 'Segoe UI', sans-serif
- Weight: 500
- Wrap with spacing

### Featured Projects (Bottom Section)

Small link cards with icons:
- CDC-Kafka-Debezium
- concurrent-handler-lock
- terraform-ecs-example
- Spring-Boot-MSA

Format: One-line cards with GitHub link icons

## Animation Strategy

### Building Sequence (10s total)
1. **Languages (0-3s):** Blocks rise and assemble
2. **Frontend/Backend (2-5s):** Converge from sides to center
3. **Infrastructure (4-7s):** Fade in with transparency
4. **Data (6-9s):** Circuit lines draw
5. **Summit (8-10s):** Glow and pulse

### Continuous Animations
- Code rain background: opacity 0.05, continuous fall
- Summit glow: 3s pulse cycle
- Tech blocks: subtle hover hints (visual feedback)

## Technical Implementation

### SVG Structure
```
<svg viewBox="0 0 1200 800">
  <!-- Background -->
  <rect fill="#0d1117"/>

  <!-- Code rain (optional, subtle) -->
  <g opacity="0.05">...</g>

  <!-- Left: Isometric Building -->
  <g transform="translate(250, 400)">
    <!-- Layer 1: Languages -->
    <!-- Layer 2: Frontend/Backend -->
    <!-- Layer 3: Infrastructure -->
    <!-- Layer 4: Data -->
    <!-- Layer 5: Summit -->
  </g>

  <!-- Right: Text Information -->
  <g transform="translate(550, 100)">
    <!-- Header -->
    <!-- Tech Stack Categories -->
    <!-- Featured Projects -->
  </g>
</svg>
```

### Glow Effects
- Summit: `filter: drop-shadow(0 0 20px rgba(88, 166, 255, 0.4))`
- Key tech (Java, Spring, AWS): subtle outer glow

### Typography
- Headers: 'Segoe UI', system-ui, sans-serif
- Code: 'JetBrains Mono', 'Courier New', monospace
- Badges: 12-13px, medium weight

### Responsive Considerations
- Fixed viewBox: 1200x800
- Critical elements within central 800px
- Scales proportionally on GitHub README

## Design Goals Achieved

✅ Creative & Artistic style
✅ 3D Isometric architecture concept
✅ Dark Mode Premium aesthetic
✅ Building Up animation (LEGO-like assembly)
✅ Split layout (building + text)
✅ Meaningful narrative: technologies building career
✅ Visible on GitHub (1200x800 size)

## Next Steps

1. Implement SVG structure
2. Add isometric building layers with correct colors
3. Implement animation sequences
4. Add text and tech stack badges
5. Fine-tune spacing and alignment
6. Test on GitHub README
7. Optimize file size if needed

---

**Design Approved:** 2026-02-07
**Ready for Implementation:** Yes
