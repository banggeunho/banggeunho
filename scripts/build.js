#!/usr/bin/env node

const fs = require('fs-extra');
const path = require('path');
const matter = require('gray-matter');
const { marked } = require('marked');
const ejs = require('ejs');

// Function to create slug from heading text
function createSlug(text) {
  return text
    .toLowerCase()
    .replace(/[^\w\s가-힣-]/g, '')  // Keep alphanumeric, spaces, Korean, hyphens
    .replace(/\s+/g, '-')            // Replace spaces with hyphens
    .replace(/-+/g, '-')             // Replace multiple hyphens with single
    .trim();
}

// Configure marked for better code rendering
const renderer = new marked.Renderer();

// Custom heading renderer to add IDs
renderer.heading = function(text, level) {
  const slug = createSlug(text);
  return `<h${level} id="${slug}">${text}</h${level}>\n`;
};

// Custom code renderer
renderer.code = function(code, language) {
  return `<pre><code class="language-${language || ''}">${code}</code></pre>`;
};

marked.use({
  gfm: true,
  breaks: true,
  renderer: renderer
});

// Paths
const ROOT_DIR = path.join(__dirname, '..');
const PORTFOLIO_DIR = path.join(ROOT_DIR, 'portfolio');
const PROJECTS_DIR = path.join(PORTFOLIO_DIR, 'projects');
const TEMPLATES_DIR = path.join(PORTFOLIO_DIR, 'templates');
const BUILD_DIR = path.join(PORTFOLIO_DIR, 'build');

/**
 * Scan projects directory and return list of project folder names
 */
function scanProjects() {
  if (!fs.existsSync(PROJECTS_DIR)) {
    console.error(`Projects directory not found: ${PROJECTS_DIR}`);
    return [];
  }

  const entries = fs.readdirSync(PROJECTS_DIR, { withFileTypes: true });
  return entries
    .filter(entry => entry.isDirectory())
    .map(entry => entry.name)
    .filter(name => {
      // Check if index.md exists
      const indexPath = path.join(PROJECTS_DIR, name, 'index.md');
      return fs.existsSync(indexPath);
    });
}

/**
 * Wrap H2 sections in <section class="content-section">
 */
function wrapSections(html) {
  // Split by h2 tags (with or without attributes like id)
  const parts = html.split(/(<h2[^>]*>)/);

  if (parts.length <= 1) return html; // No h2 tags

  let result = parts[0]; // Content before first h2

  for (let i = 1; i < parts.length; i += 2) {
    if (i + 1 < parts.length) {
      const h2Tag = parts[i];
      const content = parts[i + 1];

      // Find next h2 or end of content
      const nextH2Index = content.search(/<h2[^>]*>/);
      const sectionContent = nextH2Index > 0
        ? content.substring(0, nextH2Index)
        : content;
      const rest = nextH2Index > 0
        ? content.substring(nextH2Index)
        : '';

      // Wrap in section
      result += `<section class="content-section">\n${h2Tag}${sectionContent}</section>\n${rest}`;
    }
  }

  return result;
}

/**
 * Convert mermaid code blocks to proper mermaid divs
 */
function convertMermaidBlocks(html) {
  // Replace <pre><code class="language-mermaid"> with <pre class="mermaid">
  return html.replace(
    /<pre><code class="language-mermaid">([\s\S]*?)<\/code><\/pre>/g,
    (match, content) => {
      // Decode HTML entities in mermaid content
      const decoded = content
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&amp;/g, '&')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'");
      return `<pre class="mermaid">${decoded}</pre>`;
    }
  );
}

/**
 * Process a single project
 */
