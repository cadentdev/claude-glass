/** Landing page generator — site index with project cards and resources */

import type { SiteManifest } from '../types';

function escapeHtml(str: string): string {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function formatDate(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  } catch {
    return iso;
  }
}

export function renderLandingPage(manifest: SiteManifest): string {
  const cards = manifest.sites
    .map((site) => `
      <a href="/${escapeHtml(site.prefix)}/index.html" class="site-card">
        <h3 class="site-name">${escapeHtml(site.name)}</h3>
        <div class="site-stats">
          <span class="site-count">${site.fileCount} pages</span>
          <span class="site-date">Built ${formatDate(site.lastBuilt)}</span>
        </div>
      </a>`)
    .join('\n');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>claude-glass</title>
  <meta name="color-scheme" content="light dark">
  <link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>🔍</text></svg>">
  <link rel="stylesheet" href="style.css">
  <!-- Search is per-site; landing page has no global index -->
  <style>
    .landing { max-width: 800px; margin: 0 auto; padding: 3rem 2rem; }
    .landing-header { text-align: center; margin-bottom: 3rem; }
    .landing-title { font-size: 2rem; margin-bottom: 0.5rem; }
    .landing-subtitle { color: var(--text-muted); font-size: 1.1rem; }
    .site-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap: 1rem; margin-bottom: 3rem; }
    .site-card {
      display: block;
      background: var(--card-bg);
      border: 1px solid var(--border);
      border-radius: 8px;
      padding: 1.25rem;
      text-decoration: none;
      color: var(--text);
      transition: border-color 0.15s, box-shadow 0.15s;
    }
    .site-card:hover { border-color: var(--link); box-shadow: 0 2px 8px rgba(0,0,0,0.08); }
    .site-name { font-size: 1.1rem; margin: 0 0 0.5rem; text-align: center; }
    .site-stats { display: flex; justify-content: space-between; font-size: 0.85rem; color: var(--text-muted); }
    .resources { margin-bottom: 2rem; }
    .resources h2 { font-size: 1.2rem; margin-bottom: 0.75rem; border-bottom: 1px solid var(--border); padding-bottom: 0.3rem; }
    .resources ul { list-style: none; padding: 0; }
    .resources li { padding: 0.3rem 0; }
    .resources a { color: var(--link); text-decoration: none; }
    .resources a:hover { text-decoration: underline; }
    .getting-started { margin-bottom: 2rem; }
    .getting-started h2 { font-size: 1.2rem; margin-bottom: 0.75rem; border-bottom: 1px solid var(--border); padding-bottom: 0.3rem; }
    .getting-started pre { background: var(--code-bg); border: 1px solid var(--border); border-radius: 6px; padding: 1rem; overflow-x: auto; font-size: 0.85rem; }
    .getting-started code { font-family: 'JetBrains Mono', 'Fira Code', monospace; }
    .getting-started p { margin: 0.5rem 0; color: var(--text-muted); font-size: 0.9rem; }
    @media (max-width: 600px) {
      .landing { padding: 1.5rem 1rem; }
      .landing-title { font-size: 1.5rem; }
      .site-grid { grid-template-columns: 1fr; }
    }
  </style>
</head>
<body>
  <div class="landing">
    <div class="landing-header">
      <h1 class="landing-title">🔍 claude-glass</h1>
      <p class="landing-subtitle">Browse your Claude Code installations</p>
    </div>

    <div class="site-grid">
      ${cards}
    </div>

    <div class="resources">
      <h2>Resources</h2>
      <ul>
        <li><a href="https://docs.anthropic.com/en/docs/claude-code">Claude Code Documentation</a></li>
        <li><a href="https://github.com/cadentdev/claude-glass">claude-glass on GitHub</a></li>
      </ul>
    </div>

    <div class="getting-started">
      <h2>Getting Started</h2>
      <p>Serve your local Claude Code config instantly:</p>
      <pre><code>claude-glass serve</code></pre>
      <p>Build a named site:</p>
      <pre><code>claude-glass build ~/.claude --name my-project</code></pre>
      <p>To add any repo with a <code>.claude/</code> directory, specify the path:</p>
      <pre><code>claude-glass build ~/my-repo --name my-repo</code></pre>
      <p>Rebuild only when files change (ideal for cron jobs):</p>
      <pre><code>claude-glass build ~/.claude --name my-project --incremental</code></pre>
      <p>Each source directory gets its own section. Rebuild any site independently without affecting others.</p>
    </div>

    <footer style="text-align: center; margin-top: 2rem; padding-top: 1rem; border-top: 1px solid var(--border); color: var(--text-muted); font-size: 0.85rem;">
      <p><a href="https://github.com/cadentdev/claude-glass">Claude-glass</a> is an open source project on GitHub built by <a href="https://cadent.net/">Cadent</a>.</p>
    </footer>
  </div>
  <!-- Search is available within each site (per-site Pagefind index) -->
</body>
</html>`;
}
