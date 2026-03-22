# Security

## Threat Model

claude-glass generates a static website from your `~/.claude` directory. The generated HTML may contain sensitive information from your configuration, memory, and skill files -- the same content that's already on your local filesystem.

**The security boundary is network access, not content filtering.**

### Design Decisions

- **Default bind: `127.0.0.1`** -- The dev server only listens on localhost by default. Use `--host 0.0.0.0` to explicitly opt into LAN/Tailscale access.
- **Path containment** -- The server resolves symlinks and verifies all served files are within the output directory. Path traversal attacks return 403.
- **HTML sanitization** -- All markdown body content is sanitized via `sanitize-html` to prevent XSS from embedded scripts in markdown files.
- **Read-only** -- The tool never writes to or modifies the source `.claude` directory.
- **`--no-memory` flag** -- Optionally exclude the MEMORY/ directory tree from the generated site.

### What This Tool Does NOT Do

- It does not filter secrets (API keys, IPs, credentials) from rendered content. If your `.claude` directory contains secrets in markdown files, they will appear in the generated HTML. This is by design -- the content is already on your filesystem.
- It does not provide authentication or access control beyond network binding.
- It is not intended for deployment to public-facing servers.

## Reporting Vulnerabilities

If you discover a security issue, please email neil@cadent.net rather than opening a public issue.
