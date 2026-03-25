# Release Notes

## v0.7.0 (2026-03-24)

### Highlights

- **Full-text search** — Pagefind integration indexes all generated HTML after build. Search from the sidebar on any page or from the landing page.
- **Mobile responsive layout** — Sidebar collapses into a hamburger menu overlay on screens under 768px. Smooth slide-in animation, tap-to-close on link navigation.
- **Internal link rewriting** — Cross-references between markdown files (e.g. `../../settings.json`, `../CLAUDE.md`) are automatically rewritten to the correct output paths during build.
- **Incremental builds** — `--incremental` flag compares file mtimes against a per-site build cache. Skips build entirely when nothing changed (0.0s). Critical for cron job use on memory-constrained machines.

### Features

- Pagefind search UI in sidebar with dark/light theme support via CSS variable overrides
- Search bar on site index landing page for cross-site searching
- `--no-search` CLI flag to skip search index generation
- `--no-link-check` CLI flag to skip broken link checking
- `--incremental` CLI flag to skip build when no source files changed
- Hamburger menu button with CSS-only icon (no SVG/images)
- Mobile breakpoints at 768px and 480px with progressive layout adjustments
- Tables, code blocks, and metadata cards scroll horizontally on mobile
- Breadcrumbs single-line scroll on narrow screens
- Link rewriter resolves relative paths, fragments, and extensionless references
- Build order: HTML -> Pagefind indexing -> link checking (so pagefind assets exist for link checker)
- Link checker scoped to current site's prefix directory (was scanning all sites)
- Link checker skips `_pagefind/` directory to avoid false positives
- Landing page Getting Started section with serve, build, repo, and incremental examples
- Sidebar and landing page footer with open source attribution

### Bug fixes

- Link checker no longer scans all sites in output directory (was processing 6.6M links for a 13-file build)

### Dependencies

- Added: pagefind 1.4.0

### Security

- CSP updated from `script-src: none` to `script-src: 'self' 'unsafe-inline'` to allow Pagefind search scripts

## v0.6.0 (2026-03-23)

First public release of claude-glass.

### Highlights

- **Multi-site support** — Build multiple `.claude` directories into a single output with incremental per-project rebuilds. A build manifest tracks registered sites so you can rebuild one project without affecting others.
- **Site index landing page** — Project cards with name, file count, and build date. Includes resource links to Claude Code docs and the claude-glass repo.
- **Content-type processors** — Specialized rendering for skills (badges), agents (persona cards), hooks (JSDoc + syntax highlighting), workflows (parent breadcrumbs), and JSON (collapsible trees).
- **Index pages** — Filterable tables for skills, hooks, and agents at a glance.
- **Security hardening** — CSS color injection fix, Content-Security-Policy header (`script-src: none`), `X-Content-Type-Options: nosniff`, HTML sanitization via sanitize-html.

### Features

- Always-prefix builds: each source gets a named subdirectory
- `--name` flag to override auto-derived project name
- Auto-derived names from source path (hostname for `~/.claude`)
- Repo-root `CLAUDE.md` auto-included when scanning `.claude` directories
- Magnifying glass favicon and sidebar branding
- Sidebar footer with open source attribution
- Directory index pages auto-generated for every directory
- Breadcrumb navigation with Home linking to site index
- Light theme default, dark via `prefers-color-scheme`
- Local-only server by default (`127.0.0.1`), `--host 0.0.0.0` for LAN/Tailscale

### Dependencies

- marked 15.0.0, highlight.js 11.11.0, sanitize-html 2.17.2, yaml 2.7.0, marked-highlight 2.2.0

### Quality

- TypeScript strict mode (`tsc --noEmit` clean)
- Security audit: 12 findings, 1 blocker fixed, CSP + security headers added
- 2,156 pages built from a full PAI installation in ~87s
