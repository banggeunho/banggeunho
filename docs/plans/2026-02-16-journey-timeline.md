# Journey Timeline Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 포트폴리오에 커리어 성장 스토리를 세로 타임라인 섹션으로 추가한다.

**Architecture:** `journey.json` 데이터 파일을 만들고, `script.js`의 기존 패턴(loadJSON → render)을 따라 동적 렌더링한다. 중앙 세로 라인 기준 좌우 교차 배치하며, 모바일에서는 왼쪽 정렬로 전환한다.

**Tech Stack:** Vanilla HTML, CSS, JavaScript (빌드 도구 없음)

---

### Task 1: journey.json 데이터 파일 생성

**Files:**
- Create: `portfolio/data/journey.json`

**Step 1: 데이터 파일 작성**

```json
{
  "intro": "책임감을 배운 군 복무에서 시작해, 연구와 실전을 거쳐 운영 서비스의 문제를 해결하는 엔지니어가 되기까지.",
  "items": [
    {
      "period": "군 복무",
      "title": "대한민국 육군 하사",
      "description": "예하부대 연락 업무, 작전 상황 관리. 전문하사로 전환하여 맡은 업무를 끝까지 마무리",
      "tags": ["책임감", "리더십"],
      "current": false
    },
    {
      "period": "대학교",
      "title": "HCI 연구실 연구원",
      "description": "AI 기반 행동분류 연구, CNN/시계열 논문 작성 (2년)",
      "tags": ["CNN", "시계열", "논문"],
      "current": false
    },
    {
      "period": "아카데미",
      "title": "카카오엔터프라이즈 SW Academy 1기",
      "description": "50명 중 2명 인턴 전환. 웹 개발 라이프사이클, 클라우드, 데이터 엔지니어링",
      "tags": ["Cloud Native", "Web Dev"],
      "current": false
    },
    {
      "period": "인턴",
      "title": "카카오엔터프라이즈 RaaS플랫폼개발팀",
      "description": "주문 수집 배치, 상품 이미지 검증 API 구현. 실서비스 운영 첫 경험",
      "tags": ["Spring Boot", "Batch"],
      "current": false
    },
    {
      "period": "클라우드",
      "title": "카카오클라우드",
      "description": "클라우드 기반 콘텐츠 가이드 제작 및 POC",
      "tags": ["Cloud", "POC"],
      "current": false
    },
    {
      "period": "현재",
      "title": "비누커머스 백엔드 엔지니어",
      "description": "300만 유저 커머스 플랫폼. 검색, 결제, 보안, 인프라 등 백엔드 전반 주도",
      "tags": ["OpenSearch", "AWS", "Kafka"],
      "current": true
    }
  ]
}
```

**Step 2: 브라우저에서 JSON 로딩 확인**

Run: 브라우저 DevTools 콘솔에서 `fetch('data/journey.json').then(r=>r.json()).then(console.log)`
Expected: 6개 item이 포함된 JSON 객체 출력

**Step 3: Commit**

```bash
git add portfolio/data/journey.json
git commit -m "feat: add journey timeline data"
```

---

### Task 2: index.html에 Journey 섹션 및 nav 링크 추가

**Files:**
- Modify: `portfolio/index.html:51-61` (nav에 Journey 링크 추가)
- Modify: `portfolio/index.html:111-113` (Hero와 Projects 사이에 Journey 섹션 삽입)

**Step 1: nav에 Journey 링크 추가**

`portfolio/index.html`의 nav-links에 Journey 추가 (Projects 뒤에):

```html
<ul class="nav-links">
  <li><a href="#projects">Projects</a></li>
  <li><a href="#journey">Journey</a></li>
  <li><a href="#skills">Skills</a></li>
</ul>
```

**Step 2: Hero 섹션과 Projects 섹션 사이에 Journey 섹션 삽입**

`</section>` (Hero 닫힘) 다음, `<!-- Projects -->` 이전에 삽입:

```html
<!-- Journey -->
<section class="section section-alt" id="journey">
  <div class="container">
    <h2 class="section-title">Journey</h2>
    <p class="journey-intro"></p>
    <div class="journey-timeline">
      <!-- Timeline items loaded from data/journey.json -->
    </div>
  </div>
</section>
```

**Step 3: 브라우저에서 빈 섹션 확인**

Run: 브라우저에서 `portfolio/index.html` 열기
Expected: Hero 아래에 "Journey" 타이틀이 보이는 빈 섹션 표시, nav에 Journey 링크 클릭 시 해당 섹션으로 스크롤

**Step 4: Commit**

