/** HTML layout template — wraps content with sidebar, breadcrumbs, and styling */

import { readFileSync } from 'fs';
import { join } from 'path';

export function renderPage(opts: {
  title: string;
  content: string;
  navHtml: string;
  breadcrumbs: string;
  cssPath: string;
}): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(opts.title)} — claude-glass</title>
  <meta name="color-scheme" content="light dark">
  <link rel="stylesheet" href="${opts.cssPath}">
</head>
<body>
  <div class="layout">
    <aside class="sidebar">
      <div class="sidebar-header">
        <h1 class="logo"><a href="/">claude-glass</a></h1>
      </div>
      ${opts.navHtml}
    </aside>
    <main class="content">
      <div class="breadcrumbs">${opts.breadcrumbs}</div>
      <article>
        <h1 class="page-title">${escapeHtml(opts.title)}</h1>
        ${opts.content}
      </article>
    </main>
  </div>
</body>
</html>`;
}

function escapeHtml(str: string): string {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
