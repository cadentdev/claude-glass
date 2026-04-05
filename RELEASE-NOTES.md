# Release Notes

## v0.7.5 (2026-04-05)

### Test Coverage

Comprehensive test suite raising coverage from 34% to 98.6%. No production code changes.

- **181 tests** across 12 test files (up from 21 tests in 2 files)
- **98.6% line coverage**, 98.98% function coverage
- New test files cover: manifest, exclusions, build-cache, nav, link-rewriter, link-checker, all processors, badges, markdown processor, and serve integration
- Integration tests use real HTTP servers and filesystem fixtures with temp dir cleanup

### Quality

- Tests: 181 pass, 0 fail, 421 assertions
- Coverage: 98.61% lines, 98.98% functions (12 of 14 modules at 100%)

---

## v0.7.4 (2026-04-05)

### Improvements

- **Persistent output directory** — Default output moved from `/tmp/claude-glass` to `~/.local/share/claude-glass` (XDG-compliant). Build artifacts now survive reboots — no more lost sites when systemd-tmpfiles cleans `/tmp`.
- **Deployment smoke tests** — New `scripts/smoke-test.sh` runs 14 curl-based checks against a live server: homepage, CSS, Pagefind, 404 handling, all site prefixes from manifest, and content verification. Accepts optional URL arg for remote testing.
- **Nightly build notifications** — `scripts/nightly-build.sh` now sends a summary to ntfy after builds complete, reporting OK/FAIL/SKIP counts per site.

### Quality

- Tests: 21 pass, 0 fail
- Security: 0 blockers (output dir move is a security improvement — /tmp is world-readable)
- Dependencies: `bun audit` clean, no vulnerabilities

---

## v0.7.3 (2026-03-26)

### Bug Fixes

- **Search results not loading** (#9) — Pagefind search showed "Searching for..." but never returned results. Two root causes: (1) WASM files served with wrong Content-Type (`application/octet-stream` instead of `application/wasm`), (2) CSP `script-src` missing `'wasm-unsafe-eval'` directive, blocking `WebAssembly.instantiate()`.
- Added `.wasm`, `.pagefind`, `.pf_meta`, `.pf_index`, `.pf_fragment` to server MIME type map.
- Exported `MIME_TYPES` and `CSP_HEADER` constants for testability.
- Removed unused `resolve` import from serve.ts.

### Quality

- Tests: 21 (12 new serve.test.ts — unit tests for MIME/CSP constants + integration tests with real HTTP server)
- Security: 0 blockers, 1 pre-existing LOW (unsafe-inline in CSP, deferred to Phase 0.8 nonce-based CSP)

---

## v0.7.2 (2026-03-26)

### Search & Site Identity

- **Search result titles** — Results now show "Page Title — siteName" instead of "claude-glass" for every hit. Added `data-pagefind-meta` to article elements with correct site and title context.
- **Sidebar site identity** — Sidebar shows site name below the logo, linking to the site index page. Added `data-pagefind-ignore` to sidebar so the logo `<h1>` isn't picked as a search title.
- **Breadcrumb site name** — Breadcrumbs now include the site name: Home / siteName / path / page.
- **Title tag context** — Browser tab shows "Page — siteName — claude-glass" instead of just "Page — claude-glass".

### Security

- **XSS hardening** — Unified `escapeHtml` across layout.ts, build.ts, and nav.ts to escape `"` and `'` in addition to `<`, `>`, `&`. Prevents attribute breakout in `data-pagefind-meta` and `href` contexts.
- **Manifest path redaction** — Build manifest no longer exposes absolute filesystem paths (e.g., `/home/neil/.claude`). Paths are now stored as `~/`-relative.
- **URL-encoded hrefs** — Navigation and directory index links now use `encodeURI()` to handle special characters in file paths.
- **Security regression tests** — 9 tests covering escapeHtml, attribute breakout prevention, manifest path handling, and breadcrumb escaping.

### Fixes

- **Pagefind ETIMEDOUT** — Replaced `execFileSync` with `Bun.spawnSync` for pagefind invocation, resolving platform binary directly instead of going through the Node.js wrapper.

### Infrastructure

- **Nightly cron build script** — `scripts/nightly-build.sh` builds 4 sites incrementally with OOM-safe flags. Designed for memory-constrained machines (flicky, 3.7GB RAM).

### Quality

- Tests: 9 | Coverage: security regression baseline | Security findings: 14 found, 4 fixed, 2 deferred to v0.8.0

## v0.7.1 (2026-03-24)

### Security

- **Command injection fix** — replaced `execSync` with `execFileSync` for pagefind invocation, preventing shell injection via crafted output paths
- **TOCTOU race fix** — serve now reads from the resolved `realPath` instead of the original `filePath`, eliminating symlink swap attacks
- **Expanded exclusion list** — added `credentials.json`, `*.secret`, `*.token`, `*.p12`, `*.pfx`, `*.sqlite`, `*.db`, SSH key patterns
- **File size limit** — files over 10MB are skipped during processing to prevent OOM

### Maintenance

- Removed unused `yaml` dependency (only `highlight.js/lib/languages/yaml` was used)
- Updated README with `--incremental` and `--no-link-check` documentation

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
