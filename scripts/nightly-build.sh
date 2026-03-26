#!/usr/bin/env bash
# claude-glass nightly incremental build
# Builds all registered .claude sites. Safe for memory-constrained machines.
# Designed for cron: 30 3 * * * /home/neil/Repos/cadentdev/claude-glass/scripts/nightly-build.sh

set -euo pipefail

CLAUDE_GLASS="/home/neil/Repos/cadentdev/claude-glass"
BUN="/home/neil/.bun/bin/bun"
CLI="$CLAUDE_GLASS/src/cli.ts"
OUTPUT="/tmp/claude-glass"
LOG="/tmp/claude-glass-nightly.log"

# Timestamp helper
ts() { date "+%Y-%m-%d %H:%M:%S"; }

echo "$(ts) === claude-glass nightly build ===" > "$LOG"

build_site() {
  local source="$1"
  local name="$2"
  shift 2
  local extra_flags=("$@")

  if [ ! -d "$source" ]; then
    echo "$(ts) SKIP $name — source not found: $source" >> "$LOG"
    return
  fi

  echo "$(ts) BUILD $name ($source)" >> "$LOG"
  if "$BUN" "$CLI" build "$source" \
    --output "$OUTPUT" \
    --name "$name" \
    --incremental \
    --no-link-check \
    "${extra_flags[@]}" \
    >> "$LOG" 2>&1; then
    echo "$(ts) OK   $name" >> "$LOG"
  else
    echo "$(ts) FAIL $name (exit $?)" >> "$LOG"
  fi
}

# PAI (~/.claude) — largest site, needs memory-safe flags
build_site "/home/neil/.claude" "flicky" --no-search --no-memory

# Repo .claude directories (--no-search: pagefind times out in cron; index when serving)
build_site "/home/neil/Repos/stratofax/slipbox/.claude" "slipbox" --no-search
build_site "/home/neil/Repos/stratofax/posts/.claude" "posts" --no-search
build_site "/home/neil/Repos/cadentdev/claude-yolo-docker/.claude" "claude-yolo-docker" --no-search

echo "$(ts) === done ===" >> "$LOG"

# Print summary to stdout (visible in cron mail if configured)
grep -E "^.*(OK|FAIL|SKIP|done)" "$LOG"
