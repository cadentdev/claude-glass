# Getting Started

## Prerequisites

- [Bun](https://bun.sh) v1.0 or later
- A `~/.claude` directory (created by [Claude Code](https://claude.ai/claude-code))

## Installation

```bash
git clone https://github.com/cadentdev/claude-glass.git
cd claude-glass
bun install
```

## Generate Your First Site

### Option 1: Build and serve (recommended)

```bash
bun src/cli.ts serve
```

This builds the site from `~/.claude` and starts a local server at `http://localhost:3333`.

### Option 2: Build only

```bash
bun src/cli.ts build
```

The static site is written to `/tmp/claude-glass/`. Open `/tmp/claude-glass/index.html` in your browser, or serve it with any static file server.

### Option 3: Point at a different directory

```bash
bun src/cli.ts serve /path/to/.claude
```

## Common Options

### Change the output directory

```bash
bun src/cli.ts build --output ~/Sites/claude-glass
```

### Access from another device (LAN/Tailscale)

```bash
bun src/cli.ts serve --host 0.0.0.0
```

Then browse to `http://<your-ip>:3333` from another device.

### Exclude MEMORY files

```bash
bun src/cli.ts serve --no-memory
```

### Exclude additional directories

```bash
bun src/cli.ts serve --exclude "PAI/**" --exclude "lib/**"
```

### Add more sites

```bash
# Add another project's .claude directory
bun src/cli.ts build ~/Repos/myproject/.claude

# Override the auto-derived name
bun src/cli.ts build ~/Repos/myproject/.claude --name my-project
```

Each site gets its own section. The landing page shows cards for all registered sites.

## What You'll See

- **Landing page** -- Site index with project cards for each registered `.claude` directory
- **Sidebar** -- Collapsible directory tree for navigating all content
- **Skills** -- Each `SKILL.md` file rendered with frontmatter metadata cards
- **Agents** -- Agent definitions with persona details
- **Hooks** -- TypeScript hooks with JSDoc extraction and syntax highlighting
- **Memory** -- Work sessions, learning signals, relationship tracking

## Next Steps

- Browse through your skills to discover capabilities you haven't used
- Add more `.claude` directories from other projects
- Check the MEMORY/WORK directory to see past session PRDs
- Review agent definitions to understand available personas
