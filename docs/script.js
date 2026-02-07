// ========== Code Rain Canvas ==========
(function initCodeRain() {
  const canvas = document.getElementById('hero-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

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
  const targets = document.querySelectorAll(
    '.section-title, .about-text, .about-details, .detail-card, .skill-category, .project-card, .contact-content'
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
})();
