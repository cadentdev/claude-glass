#!/usr/bin/env bash
# claude-glass nightly incremental build
# Builds all registered .claude sites. Safe for memory-constrained machines.
# Designed for cron: 30 3 * * * /home/neil/Repos/cadentdev/claude-glass/scripts/nightly-build.sh

set -euo pipefail

CLAUDE_GLASS="/home/neil/Repos/cadentdev/claude-glass"
BUN="/home/neil/.bun/bin/bun"
CLI="$CLAUDE_GLASS/src/cli.ts"
OUTPUT="$HOME/.local/share/claude-glass"
LOG="$HOME/.local/share/claude-glass/nightly.log"

# Timestamp helper
ts() { date "+%Y-%m-%d %H:%M:%S"; }

# Initialize systemd user session environment (needed for cron)
# When cron jobs call systemd-run --user, they need access to the user session bus.
# This is normally inherited from a login session, but cron doesn't have it.
if [ -z "${DBUS_SESSION_BUS_ADDRESS:-}" ]; then
  export XDG_RUNTIME_DIR="/run/user/$(id -u)"
  export DBUS_SESSION_BUS_ADDRESS="unix:path=$XDG_RUNTIME_DIR/bus"
fi

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
  # Per-site isolation: run under a user-scope cgroup with a hard 2.5 GB memory
  # cap. If a single site's build blows its budget, the kernel kills just that
  # bun process cleanly instead of OOM-reaping something essential and wedging
  # the box (which is exactly what happened on 2026-04-13 during interactive
  # #20 testing). `bun --smol` uses a smaller default heap and runs GC more
  # aggressively — appropriate for this 3.7 GB host.
  if systemd-run --user --scope --quiet \
      -p MemoryMax=2500M \
      -p MemorySwapMax=1500M \
      "$BUN" --smol "$CLI" build "$source" \
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

# PAI (~/.claude) — largest site, needs memory-safe flags.
# Search enabled: per-site indexing + worktree exclusion brought flicky
# from OOM-kill → 6.5 min full build (2,770 pages) within 2.5 GB cap.
build_site "/home/neil/.claude" "flicky" --no-memory

# Repo .claude directories — search enabled now that indexing is per-site.
# Previous --no-search was needed when Pagefind indexed all sites (~9,400 pages)
# per build. With per-site scoping (d15c7ef), small sites index in <2s.
build_site "/home/neil/Repos/stratofax/slipbox/.claude" "slipbox"
build_site "/home/neil/Repos/stratofax/posts/.claude" "posts"
build_site "/home/neil/Repos/cadentdev/claude-yolo-docker/.claude" "claude-yolo-docker"

echo "$(ts) === done ===" >> "$LOG"

# Build ntfy summary from log
NTFY_URL="http://192.168.52.11:8090/homelab-alerts"
OK_COUNT=$(grep -c " OK " "$LOG" || true)
FAIL_COUNT=$(grep -c " FAIL " "$LOG" || true)
SKIP_COUNT=$(grep -c " SKIP " "$LOG" || true)
TOTAL=$((OK_COUNT + FAIL_COUNT + SKIP_COUNT))

if [ "$FAIL_COUNT" -gt 0 ]; then
  FAILURES=$(grep " FAIL " "$LOG" | sed 's/^[^ ]* [^ ]* //' | paste -sd ', ')
  curl -s -d "[claude-glass nightly] $OK_COUNT/$TOTAL OK, $FAIL_COUNT FAILED: $FAILURES" \
    "$NTFY_URL" > /dev/null 2>&1 || true
else
  curl -s -d "[claude-glass nightly] $OK_COUNT/$TOTAL sites built OK" \
    "$NTFY_URL" > /dev/null 2>&1 || true
fi

# Print summary to stdout (visible in cron mail if configured)
grep -E "^.*(OK|FAIL|SKIP|done)" "$LOG"
