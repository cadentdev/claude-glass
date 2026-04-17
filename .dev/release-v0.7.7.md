# Release Checklist: v0.7.7

**Started:** 2026-04-17 | **Project:** claude-glass | **Base:** main | **Branch:** feature/per-site-search-tests-docs | **PR:** #27

## Current Step: Step 6 — Documentation Final Pass

| Step | Status | Notes |
|------|--------|-------|
| Pre-flight | [x] | Repo clean, Bun project, no CI, fabric missing — Fabric substitutions documented below |
| 1. Security Audit | [x] | Agent(Pentester) — 0 BLOCKERs, 1 MED (fixed), 3 LOW (deferred v0.7.8), 4 INFO |
| 2. Triage Findings | [x] | See Findings table |
| 3. Fix Blockers | [x] | N/A — zero BLOCKERs. MEDIUM finding (`id -u neil` → `id -u`) fixed in scope |
| --- GATE: Security | [x] | PASS — zero open BLOCKERs |
| 4. Test Coverage | [x] | 198 pass / 0 fail / 458 assertions; 96.66% line coverage, 91.62% func coverage |
| --- GATE: Quality | [x] | PASS — tests green, coverage above 95% threshold |
| 5. Dependency Audit | [x] | sanitize-html 2.17.2→2.17.3 fixes GHSA-9mrh-v2v3-xpfm (moderate). Re-audit clean. No biome.json — N/A. |
| 6. Documentation Final Pass | [ ] | README, CLAUDE.md, CLI help, cross-cutting docs |
| 7. Version Bump | [ ] | package.json 0.7.6 → 0.7.7 |
| 8. Release Notes | [ ] | RELEASE-NOTES.md finalize; inline polish in lieu of fabric improve_writing |
| 9. PR Creation/Update | [ ] | PR #27 body — existing Neil-authored body; refine inline. Verify persist via `gh pr view --json body` (Projects classic gotcha) |
| 10. Issue Triage | [ ] | `gh issue list` on cadentdev/claude-glass |
| 11. Merge & Verify | [ ] | Diagnose BLOCKED first; `gh pr merge 27 --merge`; local `bun test` on main as CI fallback |
| --- GATE: CI | [ ] | No GitHub Actions configured → local `bun test` substitute (user-approved 2026-04-17) |
| 12. Tag & GitHub Release | [ ] | v0.7.7 tag; `gh release create`; delete feature branch LAST |
| 13. Post-Release | [ ] | LinkedIn draft in `/home/neil/Repos/stratofax/posts/03-drafts/linkedin/claude-glass-v077.md` (hard gate) |
| 14. Branch Cleanup | [ ] | Stale remote branches audit with user confirmation |
| 15. Retrospective | [ ] | Workflow updates; capture Fabric substitution learnings |

## Features Included

- **Per-site Pagefind search indexing** — each site gets its own `_pagefind/` index instead of a global one; indexing time drops from ~50 min to <2 s for small sites
- **Worktree exclusion** — `worktrees/**`, `.claude/worktrees/**` now in `DEFAULT_EXCLUSIONS` (agent worktrees were 70% of largest build)
- **Flicky search viable** — 1,601 pages indexed in 6.5 min within a 2.5 GB cgroup; previously OOM-killed
- **Landing page search removed** — search is per-site only, surfaced in each site's sidebar
- **Nightly build: search enabled for all 4 sites** on flicky
- **Nightly build: systemd user-bus init** — `nightly-build.sh` sets `XDG_RUNTIME_DIR` / `DBUS_SESSION_BUS_ADDRESS` for cron context

## Pre-flight verifications (2026-04-17T12:14Z)

- Repo: `/home/neil/Repos/cadentdev/claude-glass` — is a git repo ✅
- Branch: `feature/per-site-search-tests-docs` (not base) ✅
- Working tree clean (`git status --porcelain` empty) ✅
- Project variant: 🟦 JS/TS (Bun) — `bun.lockb` present, `package.json` name=claude-glass@0.7.6 ✅
- Free RAM: 2901 MB avail on flicky — above 1 GB floor for full RedTeam ✅
- Publish auth precheck: N/A — claude-glass is NOT published to npm (no `publishConfig`, `bin` is local-only via the repo) — marked `[!]` intentionally
- Tag `v0.7.7` does not exist on remote ✅
- Posts repo at `/home/neil/Repos/stratofax/posts/` with existing `claude-glass-v071.md` + `v072.md` drafts to use as template ✅

