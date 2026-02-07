// ========== Data Loading ==========
let portfolioData = {
  projects: [],
  about: null,
  skills: null
};

async function loadJSON(url) {
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Failed to load ${url}: ${response.status}`);
    return await response.json();
  } catch (error) {
    console.error('Error loading JSON:', error);
    showError('데이터를 불러오는 중 문제가 발생했습니다. 페이지를 새로고침해 주세요.');
    return null;
  }
}

async function loadAllData() {
  // Show loading skeleton
  showLoadingSkeleton();

  const [projects, about, skills] = await Promise.all([
    loadJSON('data/projects.json'),
    loadJSON('data/about.json'),
    loadJSON('data/skills.json')
  ]);

  portfolioData.projects = projects?.projects || [];
  portfolioData.about = about;
  portfolioData.skills = skills;

  renderContent();
}

function showLoadingSkeleton() {
  const grid = document.querySelector('.projects-grid');
  if (!grid) return;

  grid.innerHTML = '';

  // Create 4 skeleton cards
  for (let i = 0; i < 4; i++) {
    const skeleton = document.createElement('div');
    skeleton.className = 'skeleton-card';
    skeleton.innerHTML = `
      <div class="skeleton-thumbnail skeleton"></div>
      <div class="skeleton-body">
        <div class="skeleton-title skeleton"></div>
        <div class="skeleton-desc skeleton"></div>
        <div class="skeleton-desc skeleton"></div>
        <div class="skeleton-tags">
          <div class="skeleton-tag skeleton"></div>
          <div class="skeleton-tag skeleton"></div>
          <div class="skeleton-tag skeleton"></div>
        </div>
      </div>
    `;
    grid.appendChild(skeleton);
  }
}

function showError(message) {
  const grid = document.querySelector('.projects-grid');
  if (!grid) return;

  grid.innerHTML = `
    <div class="error-container" style="grid-column: 1 / -1;">
      <svg class="error-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="12" cy="12" r="10"/>
        <line x1="12" y1="8" x2="12" y2="12"/>
        <line x1="12" y1="16" x2="12.01" y2="16"/>
      </svg>
      <h3 class="error-title">문제가 발생했습니다</h3>
      <p class="error-message">${message}</p>
      <div class="error-actions">
        <button class="btn btn-primary" onclick="location.reload()">
          페이지 새로고침
        </button>
        <a href="https://github.com/banggeunho" class="btn btn-outline" target="_blank" rel="noopener">
          GitHub 방문
        </a>
      </div>
    </div>
  `;
}

function renderContent() {
  renderSkills();
  renderAbout();
  renderProjects();

  // Dispatch event to re-observe elements for scroll reveal
  window.dispatchEvent(new Event('contentLoaded'));
}

function renderSkills() {
  const container = document.querySelector('.hero-stack');
  if (!container || !portfolioData.skills) return;

  container.innerHTML = '';

  portfolioData.skills.categories.forEach(category => {
    const row = document.createElement('div');
    row.className = 'hero-stack-row';

    category.skills.forEach(skill => {
      const tag = document.createElement('span');
      tag.className = 'skill-tag';
      tag.textContent = skill.name;
      tag.style.setProperty('--tag-color', skill.color);
      if (skill.textColor) {
        tag.style.setProperty('--tag-text', skill.textColor);
      }
      row.appendChild(tag);
    });

    container.appendChild(row);
  });
}

function renderAbout() {
  if (!portfolioData.about) return;

  // Render intro paragraphs
  const aboutText = document.querySelector('.about-text');
  if (aboutText) {
    const existingParagraphs = aboutText.querySelectorAll('p');
    portfolioData.about.intro.forEach((text, index) => {
      if (existingParagraphs[index]) {
        existingParagraphs[index].textContent = text;
      }
    });
  }

  // Render highlights
  const highlightsContainer = document.querySelector('.about-highlights');
  if (highlightsContainer) {
    highlightsContainer.innerHTML = '';
    portfolioData.about.highlights.forEach(highlight => {
      const div = document.createElement('div');
      div.className = 'highlight';
      div.innerHTML = `
        <span class="highlight-number">${highlight.number}</span>
        <span class="highlight-label">${highlight.label}</span>
      `;
      highlightsContainer.appendChild(div);
    });
  }

  // Render expertise cards
  const detailsContainer = document.querySelector('.about-details');
  if (detailsContainer) {
    detailsContainer.innerHTML = '';
    portfolioData.about.expertise.forEach(item => {
      const card = document.createElement('div');
      card.className = 'detail-card fade-in';
      card.innerHTML = `
        <h3>${item.title}</h3>
        <p>${item.description}</p>
      `;
      detailsContainer.appendChild(card);
    });
  }
}

function renderProjects() {
  const grid = document.querySelector('.projects-grid');
  if (!grid || portfolioData.projects.length === 0) return;

  grid.innerHTML = '';

  portfolioData.projects.forEach(project => {
    const card = document.createElement('a');
    card.href = project.link;
    card.className = 'project-card fade-in';

    const thumbnail = project.image
      ? `<img src="${project.image}" alt="${project.title} project thumbnail">`
      : `<div class="project-thumbnail-placeholder">
           <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true">
             <rect x="3" y="3" width="18" height="18" rx="2"/>
             <circle cx="8.5" cy="8.5" r="1.5"/>
             <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/>
           </svg>
         </div>`;

    const tags = project.tags.map(tag => `<span>${tag}</span>`).join('');

    card.innerHTML = `
      <div class="project-thumbnail">
        ${thumbnail}
      </div>
      <div class="project-body">
        <h3 class="project-name">${project.title}</h3>
        <p class="project-desc">${project.description}</p>
        <div class="project-tags">${tags}</div>
      </div>
    `;

    grid.appendChild(card);
  });
}

// ========== Code Rain Canvas ==========
(function initCodeRain() {
  const canvas = document.getElementById('hero-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  // Check for reduced motion preference
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (prefersReducedMotion) {
    // Don't start animation if user prefers reduced motion
    return;
  }

  const snippets = [
    'const app = express();',
    '@Injectable()',
    'return await this.repo.find();',
    'await redis.set(key, val);',
    'SELECT * FROM orders WHERE',
    'kafka.producer.send(record);',
    '@Transactional',
    'consumer.subscribe({ topic });',
    'app.listen(3000, () => {',
    '@GetMapping("/api/v1")',
    'ResponseEntity.ok(body);',
    'docker build -t api .',
    'await queryRunner.connect();',
    'torch.nn.Linear(512, 256)',
    'CompletableFuture.supplyAsync',
    'pipe(map(), filter())',
  ];

  const colors = ['#58a6ff', '#7ee787', '#d2a8ff', '#ff7b72'];
  let columns = [];
  let w, h;

  function resize() {
    w = canvas.width = canvas.offsetWidth;
    h = canvas.height = canvas.offsetHeight;
    const colCount = Math.floor(w / 220);
    columns = [];
    for (let i = 0; i < colCount; i++) {
      columns.push({
        x: (i + 0.5) * (w / colCount),
        y: Math.random() * h,
        speed: 0.3 + Math.random() * 0.5,
        text: snippets[Math.floor(Math.random() * snippets.length)],
        color: colors[Math.floor(Math.random() * colors.length)],
        opacity: 0.04 + Math.random() * 0.08,
        size: 11 + Math.floor(Math.random() * 3),
      });
    }
  }

  function draw() {
    ctx.clearRect(0, 0, w, h);
    columns.forEach((col) => {
      ctx.font = col.size + 'px "JetBrains Mono", "Courier New", monospace';
      ctx.fillStyle = col.color;
      ctx.globalAlpha = col.opacity;
      ctx.fillText(col.text, col.x, col.y);
      col.y += col.speed;
      if (col.y > h + 20) {
        col.y = -20;
        col.text = snippets[Math.floor(Math.random() * snippets.length)];
        col.color = colors[Math.floor(Math.random() * colors.length)];
      }
    });
    ctx.globalAlpha = 1;
    requestAnimationFrame(draw);
  }

  window.addEventListener('resize', resize);
  resize();
  draw();
})();

// ========== Navigation ==========
(function initNav() {
  const nav = document.getElementById('nav');
  const toggle = document.getElementById('nav-toggle');
  const links = document.querySelector('.nav-links');

  // Scroll effect
  let ticking = false;
  window.addEventListener('scroll', () => {
    if (!ticking) {
      requestAnimationFrame(() => {
        nav.classList.toggle('scrolled', window.scrollY > 50);
        ticking = false;
      });
      ticking = true;
    }
  });

  // Mobile toggle
  if (toggle) {
    toggle.addEventListener('click', () => {
      toggle.classList.toggle('open');
      links.classList.toggle('open');
    });

    // Close on link click
    links.querySelectorAll('a').forEach((a) => {
      a.addEventListener('click', () => {
        toggle.classList.remove('open');
        links.classList.remove('open');
      });
    });
  }

  // Active link highlight
  const sections = document.querySelectorAll('.section');
  const navAnchors = document.querySelectorAll('.nav-links a');

  function updateActive() {
    let current = '';
    sections.forEach((sec) => {
      const top = sec.offsetTop - 120;
      if (window.scrollY >= top) {
        current = sec.getAttribute('id');
      }
    });
    navAnchors.forEach((a) => {
      a.classList.toggle('active', a.getAttribute('href') === '#' + current);
    });
  }

  window.addEventListener('scroll', updateActive);
  updateActive();
})();

// ========== Scroll Reveal ==========
(function initReveal() {
  function observeElements() {
    const targets = document.querySelectorAll(
      '.section-title, .about-text, .about-details, .detail-card, .project-card, .contact-content, .content-section'
    );

    targets.forEach((el) => el.classList.add('fade-in'));

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
          }
        });
      },
      { threshold: 0.1, rootMargin: '0px 0px -40px 0px' }
    );

    targets.forEach((el) => observer.observe(el));
  }

  // Initial observation
  observeElements();

  // Re-observe after content is loaded
  window.addEventListener('contentLoaded', observeElements);
})();

// ========== Initialize on DOM Ready ==========
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', loadAllData);
} else {
  loadAllData();
}
