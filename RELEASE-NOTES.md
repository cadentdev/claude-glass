# Release Notes

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
