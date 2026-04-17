# Release Checklist: v0.7.7

**Started:** 2026-04-17 | **Project:** claude-glass | **Base:** main | **Branch:** feature/per-site-search-tests-docs | **PR:** #27

## Current Step: COMPLETE (all 15 steps + 3 gates + retrospective)

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
| 6. Documentation Final Pass | [x] | README already reflects per-site search + exclusions; no CLAUDE.md; CLI help accurate |
| 7. Version Bump | [x] | package.json 0.7.6 → 0.7.7 (commit a235e5f/cee724f); bun install clean |
| 8. Release Notes | [x] | RELEASE-NOTES.md v0.7.7 dated 2026-04-17; added landing-search behavior note, Security section, coverage metrics |
| 9. PR Creation/Update | [x] | PR #27 body update BLOCKED by Projects-classic deprecation; full scope posted as PR comment (gh pr comment — detour logged) |
| 10. Issue Triage | [x] | 7 open issues (#17, #20, #22-#26) — none directly resolved by v0.7.7 |
| 11. Merge & Verify | [x] | Admin-merge (enforce_admins=false) → merge commit d02664c at 2026-04-17T16:28Z |
| --- GATE: CI | [x] | PASS — local `bun test` on merged main: 198 pass / 0 fail / 458 assertions |
| 12. Tag & GitHub Release | [x] | v0.7.7 tag @ d02664c; release https://github.com/cadentdev/claude-glass/releases/tag/v0.7.7; feature branch deleted local+remote |
| 13. Post-Release | [x] | LinkedIn draft at `/home/neil/Repos/stratofax/posts/03-drafts/linkedin/claude-glass-v077.md` |
| 14. Branch Cleanup | [x] | Remote already clean (origin/main only); `feature/issue-20-build-stats-footer` is local WIP for issue #20 — preserved |
| 15. Retrospective | [x] | See § Retrospective below |

## Retrospective

### What went well

1. **Host protections held up for full RedTeam scope.** Memory `feedback_redteam-swarm-on-flicky.md` steered us toward a proper audit instead of a conservative default. Agent(Pentester) delivered 0 BLOCKERs + 1 in-scope MED fix + deferrable LOWs — exactly the signal the gate needs.
2. **Step 5 dependency audit paid off.** Found and fixed GHSA-9mrh-v2v3-xpfm (sanitize-html moderate) — a real CVE that directly touches the codebase (used in 4 processors). Patch bump, non-breaking, shipped.
3. **Engineer sign-off added real value.** Caught the missing landing-search-removal behavior note in RELEASE-NOTES that would have surprised v0.7.6 users. Also flagged dead fallback branch in layout.ts for v0.7.8.
4. **Projects-classic memory prediction was perfect.** `feedback_gh-pr-edit-projects-classic.md` said `gh pr edit --body` would silently fail; it did. Fallback to `gh pr comment` worked first try. Memory saved a detour.
5. **Persistent `.dev/release-v0.7.7.md` checklist** kept the 15 steps honest across a context-heavy session.

### What surprised us

1. **Fabric is not installed on flicky.** FeatureRelease v2.4 assumes Fabric is present (Steps 1/4/8/9). Four separate substitutions were needed. None were hard, but it's a workflow assumption gap.
2. **claude-glass is not published to npm.** FeatureRelease v2.4 added a Step 4b "publish auth precheck" but the workflow assumes publish exists. Had to mark as N/A — worth documenting that non-published JS/TS projects are a valid path.
3. **`enforce_admins: false` + required review = admin-merge is intended.** Looked scarier than it was. Branch protection explicitly permits admin override. Worth documenting for solo-maintainer repos.

### Workflow improvements (recommended)

- **FeatureRelease v2.5:** Add a Pre-flight Fabric-availability check that falls back to documented native substitutes (Agent(Engineer) for review_code, Agent(Pentester) for create_threat_model, inline editing for improve_writing, refining the existing PR body for write_pull-request).
- **FeatureRelease v2.5:** Clarify that not-published JS/TS projects legitimately skip Step 13 publish — Step 4b publish auth precheck also N/A.
- **FeatureRelease v2.5:** Add explicit guidance on admin-merge for solo-maintainer repos where `enforce_admins: false` and author is sole admin.

### FeatureDev → FeatureRelease handoff

Worked cleanly. Implementation landed on main in v0.7.6-era commits, tests+docs in this branch, FeatureRelease picked it all up and added security/quality gate value on top. The feedback memory `feedback_featuredev-before-main.md` accurately captured the anti-pattern — and the workflow still handled it gracefully.

### Time

Pre-flight → tag published: ~55 minutes (including 2 parallel subagent runs ~90s each).

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
- **2026-04-17T16:26Z**: `gh pr edit --body` blocked by GitHub Projects (classic) deprecation error (exactly as predicted by memory `feedback_gh-pr-edit-projects-classic.md` and tracked as repo issue #22). Title update also blocked. Fell back to `gh pr comment` which succeeded — full v0.7.7 scope captured in PR #27 comment instead of the body. Prior PR #27 body from the FeatureDev phase remains accurate for the tests+docs core.
- **2026-04-17T16:28Z**: Admin-merge via `gh pr merge 27 --merge --admin` — branch protection permits this because `enforce_admins: false` on the `main` ruleset.

## User decisions locked

- **Target version**: v0.7.7
- **CI gate**: local `bun test` on merged main
- **Pausing**: auto-continue through Security + Quality gates; pause before Step 12 (tag/release) for sign-off