```bash
git add portfolio/index.html
git commit -m "feat: add journey section skeleton to index.html"
```

---

### Task 3: CSS 타임라인 스타일 추가

**Files:**
- Modify: `portfolio/style.css` (Skills Section 주석 이전, Hero 이후에 Journey 스타일 추가)

**Step 1: Journey 섹션 스타일 추가**

`portfolio/style.css`의 `/* ========== Skills Section ==========*/` 주석 바로 위에 다음 블록 삽입:

```css
/* ========== Journey Timeline ========== */
.journey-intro {
  font-size: 1.05rem;
  color: var(--text-secondary);
  line-height: 1.75;
  margin-bottom: 3rem;
  max-width: 600px;
}

.journey-timeline {
  position: relative;
  padding: 2rem 0;
}

/* Center vertical line */
.journey-timeline::before {
  content: '';
  position: absolute;
  left: 50%;
  top: 0;
  bottom: 0;
  width: 2px;
  background: var(--border);
  transform: translateX(-50%);
}

.journey-item {
  position: relative;
  display: flex;
  align-items: flex-start;
  margin-bottom: 3rem;
  width: 50%;
}

.journey-item:last-child {
  margin-bottom: 0;
}

/* Odd items: left side */
.journey-item:nth-child(odd) {
  justify-content: flex-end;
  padding-right: 3rem;
  text-align: right;
}

/* Even items: right side */
.journey-item:nth-child(even) {
  margin-left: 50%;
  padding-left: 3rem;
}

/* Timeline dot */
.journey-dot {
  position: absolute;
  top: 0.5rem;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: var(--bg-primary);
  border: 2px solid var(--border);
  z-index: 2;
}

.journey-item:nth-child(odd) .journey-dot {
  right: -6px;
}

.journey-item:nth-child(even) .journey-dot {
  left: -6px;
}

/* Current item dot */
.journey-item.current .journey-dot {
  border-color: var(--accent);
  background: var(--accent);
  box-shadow: 0 0 12px rgba(34, 197, 94, 0.4);
}

/* Content card */
.journey-content {
  max-width: 380px;
}

/* Current item accent bar */
.journey-item.current .journey-content {
  border-left: 2px solid var(--accent);
  padding-left: 1rem;
}

.journey-item:nth-child(odd).current .journey-content {
  border-left: none;
  border-right: 2px solid var(--accent);
  padding-left: 0;
  padding-right: 1rem;
}

/* Period badge */
.journey-period {
  display: inline-block;
  font-family: var(--font-mono);
  font-size: 0.75rem;
  font-weight: 500;
  color: var(--text-muted);
  background: var(--bg-tertiary);
  padding: 0.2rem 0.6rem;
  border-radius: 20px;
  margin-bottom: 0.5rem;
}

.journey-item.current .journey-period {
  color: var(--accent);
  background: var(--accent-subtle);
}

.journey-title {
  font-size: 1.05rem;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 0.35rem;
  line-height: 1.4;
}

.journey-desc {
  font-size: 0.875rem;
  color: var(--text-secondary);
  line-height: 1.65;
  margin-bottom: 0.75rem;
}

.journey-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.35rem;
}

.journey-item:nth-child(odd) .journey-tags {
  justify-content: flex-end;
}

.journey-tags span {
  font-size: 0.7rem;
  padding: 0.15rem 0.55rem;
  border-radius: 20px;
  color: var(--accent);
  border: 1px solid var(--accent-border);
  font-weight: 500;
}

/* Mobile: single-sided timeline */
@media (max-width: 768px) {
  .journey-timeline::before {
    left: 6px;
  }

  .journey-item,
  .journey-item:nth-child(even) {
    width: 100%;
    margin-left: 0;
    padding-left: 2.5rem;
    padding-right: 0;
    text-align: left;
    justify-content: flex-start;
  }

  .journey-item:nth-child(odd) {
    text-align: left;
    justify-content: flex-start;
    padding-right: 0;
    padding-left: 2.5rem;
  }

  .journey-dot,
  .journey-item:nth-child(odd) .journey-dot,
  .journey-item:nth-child(even) .journey-dot {
    left: 0;
    right: auto;
  }

  .journey-item:nth-child(odd) .journey-tags {
    justify-content: flex-start;
  }

  .journey-item:nth-child(odd).current .journey-content {
    border-right: none;
    border-left: 2px solid var(--accent);
    padding-right: 0;
    padding-left: 1rem;
  }

  .journey-content {
    max-width: 100%;
  }
}
```

**Step 2: 브라우저에서 스타일 적용 확인**

