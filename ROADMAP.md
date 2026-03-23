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

## In Progress

### Phase 0.6 — Multi-Site & Polish (PR #4)
- Always-prefix build — each source gets a named subdirectory in output
- Build manifest — `.claude-glass.json` in output dir tracks all registered sites
- Incremental builds — only rebuild the specified `--source`, preserve others
- Site index landing page — project cards, resource links, getting started text
- `--name` flag — override auto-derived project name
- Serve mode reads manifest, serves all sites from one root
- Favicon (done: magnifying glass emoji)

## Planned

### Phase 0.7 — Search & Mobile
- Pagefind integration for full-text search
- Search bar on site index landing page
- Internal link rewriting (fix cross-reference links in source markdown)
- Mobile responsive layout

### Phase 0.8 — PAI Awareness
- MEMORY tier rendering (distinguish auto, session, persistent)
- PAI-specific content types (Algorithm, TELOS, learning signals)
- Richer skill metadata (workflow count, dependency graph)

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
