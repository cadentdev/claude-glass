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

## Building Large Sites on Low-RAM Hosts

claude-glass is designed to run on small machines — a Raspberry Pi, a small VPS, a 4 GB laptop — while still building sites with thousands of pages. The render loop streams per-page HTML, dropping each file from memory immediately after writing, so peak RAM scales with the largest in-flight page rather than the whole site.

### Trim heavy phases in nightly cron

```bash
bun --smol src/cli.ts build ~/.claude \
  --incremental \
  --no-search \
  --no-link-check \
  --no-memory
```

- `bun --smol` — smaller default heap, more aggressive GC. Modest runtime cost for a meaningful reduction in peak RSS.
- `--incremental` — skip the build entirely when no source files have changed
- `--no-search` — skip the Pagefind index (can time out under memory pressure; index only when serving interactively)
- `--no-link-check` — skip the post-build link checker (I/O-heavy)
- `--no-memory` — exclude the `MEMORY/` directory tree

### Per-site isolation with systemd-run

If you build multiple sites from a single script and want to make sure a runaway build can't take down the host, wrap each build in a user-scope cgroup with a hard memory ceiling:

```bash
systemd-run --user --scope --quiet \
  -p MemoryMax=2500M \
  -p MemorySwapMax=1500M \
  bun --smol src/cli.ts build ~/.claude --output ~/.local/share/claude-glass
```

If a build exceeds the cap, the kernel kills *that* build cleanly and the rest of the system keeps running. See `scripts/nightly-build.sh` for a working example.

### zram — compressed RAM swap for Linux hosts

On Linux machines with limited RAM, we strongly recommend enabling **zram**: a compressed RAM-backed swap device. Allocation spikes get compressed in microseconds instead of waiting on disk-file swap I/O, which lets the kernel keep up with bursty workloads so the OOM killer almost never has to fire.

On Ubuntu/Debian:

```bash
sudo apt install systemd-zram-generator
sudo systemctl start systemd-zram-setup@zram0.service
swapon --show   # verify /dev/zram0 appears at priority 100
```

The default config creates a zram device sized at `min(RAM/2, 4 GiB)` with kernel-default compression — no further tuning needed for most hosts. To override, edit `/etc/systemd/zram-generator.conf`.

**Trade-off:** zram uses CPU cycles to compress and decompress pages. For build workloads dominated by I/O and markdown parsing (like claude-glass) the overhead is invisible; for CPU-bound numerical workloads it can matter. Fedora and recent Ubuntu desktop installs often ship zram enabled by default.

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
