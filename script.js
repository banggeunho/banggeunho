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
  const container = document.querySelector('.skills-categories');
  if (!container || !portfolioData.skills) return;

  while (container.firstChild) container.removeChild(container.firstChild);

  portfolioData.skills.categories.forEach(category => {
    const categoryDiv = document.createElement('div');
    categoryDiv.className = 'skill-category fade-in';

    const title = document.createElement('h3');
    title.textContent = category.name;

    const tagsDiv = document.createElement('div');
    tagsDiv.className = 'skill-tags';

    category.skills.forEach(skill => {
      const tag = document.createElement('span');
      tag.className = 'skill-tag';
      tag.style.setProperty('--tag-color', skill.color);

      if (skill.icon) {
        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.setAttribute('viewBox', '0 0 24 24');
        svg.setAttribute('width', '16');
        svg.setAttribute('height', '16');
        svg.setAttribute('fill', skill.color);
        svg.setAttribute('aria-hidden', 'true');
        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        path.setAttribute('d', skill.icon);
        svg.appendChild(path);
        tag.appendChild(svg);
      }

      const nameSpan = document.createElement('span');
      nameSpan.textContent = skill.name;
      tag.appendChild(nameSpan);

      tagsDiv.appendChild(tag);
    });

    categoryDiv.appendChild(title);
    categoryDiv.appendChild(tagsDiv);
    container.appendChild(categoryDiv);
  });
}

function renderAbout() {
  if (!portfolioData.about) return;

  // Render intro text in hero description
  const heroIntro = document.getElementById('hero-intro');
  if (heroIntro && portfolioData.about.intro.length > 0) {
    // Use first intro paragraph in hero
    heroIntro.textContent = portfolioData.about.intro[0];
  }

  // Render highlights as metric cards
  const metricsContainer = document.getElementById('hero-metrics');
  if (metricsContainer && portfolioData.about.highlights.length > 0) {
    metricsContainer.innerHTML = '';
    portfolioData.about.highlights.forEach((highlight, index) => {
      const card = document.createElement('div');
      card.className = 'metric-card';
      card.style.animationDelay = `${0.3 + index * 0.1}s`;
      card.innerHTML = `
        <div class="metric-number">${highlight.number}</div>
        <div class="metric-label">${highlight.label}</div>
      `;
      metricsContainer.appendChild(card);
    });
  }

  // Render expertise as tags
  const expertiseContainer = document.getElementById('hero-expertise');
  if (expertiseContainer && portfolioData.about.expertise.length > 0) {
    expertiseContainer.innerHTML = '';
    portfolioData.about.expertise.forEach(item => {
      const tag = document.createElement('span');
      tag.className = 'expertise-tag';
      tag.textContent = item.title;
      tag.title = item.description; // Tooltip on hover
      expertiseContainer.appendChild(tag);
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

// ========== Code Rain Canvas (Removed for clean light theme) ==========
// Animation removed to maintain clean, professional aesthetic

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
  const sections = document.querySelectorAll('.section, .hero');
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

// ========== Scroll Reveal (Disabled - Show all content immediately) ==========
(function initReveal() {
  function observeElements() {
    const targets = document.querySelectorAll(
      '.section-title, .project-card, .contact-content, .content-section, .skill-category'
    );

    // Immediately show all elements without animation
    targets.forEach((el) => {
      el.classList.add('fade-in');
      el.classList.add('visible');
    });
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