## Fabric substitutions (detour)

Fabric is not installed on this host. Each Fabric invocation in the workflow has a documented substitute:

| Step | Original | Substitute | Rationale |
|------|----------|-----------|-----------|
| 1 | `fabric -p create_threat_model` | Full RedTeam swarm (it already does adversarial threat analysis) | No standalone threat-model step needed; RedTeam output covers the same surface |
| 4 | `fabric -p review_code` | `Agent(Engineer)` principal-engineer review of the diff | Engineer agent profile includes "Fortune 10 principal engineer" — direct match |
| 8 | `fabric -p improve_writing` | Inline self-edit pass | RELEASE-NOTES v0.7.7 is already drafted; single revision pass for tone/clarity |
| 9 | `fabric -p write_pull-request` | Refine existing Neil-authored PR #27 body inline | PR body is already strong; regenerating would lose context |

## Findings

**Step 1 — RedTeam (via Agent(Pentester), 2026-04-17T12:16Z).** Zero BLOCKERs (no CRITICAL/HIGH).

| Severity | File:line | Description | Action |
|---|---|---|---|
| MEDIUM | `scripts/nightly-build.sh:21` | `$(id -u neil)` hard-codes username | **FIXED** in this release — replaced with `$(id -u)` |
| LOW | `src/exclusions.ts:94-122` | `.env.*` not treated as glob — `.env.local` etc not excluded | Defer to v0.7.8 — already documented by `src/tests/exclusions.test.ts:99-105` |
| LOW | `scripts/nightly-build.sh:76,84,87` | ntfy curl body interpolation (LAN-only) | Defer — bounded by `nameToPrefix()` upstream |
| LOW | `src/search.ts:36-42` | No realpath check on `prefixDir` before Pagefind invocation | Defer — `nameToPrefix()` in `manifest.ts:75-82` strips non-alnum-hyphens; defense-in-depth only |
| INFO | `nightly-build.sh:45-54` | `systemd-run --user --scope` inherits env | Pre-existing, not v0.7.7 scope |
| INFO | `src/build.ts:43-45` | `--no-memory` must be opt-out, not opt-in | Pre-existing — consider making `MEMORY/**` a default exclusion |
| INFO | `src/exclusions.ts:19-20` | Worktree exclusion correctly implemented | No action — confirmed safe |
| INFO | `src/templates/landing.ts:36-120` | Landing-page Pagefind removal is clean | No action — verified by search-scope.test.ts |

**Step 5 — Bun audit (2026-04-17T12:17Z).** 1 moderate vulnerability found in `sanitize-html@2.17.2` (GHSA-9mrh-v2v3-xpfm — allowedTags Bypass via Entity-Decoded Text in nonTextTags Elements). **FIXED** via `bun update sanitize-html` → 2.17.3. Re-audit clean.

sanitize-html is used in `src/processors/{markdown,agent,skill,workflow}.ts` for output sanitization — vuln was in scope for the threat surface.

**Step 4 — Engineer code review (Agent(Engineer), 2026-04-17T12:17Z). Verdict: SIGN-OFF.**

| Finding | Action |
|---|---|
| Landing page no longer has search box — user-visible behavior change not called out in RELEASE-NOTES | **In-scope for Step 8** — added to v0.7.7 entry |
| `src/templates/layout.ts:28-32` fallback branch (no `fullOutputPath`) is stale/unreachable from `build.ts` but untested | Deferred to v0.7.8 — low risk because branch is unreachable |
| No test asserts `runPagefindIndex` invoked with `prefixDir` vs `outputDir` | Deferred to v0.7.8 — behavior verified by live nightly runs |
| `.claude/worktrees/**` exclusion is dead code for PAI (input dir is `.claude` itself) | Deferred — harmless defense-in-depth |
| Pre-v0.7.6 `outputDir/_pagefind/` orphan files on upgrade | Deferred — add upgrade note to README in v0.7.8 |

## Detours

- **2026-04-17T12:15Z**: Fabric not installed. Substituted each Fabric invocation with native equivalent (see table above).
- **2026-04-17T12:15Z**: No GitHub Actions on this repo. GATE: CI falls back to local `bun test` against merged main (user-approved choice).

## User decisions locked

- **Target version**: v0.7.7
- **CI gate**: local `bun test` on merged main
- **Pausing**: auto-continue through Security + Quality gates; pause before Step 12 (tag/release) for sign-off