function processProject(projectName) {
  console.log(`Processing project: ${projectName}`);

  const projectDir = path.join(PROJECTS_DIR, projectName);
  const indexPath = path.join(projectDir, 'index.md');

  // 1. Read index.md
  const mdContent = fs.readFileSync(indexPath, 'utf-8');

  // 2. Parse frontmatter
  const { data: frontmatter, content: markdownContent } = matter(mdContent);

  // 3. Convert markdown to HTML
  let htmlContent = marked.parse(markdownContent);

  // 4. Fix remaining raw **bold** markers (marked GFM bug with CJK chars)
  htmlContent = htmlContent.replace(
    /\*\*([^*<>]+?)\*\*/g,
    '<strong>$1</strong>'
  );

  // 5. Convert mermaid code blocks to proper format
  htmlContent = convertMermaidBlocks(htmlContent);

  // 6. Wrap H2 sections in <section class="content-section">
  htmlContent = wrapSections(htmlContent);

  // 6. Load template
  const templatePath = path.join(TEMPLATES_DIR, 'project.ejs');
  const template = fs.readFileSync(templatePath, 'utf-8');

  // 7. Render template
  const html = ejs.render(template, {
    project: {
      ...frontmatter,
      content: htmlContent
    }
  }, {
    filename: templatePath // For include() to work
  });

  // 8. Create output directory
  const outputDir = path.join(BUILD_DIR, 'projects', projectName);
  fs.ensureDirSync(outputDir);

  // 9. Copy entire project folder (includes images, etc.)
  fs.copySync(projectDir, outputDir, {
    overwrite: true
  });

  // 10. Write HTML file
  const outputPath = path.join(outputDir, 'index.html');
  fs.writeFileSync(outputPath, html, 'utf-8');

  console.log(`✓ Built: ${projectName}/index.html`);
}

/**
 * Main build function
 */
function build() {
  console.log('Starting build...\n');

  // Clean build directory
  if (fs.existsSync(BUILD_DIR)) {
    fs.removeSync(BUILD_DIR);
    console.log('✓ Cleaned build directory\n');
  }

  // Create build directory
  fs.ensureDirSync(BUILD_DIR);

  // Copy portfolio files to build directory (excluding build, templates)
  console.log('Copying portfolio files...');

  // Copy root-level files (index.html, style.css, script.js, etc.)
  const filesToCopy = ['index.html', 'style.css', 'script.js', 'IMPLEMENTATION.md'];
  filesToCopy.forEach(file => {
    const srcPath = path.join(PORTFOLIO_DIR, file);
    if (fs.existsSync(srcPath)) {
      fs.copyFileSync(srcPath, path.join(BUILD_DIR, file));
    }
  });

  // Copy data folder if exists
  const dataDir = path.join(PORTFOLIO_DIR, 'data');
  if (fs.existsSync(dataDir)) {
    fs.copySync(dataDir, path.join(BUILD_DIR, 'data'));
  }

  // Copy existing project HTML files
  fs.ensureDirSync(path.join(BUILD_DIR, 'projects'));
  const projectsDir = path.join(PORTFOLIO_DIR, 'projects');
  if (fs.existsSync(projectsDir)) {
    const items = fs.readdirSync(projectsDir);
    items.forEach(item => {
      const srcPath = path.join(projectsDir, item);
      // Only copy .html files (skip markdown project folders)
      if (fs.statSync(srcPath).isFile() && item.endsWith('.html')) {
        fs.copyFileSync(srcPath, path.join(BUILD_DIR, 'projects', item));
      }
    });
  }

  console.log('✓ Copied portfolio files\n');

  // Scan and process markdown projects
  const projects = scanProjects();

  if (projects.length === 0) {
    console.warn('No markdown projects found! Build completed with existing HTML files.');
    return;
  }

  console.log(`Found ${projects.length} markdown project(s):\n`);

  projects.forEach(projectName => {
    try {
      processProject(projectName);
    } catch (error) {
      console.error(`✗ Error processing ${projectName}:`, error.message);
    }
  });

  console.log(`\n✓ Build completed! Output: ${BUILD_DIR}`);
}

// Run build
build();
