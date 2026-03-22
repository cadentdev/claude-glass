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

- Renders markdown files with syntax highlighting
- Extracts YAML frontmatter as metadata cards
- Directory tree navigation with collapsible sidebar
- Breadcrumb navigation
- Light/dark theme (follows system preference)
- HTML sanitization on all rendered content
- Local-only by default (see [Security](SECURITY.md))

## Requirements

- [Bun](https://bun.sh) v1.0+

## Usage

```
claude-glass build [dir]     Build static site
claude-glass serve [dir]     Build + serve with live-reload

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

claude-glass scans your `.claude` directory, processes markdown files through a rendering pipeline, and outputs a static HTML site. It automatically excludes ephemeral directories (sessions, telemetry, cache) and binary files.

The tool works on any `.claude` directory -- from a vanilla Claude Code install with just `CLAUDE.md` and `settings.json` to a fully configured setup with dozens of skills, agents, and hooks.

## Security

See [SECURITY.md](SECURITY.md) for the threat model and design decisions.

## License

[MIT](LICENSE)
