#!/usr/bin/env bash
# smoke-test.sh — Deployment smoke tests for claude-glass
#
# Verifies the live server responds correctly at all expected endpoints.
# Reads the manifest to discover registered sites dynamically.
#
# Usage:
#   ./scripts/smoke-test.sh                    # test localhost:3333
#   ./scripts/smoke-test.sh http://100.77.254.20:3333  # test remote host
#
# Exit codes: 0 = all pass, 1 = failures detected

set -uo pipefail

BASE_URL="${1:-http://localhost:3333}"
OUTPUT_DIR="${CLAUDE_GLASS_OUTPUT:-$HOME/.local/share/claude-glass}"
MANIFEST="$OUTPUT_DIR/.claude-glass.json"

pass=0
fail=0
total=0

# Colors (disabled if not a terminal)
if [ -t 1 ]; then
  GREEN='\033[0;32m'
  RED='\033[0;31m'
  BOLD='\033[1m'
  RESET='\033[0m'
else
  GREEN='' RED='' BOLD='' RESET=''
fi

check() {
  local description="$1"
  local url="$2"
  local expected_status="${3:-200}"
  local expect_content="${4:-}"

  total=$((total + 1))

  local status tmpfile
  tmpfile=$(mktemp)
  status=$(curl -s -o "$tmpfile" -w "%{http_code}" --max-time 5 "$url" 2>/dev/null)

  # Check HTTP status
  if [ "$status" != "$expected_status" ]; then
    echo -e "  ${RED}FAIL${RESET}  $description — expected $expected_status, got $status"
    fail=$((fail + 1))
    rm -f "$tmpfile"
    return
  fi

  # Check content if specified (first 8K to handle large responses)
  if [ -n "$expect_content" ]; then
    if ! head -c 8192 "$tmpfile" | grep -q "$expect_content"; then
      echo -e "  ${RED}FAIL${RESET}  $description — missing content: $expect_content"
      fail=$((fail + 1))
      rm -f "$tmpfile"
      return
    fi
  fi

  rm -f "$tmpfile"

  echo -e "  ${GREEN}PASS${RESET}  $description"
  pass=$((pass + 1))
}

echo -e "${BOLD}claude-glass smoke tests${RESET}"
echo "  Target: $BASE_URL"
echo ""

# ── Core endpoints ──────────────────────────────────────────

echo -e "${BOLD}Core${RESET}"
check "Homepage returns 200"           "$BASE_URL/"
check "Homepage has site index"        "$BASE_URL/" 200 "claude-glass"
check "CSS stylesheet loads"           "$BASE_URL/style.css"
check "Pagefind JS loads"             "$BASE_URL/_pagefind/pagefind.js"
check "404 for missing page"          "$BASE_URL/this-does-not-exist.html" 404

# ── Site prefixes (from manifest) ───────────────────────────

if [ -f "$MANIFEST" ]; then
  # Parse site prefixes from manifest JSON (portable: no jq dependency)
  prefixes=$(grep '"prefix"' "$MANIFEST" | sed 's/.*"prefix": *"//;s/".*//')

  if [ -n "$prefixes" ]; then
    echo ""
    echo -e "${BOLD}Sites${RESET}"

    site_count=0
    while IFS= read -r prefix; do
      check "Site /$prefix/ returns 200"      "$BASE_URL/$prefix/"
      check "Site /$prefix/ has content"      "$BASE_URL/$prefix/" 200 "<html"
      site_count=$((site_count + 1))
    done <<< "$prefixes"

    # Verify homepage lists all sites
    echo ""
    echo -e "${BOLD}Homepage completeness${RESET}"
    check "Homepage lists $site_count sites" "$BASE_URL/" 200 "$prefix"
  fi
else
  echo ""
  echo "  SKIP  No manifest at $MANIFEST — site prefix tests skipped"
fi

# ── Summary ─────────────────────────────────────────────────

echo ""
if [ "$fail" -gt 0 ]; then
  echo -e "${RED}${BOLD}RESULT: $pass/$total passed, $fail failed${RESET}"
  exit 1
else
  echo -e "${GREEN}${BOLD}RESULT: $pass/$total passed${RESET}"
  exit 0
fi
