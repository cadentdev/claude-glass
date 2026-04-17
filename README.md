# claude-glass

Static site generator for browsing Claude Code `.claude` directories.

Turn your `~/.claude` directory into a browseable local website. Discover skills, hooks, agents, and configuration you didn't know you had. Build multiple Claude Code installations into a single site with a shared landing page.

## Quick Start

```bash
git clone https://github.com/cadentdev/claude-glass.git
cd claude-glass
bun install
bun src/cli.ts serve ~/.claude
```

Then open `http://localhost:3333` in your browser.

## Features

- **Per-site full-text search** — Pagefind-powered search scoped to each site, indexed within the site's prefix directory
- **Mobile responsive** — Hamburger menu sidebar on mobile, responsive layout at all breakpoints
- **Multi-site support** — Build multiple `.claude` directories into one site with incremental rebuilds
- **Site index landing page** — Project cards with file counts, build dates, and resource links
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
  --output, -o <path>    Output directory (default: ~/.local/share/claude-glass)
  --name <string>        Override project name (default: auto-derived from path)
  --port, -p <number>    Server port (default: 3333)
  --host <addr>          Bind address (default: 127.0.0.1)
  --no-search            Skip search index generation
  --no-memory            Exclude MEMORY/ directory tree
  --no-link-check        Skip broken link checking
  --incremental          Only rebuild if source files changed
  --exclude <glob>       Additional exclusion pattern (repeatable)
  --verbose              Print processing details
```

### Multi-site builds

Each build adds or updates one site in the output directory. Previously built sites are preserved.

```bash
# Build your main .claude directory
bun src/cli.ts build ~/.claude

# Add another project's .claude directory
bun src/cli.ts build ~/Repos/myproject/.claude

# Rebuild just the first site — myproject is untouched
bun src/cli.ts build ~/.claude
```

A build manifest (`.claude-glass.json`) in the output directory tracks all registered sites. The landing page at the root shows project cards for every site.

### Incremental builds

Use `--incremental` to skip rebuilds when no source files have changed — ideal for cron jobs:

```bash
bun src/cli.ts build ~/.claude --incremental --no-search --no-link-check
```

Project names are auto-derived from the source path. Use `--name` to override:

```bash
bun src/cli.ts build ~/.claude --name my-config
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

## Performance and Memory

claude-glass streams page rendering — each file's HTML is freed immediately after it's written, so peak memory scales with the largest in-flight page rather than the total site size. Large builds (thousands of pages) are viable on low-RAM hosts like a Raspberry Pi or a small VPS.

### Search indexing

Search indexes are scoped per-site — each site gets its own Pagefind index in `<prefix>/_pagefind/`. This means:

- Small sites (tens of pages) index in under 2 seconds
- Large sites (thousands of pages) index within a 2.5 GB memory budget
- Each site's search only returns results from that site

Use `--no-search` to skip search indexing for faster builds when search isn't needed.

### Excluded directories

Agent worktrees (`.claude/worktrees/`, `worktrees/`) are excluded by default. These are ephemeral subagent data that can contain thousands of duplicate files and significantly inflate build time and memory usage. See `src/exclusions.ts` for the full exclusion list.

### Memory tips

For extra headroom on 4 GB-class machines:

- `bun --smol` — smaller default heap, more aggressive GC
- `--incremental --no-search --no-link-check --no-memory` — trim the heaviest phases
- Wrap per-site builds in `systemd-run --user --scope -p MemoryMax=...` so a runaway build can't wedge the host
- On Linux, enable **zram** — compressed RAM-backed swap absorbs allocation spikes without waiting on disk I/O

See [GETTING-STARTED.md](GETTING-STARTED.md#building-large-sites-on-low-ram-hosts) for commands and example configs.

## Running as a Cron Job

A reference nightly build script lives at [`scripts/nightly-build.sh`](scripts/nightly-build.sh). It builds a list of sites with per-site `systemd-run --user --scope` memory isolation and sends an ntfy summary.

Example crontab entry (runs 03:30 daily):

```
30 3 * * * /home/neil/Repos/cadentdev/claude-glass/scripts/nightly-build.sh
```

### Linux: enable user lingering

If your cron script uses `systemd-run --user --scope` (as the reference script does), you **must** enable lingering for the user that owns the crontab:

```bash
sudo loginctl enable-linger $USER
```

Without lingering, `systemd --user` only runs while you have an active login session (SSH, console, or GUI). Cron fires without a session, so the user D-Bus socket doesn't exist and `systemd-run --user --scope` fails with:

```
Failed to connect to bus: No medium found
```

The failure is silent in the nightly log unless you read it directly — manual runs from an interactive shell will "work" because your session bus is available, masking the bug. Verify with:

```bash
loginctl show-user $USER | grep Linger
# Linger=yes
```

Lingering is persistent across reboots and reversible with `sudo loginctl disable-linger $USER`.

## Security

See [SECURITY.md](SECURITY.md) for the threat model and design decisions.

## Roadmap

See [ROADMAP.md](ROADMAP.md) for the full development plan from Phase 0.1 through 1.0.

## License

[MIT](LICENSE)
