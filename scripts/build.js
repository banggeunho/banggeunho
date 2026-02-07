#!/usr/bin/env node

const fs = require('fs-extra');
const path = require('path');
const matter = require('gray-matter');
const { marked } = require('marked');
const ejs = require('ejs');

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
  const htmlContent = marked.parse(markdownContent);

  // 4. Load template
  const templatePath = path.join(TEMPLATES_DIR, 'project.ejs');
  const template = fs.readFileSync(templatePath, 'utf-8');

  // 5. Render template
  const html = ejs.render(template, {
    project: {
      ...frontmatter,
      content: htmlContent
    }
  }, {
    filename: templatePath // For include() to work
  });

  // 6. Create output directory
  const outputDir = path.join(BUILD_DIR, 'projects', projectName);
  fs.ensureDirSync(outputDir);

  // 7. Copy entire project folder (includes images, etc.)
  fs.copySync(projectDir, outputDir, {
    overwrite: true
  });

  // 8. Write HTML file
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

  // Ensure build directory exists
  fs.ensureDirSync(BUILD_DIR);

  // Scan and process projects
  const projects = scanProjects();

  if (projects.length === 0) {
    console.warn('No projects found!');
    return;
  }

  console.log(`Found ${projects.length} project(s):\n`);

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
