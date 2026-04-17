/** HTML layout template — wraps content with sidebar, breadcrumbs, and styling */

import { readFileSync } from 'fs';
import { join } from 'path';

export function renderPage(opts: {
  title: string;
  content: string;
  navHtml: string;
  breadcrumbs: string;
  cssPath: string;
  /** Full output path including prefix, e.g. "test/skills/Foo/index.html" */
  fullOutputPath?: string;
  /** Site name for display (e.g. "flicky", "slipbox") */
  siteName?: string;
  /** Site prefix for URL paths (e.g. "flicky", "slipbox") */
  sitePrefix?: string;
}): string {
  // Pagefind assets are scoped per-site at /<prefix>/_pagefind/.
  // Compute the relative path from this page to its site's prefix directory.
  let pagefindPrefix: string;
  if (opts.fullOutputPath) {
    // fullOutputPath = "prefix/path/to/index.html" — we need to reach "prefix/"
    // so depth is (total segments - 1) minus 1 for the prefix itself
    const depth = opts.fullOutputPath.split('/').length - 1;
    const prefixDepth = depth > 0 ? depth - 1 : 0;
    pagefindPrefix = prefixDepth > 0 ? '../'.repeat(prefixDepth) : '';
  } else {
    // Fallback: CSS depth (already relative to prefix dir)
    const cssDepth = opts.cssPath.split('/').filter(p => p === '..').length;
    pagefindPrefix = '../'.repeat(cssDepth);
  }
  const pagefindCssPath = pagefindPrefix + '_pagefind/pagefind-ui.css';
  const pagefindJsPath = pagefindPrefix + '_pagefind/pagefind-ui.js';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(opts.title)}${opts.siteName ? ` — ${escapeHtml(opts.siteName)}` : ''} — claude-glass</title>
  <meta name="color-scheme" content="light dark">
  <link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>🔍</text></svg>">
  <link rel="stylesheet" href="${opts.cssPath}">
  <link rel="stylesheet" href="${pagefindCssPath}">
</head>
<body>
  <div class="layout">
    <aside class="sidebar" data-pagefind-ignore>
      <div class="sidebar-header">
        <h1 class="logo"><a href="/">&#128269; claude-glass</a></h1>${opts.siteName ? `
        <div class="site-name"><a href="/${opts.sitePrefix || ''}/index.html">${escapeHtml(opts.siteName)}</a></div>` : ''}
      </div>
      <div class="sidebar-search" id="search"></div>
      ${opts.navHtml}
      <div class="sidebar-footer">
        <hr>
        <p><a href="https://github.com/cadentdev/claude-glass">Claude-glass</a> is an open source project on GitHub built by <a href="https://cadent.net/">Cadent</a>.</p>
      </div>
    </aside>
    <button class="mobile-menu-toggle" aria-label="Toggle navigation" aria-expanded="false">
      <span class="hamburger-icon"></span>
    </button>
    <main class="content">
      <div class="breadcrumbs">${opts.breadcrumbs}</div>
      <article${opts.siteName ? ` data-pagefind-meta="site:${escapeHtml(opts.siteName)}, title:${escapeHtml(opts.title)} — ${escapeHtml(opts.siteName)}"` : ''}>
        <h1 class="page-title">${escapeHtml(opts.title)}</h1>
        ${opts.content}
      </article>
    </main>
  </div>
  <script src="${pagefindJsPath}"></script>
  <script>
    window.addEventListener('DOMContentLoaded', function() {
      if (typeof PagefindUI !== 'undefined') {
        new PagefindUI({
          element: '#search',
          showSubResults: true,
          showImages: false,
          resetStyles: false,
        });
      }
      // Mobile menu toggle
      var toggle = document.querySelector('.mobile-menu-toggle');
      var sidebar = document.querySelector('.sidebar');
      if (toggle && sidebar) {
        toggle.addEventListener('click', function() {
          var expanded = sidebar.classList.toggle('sidebar-open');
          toggle.setAttribute('aria-expanded', expanded.toString());
        });
        // Close sidebar when clicking a nav link on mobile
        sidebar.addEventListener('click', function(e) {
          if (e.target.tagName === 'A' && window.innerWidth <= 768) {
            sidebar.classList.remove('sidebar-open');
            toggle.setAttribute('aria-expanded', 'false');
          }
        });
      }
    });
  </script>
</body>
</html>`;
}

function escapeHtml(str: string): string {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}
