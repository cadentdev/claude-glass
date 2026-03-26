# claude-glass Roadmap

## Completed

### Phase 0.1 — Scaffold
- Project setup with Bun, TypeScript, minimal dependencies
- CLI with build/serve/info commands
- Directory scanner with exclusion patterns
- Basic markdown rendering with syntax highlighting

### Phase 0.2 — Layer 1 MVP
- Generic markdown processor with frontmatter extraction
- Navigation sidebar with collapsible tree
- Breadcrumb navigation
- Dev server with path containment security
- Light/dark theme (system preference)
- HTML sanitization (sanitize-html)

### Phase 0.5 — Content-Type Processors
- Skill processor — metadata cards with effort/model badges
- Agent processor — persona cards with name, title, color swatch
- Hook processor — JSDoc extraction + syntax-highlighted TypeScript
- Workflow processor — breadcrumb to parent skill
- JSON processor — collapsible tree with inline short arrays
- Index pages — filterable tables for skills, hooks, agents
- Directory index generator — auto-listing for every directory
- Broken link checker — post-build report
- Shared badge system (effort: green/yellow/orange, model: blue/purple/red)

### Phase 0.6 — Multi-Site & Polish
- Always-prefix build — each source gets a named subdirectory in output
- Build manifest — `.claude-glass.json` in output dir tracks all registered sites
- Incremental builds — only rebuild the specified `--source`, preserve others
- Site index landing page — project cards, resource links, getting started text
- `--name` flag — override auto-derived project name
- Serve mode reads manifest, serves all sites from one root
- Favicon (done: magnifying glass emoji)

### Phase 0.7 — Search & Mobile
- Pagefind integration for full-text search (runs after HTML build)
- Search bar in sidebar (all pages) and on site index landing page
- Internal link rewriting (cross-references rewritten to output paths)
- Mobile responsive layout with hamburger menu sidebar toggle
- `--no-search` flag to skip search index generation
- Pagefind UI styled for dark/light themes via CSS variable overrides
- CSP updated to allow Pagefind scripts
- Incremental builds — `--incremental` flag skips build when no source files changed (mtime cache per site)
- `--no-link-check` flag to skip broken link checking
- Link checker scoped to current site prefix dir (was scanning all sites — 6.6M links)

## Planned

### Phase 0.8 — Site Management & PAI Awareness
- `remove` command — remove a site from manifest and delete its output directory
- MEMORY tier rendering (distinguish auto, session, persistent)
- PAI-specific content types (Algorithm, TELOS, learning signals)
- Richer skill metadata (workflow count, dependency graph)
- CSP hardening — replace `unsafe-inline` script-src with nonce-based CSP
- Access logging in serve mode — timestamp, IP, request path

### Phase 0.9 — Testing & Quality
- Unit tests for processors, scanner, nav builder
- Integration tests for full build pipeline
- CI via GitHub Actions
- Type checking in CI (`tsc --noEmit`)

### Phase 1.0 — Public Launch
- npm publish (`npx claude-glass serve`)
- Stable CLI interface
- Comprehensive README with screenshots
- CONTRIBUTING.md
- Release notes
