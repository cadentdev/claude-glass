# claude-glass

Static site generator for browsing Claude Code `.claude` directories.

Turn your `~/.claude` directory into a browseable local website. Discover skills, hooks, agents, and configuration you didn't know you had.

## Quick Start

```bash
git clone https://github.com/cadentdev/claude-glass.git
cd claude-glass
bun install
bun src/cli.ts serve ~/.claude
```

Then open `http://localhost:3333` in your browser.

## Features

- **Skill browser** — SKILL.md files rendered with effort/model badges and metadata cards
- **Agent profiles** — Persona cards with name, title, model tier, and color
- **Hook viewer** — JSDoc metadata extraction with syntax-highlighted TypeScript
- **Settings explorer** — Collapsible JSON tree for settings.json
- **Index pages** — Filterable tables for skills, hooks, and agents
- **Directory listings** — Auto-generated index pages for every directory
- **Broken link checker** — Post-build report of internal link issues
- **Breadcrumb navigation** — Every page shows its path in the directory tree
- **Light/dark theme** — Follows system preference
- **HTML sanitization** — All rendered content sanitized against XSS
- **Local-only by default** — See [Security](SECURITY.md)

## Requirements

- [Bun](https://bun.sh) v1.0+

## Usage

```
claude-glass build [dir]     Build static site
claude-glass serve [dir]     Build + serve

Options:
  --output, -o <path>    Output directory (default: /tmp/claude-glass)
  --port, -p <number>    Server port (default: 3333)
  --host <addr>          Bind address (default: 127.0.0.1)
  --no-memory            Exclude MEMORY/ directory tree
  --exclude <glob>       Additional exclusion pattern (repeatable)
  --verbose              Print processing details
```

### Accessing from another device

By default, claude-glass only listens on localhost. To access from your LAN or Tailscale network:

```bash
bun src/cli.ts serve ~/.claude --host 0.0.0.0
```

## How It Works

claude-glass scans your `.claude` directory and processes files through content-type-aware processors:

| Content Type | Rendering |
|---|---|
| `SKILL.md` | Metadata card with effort/model badges + rendered markdown |
| `agents/*.md` | Persona card with name, title, color swatch + backstory |
| `Workflows/*.md` | Breadcrumb to parent skill + rendered markdown |
| `*.hook.ts` | JSDoc extraction (trigger, purpose) + syntax-highlighted code |
| `settings.json` | Collapsible JSON tree with section navigation |
| Other `.md` | Standard markdown with frontmatter extraction |

The tool works on any `.claude` directory — from a vanilla Claude Code install with just `CLAUDE.md` and `settings.json` to a fully configured setup with dozens of skills, agents, and hooks.

## Security

See [SECURITY.md](SECURITY.md) for the threat model and design decisions.

## License

[MIT](LICENSE)
