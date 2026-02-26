// ========== Data Loading ==========
let portfolioData = {
  projects: [],
  about: null,
  skills: null,
  journey: null
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
  renderJourney();
  renderSkills();
  renderAbout();
  renderProjects();

  // Dispatch event to re-observe elements for scroll reveal
  window.dispatchEvent(new Event('contentLoaded'));
}

function renderJourney() {
  const timeline = document.querySelector('.journey-timeline');
  const introEl = document.querySelector('.journey-intro');
  if (!timeline || !portfolioData.journey) return;

  if (introEl && portfolioData.journey.intro) {
    introEl.textContent = portfolioData.journey.intro;
  }

  timeline.innerHTML = '';

  portfolioData.journey.items.forEach((item, index) => {
    const div = document.createElement('div');
    div.className = 'journey-item fade-in' + (item.current ? ' current' : '');

    const tags = item.tags.map(tag => `<span>${tag}</span>`).join('');
    const highlights = item.highlights && item.highlights.length > 0
      ? `<ul class="journey-highlights">${item.highlights.map(h => `<li>${h}</li>`).join('')}</ul>`
      : '';

    div.innerHTML = `
      <div class="journey-dot"></div>
      <div class="journey-content">
        <span class="journey-period">${item.period}</span>
        <span class="journey-date">${item.date}</span>
        <h3 class="journey-title">${item.title}</h3>
        <p class="journey-desc">${item.description}</p>
        ${highlights}
        <div class="journey-tags">${tags}</div>
      </div>
    `;

    timeline.appendChild(div);

    if (item.image) {
      const logo = document.createElement('div');
      logo.className = 'journey-logo' + ((index % 2 === 0) ? ' logo-right' : ' logo-left');
      logo.innerHTML = `<img src="${item.image}" alt="${item.title} logo">`;
      div.appendChild(logo);
    }
  });
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
    heroIntro.textContent = portfolioData.about.intro[0];
  }

  // Render impacts as list items
  const impactsContainer = document.getElementById('hero-impacts');
  if (impactsContainer && portfolioData.about.impacts && portfolioData.about.impacts.length > 0) {
    impactsContainer.innerHTML = '';
    portfolioData.about.impacts.forEach(impact => {
      const li = document.createElement('li');
      li.innerHTML = `
        <span class="impact-label">${impact.label}</span>
        <span class="impact-result">${impact.result}</span>
      `;
      impactsContainer.appendChild(li);
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
      '.section-title, .project-card, .contact-content, .content-section, .skill-category, .journey-item'
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

// ========== PDF Print with Project Details ==========
async function handlePrint() {
  try {
    // Fetch projects content
    const response = await fetch('data/projects-content.json');
    if (!response.ok) {
      console.warn('Could not load projects content, using basic print');
      window.print();
      return;
    }

    const projectsContent = await response.json();

    // Create or get print container
    let printContainer = document.querySelector('.print-projects-detail');
    if (!printContainer) {
      printContainer = document.createElement('div');
      printContainer.className = 'print-projects-detail';
      document.body.appendChild(printContainer);
    }

    // Clear and populate with project details
    printContainer.innerHTML = '';

    projectsContent.forEach(project => {
      const projectSection = document.createElement('div');
      projectSection.className = 'print-project';

      const title = document.createElement('h2');
      title.textContent = project.title;

      const tags = document.createElement('div');
      tags.className = 'print-project-tags';
      project.tags.forEach(tag => {
        const tagSpan = document.createElement('span');
        tagSpan.textContent = tag;
        tags.appendChild(tagSpan);
      });

      const content = document.createElement('div');
      content.innerHTML = project.content;

      projectSection.appendChild(title);
      projectSection.appendChild(tags);
      projectSection.appendChild(content);
      printContainer.appendChild(projectSection);
    });

    // Trigger print
    window.print();
  } catch (error) {
    console.error('Error loading project details for print:', error);
    window.print();
  }
}

// ========== Initialize on DOM Ready ==========
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', loadAllData);
} else {
  loadAllData();
}