Run: 브라우저에서 새로고침
Expected: Journey 섹션이 어두운 배경(`section-alt`)으로 표시되고, 타이틀에 accent 밑줄이 보임

**Step 3: Commit**

```bash
git add portfolio/style.css
git commit -m "feat: add journey timeline CSS styles"
```

---

### Task 4: JavaScript 렌더링 로직 추가

**Files:**
- Modify: `portfolio/script.js:1-6` (portfolioData에 journey 추가)
- Modify: `portfolio/script.js:20-35` (loadAllData에 journey 로딩 추가)
- Modify: `portfolio/script.js:89-96` (renderContent에 renderJourney 호출 추가)
- Modify: `portfolio/script.js` (renderJourney 함수 추가 — renderSkills 앞에)

**Step 1: portfolioData에 journey 필드 추가**

`portfolio/script.js` 상단의 portfolioData 객체 수정:

```javascript
let portfolioData = {
  projects: [],
  about: null,
  skills: null,
  journey: null
};
```

**Step 2: loadAllData에 journey.json 로딩 추가**

```javascript
async function loadAllData() {
  showLoadingSkeleton();

  const [projects, about, skills, journey] = await Promise.all([
    loadJSON('data/projects.json'),
    loadJSON('data/about.json'),
    loadJSON('data/skills.json'),
    loadJSON('data/journey.json')
  ]);

  portfolioData.projects = projects?.projects || [];
  portfolioData.about = about;
  portfolioData.skills = skills;
  portfolioData.journey = journey;

  renderContent();
}
```

**Step 3: renderContent에 renderJourney 호출 추가**

```javascript
function renderContent() {
  renderJourney();
  renderSkills();
  renderAbout();
  renderProjects();

  window.dispatchEvent(new Event('contentLoaded'));
}
```

**Step 4: renderJourney 함수 추가**

`renderContent` 함수 바로 아래, `renderSkills` 함수 바로 위에 삽입:

```javascript
function renderJourney() {
  const timeline = document.querySelector('.journey-timeline');
  const introEl = document.querySelector('.journey-intro');
  if (!timeline || !portfolioData.journey) return;

  if (introEl && portfolioData.journey.intro) {
    introEl.textContent = portfolioData.journey.intro;
  }

  timeline.innerHTML = '';

  portfolioData.journey.items.forEach(item => {
    const div = document.createElement('div');
    div.className = 'journey-item fade-in' + (item.current ? ' current' : '');

    const tags = item.tags.map(tag => `<span>${tag}</span>`).join('');

    div.innerHTML = `
      <div class="journey-dot"></div>
      <div class="journey-content">
        <span class="journey-period">${item.period}</span>
        <h3 class="journey-title">${item.title}</h3>
        <p class="journey-desc">${item.description}</p>
        <div class="journey-tags">${tags}</div>
      </div>
    `;

    timeline.appendChild(div);
  });
}
```

**Step 5: initReveal에 journey-item 셀렉터 추가**

`portfolio/script.js`의 `observeElements` 함수 내 셀렉터에 `.journey-item` 추가:

```javascript
const targets = document.querySelectorAll(
  '.section-title, .project-card, .contact-content, .content-section, .skill-category, .journey-item'
);
```

**Step 6: 브라우저에서 전체 동작 확인**

Run: 브라우저에서 새로고침
Expected:
- Journey 섹션에 도입 문구 표시
- 6개 타임라인 노드가 좌우 교차로 표시
- 마지막 노드(비누커머스)에 accent 강조
- 태그가 pill 형태로 표시
- nav의 Journey 링크 클릭 시 해당 섹션으로 스크롤
- 모바일 뷰(DevTools 375px)에서 왼쪽 정렬 타임라인으로 전환

**Step 7: Commit**

```bash
git add portfolio/script.js
git commit -m "feat: add journey timeline rendering logic"
```

---

### Task 5: 최종 확인 및 정리

**Step 1: 전체 페이지 플로우 확인**

브라우저에서 확인 사항:
- [ ] Hero → Journey → Projects → Skills → Footer 순서
- [ ] 타임라인 노드 6개 모두 표시
- [ ] 좌우 교차 레이아웃 정상
- [ ] 현재(비누커머스) 노드 accent 강조
- [ ] 모바일 반응형 정상 (768px 이하)
- [ ] nav Journey 링크 활성화/스크롤 정상
- [ ] 콘솔 에러 없음

**Step 2: 최종 Commit**

```bash
git add -A
git commit -m "feat: add career journey timeline section to portfolio"
```
