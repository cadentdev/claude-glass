# Release Checklist: v0.7.8

**Started:** 2026-08-20 | **Project:** claude-glass | **Base:** main | **Branch:** release/v0.7.8 | **PR:** TBD

## Current Step: in progress

| Step | Status | Notes |
|------|--------|-------|
| Pre-flight | [x] | See § Pre-flight verifications |
| 1. Security Audit | [x] | Agent(Pentester) — 0 BLOCKERs, 4 LOW (1 fixed in scope), 2 INFO (1 fixed). Verdict PASS |
| 2. Triage Findings | [x] | See § Findings. Fixed in scope: serve.ts POSIX containment (introduced this release), ci.yml permissions, ci.yml bun pin, exclusions pattern normalization, GETTING-STARTED output-dir error, _pagefind upgrade note, landing-page test assertion. Deferred (logged in ROADMAP): .env.* glob, layout.ts dead branch, ntfy interpolation, search.ts realpath, MEMORY default |
| 3. Fix Blockers | [x] | N/A — zero BLOCKERs. Engineer's one MAJOR (GETTING-STARTED /tmp output-dir error) fixed in scope |
| --- GATE: Security | [x] | PASS — zero open BLOCKERs; bun audit clean; security.test.ts 9/9 |
| 4. Test Coverage | [x] | 212 pass / 0 fail / 497 assertions; 91.95% lines, 89.75% funcs — see § Coverage note |
| --- GATE: Quality | [x] | PASS — Engineer NEEDS-WORK verdict was solely the GETTING-STARTED MAJOR, fixed in scope; all other findings MINOR/NIT, addressed or deferred with notes |
| 5. Dependency Audit | [x] | `bun audit`: 0 vulnerabilities (sanitize-html 2.17.7, postcss 8.5.26, nanoid 3.3.18 — fixed in #31/#35 pre-release) |
| 6. Documentation Final Pass | [x] | README: CI badge + Windows/platforms note; CLAUDE.md: CI note on `bun test`; ROADMAP: Phase 0.7.8 added to Completed, Phase 0.7.5 slimmed to remaining items; GETTING-STARTED/SECURITY checked, no stale content |
| 7. Version Bump | [x] | package.json 0.7.7 → 0.7.8; `bun install` clean; 212 tests pass post-bump |
| 8. Release Notes | [x] | RELEASE-NOTES.md v0.7.8 dated 2026-08-20 — Windows fix (community credit), Security (6 advisories), CI, cglass (#24 acceptance item satisfied), Quality/coverage note |
| 9. PR Creation/Update | [ ] | |
| 10. Issue Triage | [x] | #22/#23/#24/#28 closed pre-release (this release ships their fixes). Remaining open: #17, #20, #25 (blocked on #20), #26 (likely fixed by v0.7.7, awaiting flicky confirmation) — none blocked by or blocking v0.7.8 |
| 11. Merge & Verify | [ ] | User admin-merges (author cannot self-approve; enforce_admins=false) |
| --- GATE: CI | [ ] | Real GitHub Actions now — Ubuntu + Windows tests + bun audit must be green on the release PR |
| 12. Tag & GitHub Release | [ ] | PAUSE for user sign-off before tagging (locked decision) |
| 13. Post-Release | [ ] | LinkedIn draft in ~/Repos/stratofax/posts (repo present on this host) |
| 14. Branch Cleanup | [ ] | |
| 15. Retrospective | [ ] | |

## Features Included (merged to main since v0.7.7, all via PR with green CI where CI existed)

- **Windows support fixed** (#31, community contribution by @voyagi, fixes #28) — backslash path separators broke all internal navigation on Windows (scanner, exclusions, link-rewriter) and made serve() return 403 for every file (containment check). All normalized to forward slashes.
- **Security: 6 dependency advisories cleared** (#31 + #35) — sanitize-html 2.17.3 → 2.17.7 (CVE-2026-44990 critical XSS via `xmp` raw-text passthrough; GHSA-vccv-cmxp-4j9h moderate `javascript:` URI bypass), postcss → 8.5.26 via `^8.5.23` override (CVE-2026-41305 + 2 source-map advisories), nanoid → 3.3.18. `bun audit` clean.
- **First CI** (#34) — GitHub Actions: `bun test` on Ubuntu + Windows (fail-fast off) + separate `bun audit` job. The Windows job failed on pre-#31 main with exactly the #28 symptom, then passed on the fix — the matrix works.
- **`cglass` executable alias** (#36, closes #24) — primary short name; `claude-glass` kept as alias; docs prefer `cglass` with `bun link` install step.
- **build() unit tests** (#37, closes #23) — 14 tests: happy path, v0.7.6 OOM-fix memory-streaming regression guard (via new test-only `BuildHooks.afterRender`), downstream phase isolation, error recovery, incremental skip/rebuild/removal, multi-site isolation.
- **CLAUDE.md** (#33) + community docs (#32).

## Pre-flight verifications (2026-08-20)

- Repo: `/Users/neil/Repos/cadentdev/claude-glass` — git repo, working tree clean ✅
- Branch: `release/v0.7.8` (not base) ✅
- Project variant: 🟦 JS/TS (Bun) — package.json name=claude-glass@0.7.7 ✅
- Host: macOS (Darwin), 16 GB RAM — no RedTeam RAM concern ✅
- `fabric` on PATH is the Python SSH tool, NOT fabric-ai → v0.7.7 Fabric substitutions carry over (Agent(Pentester) for threat model, Agent(Engineer) for review_code, inline pass for improve_writing, hand-written PR body) ✅
- Publish auth precheck: N/A — not published to npm ✅
- Tag `v0.7.8` does not exist on remote ✅
- Posts repo present at `~/Repos/stratofax/posts` ✅

## Coverage note (GATE: Quality)

Overall line coverage moved 96.66% (v0.7.7) → 91.95%. This is denominator growth, not regression: `src/build.ts` (278 lines) previously had **0% coverage and did not appear in the report at all**; it now sits at 90.20% lines / 81.82% funcs and is included in the average. No previously-covered file regressed. Judged a coverage improvement in substance.

## Findings

**Step 1 — RedTeam (Agent(Pentester), 2026-08-20). Zero BLOCKERs. Verdict: PASS.**

| Severity | File:line | Description | Action |
|---|---|---|---|
| LOW | src/serve.ts:50,56 | Backslash→slash rewrite ran on POSIX too: containment compared, and readFileSync used, a mutated path string. Exploitation requires attacker-placed backslash-named symlinks inside outputDir + non-default `--host 0.0.0.0` — not remotely exploitable by default, but introduced by this release | **FIXED in scope** — normalization now gated on `process.platform === 'win32'`, comparison-only; file read uses the unmutated realpath |
| LOW | src/exclusions.ts | `.env.*` not treated as glob — `.env.local` etc. not excluded (carried from v0.7.7) | Deferred again — logged in ROADMAP Phase 0.7.5 remaining |
| LOW | scripts/nightly-build.sh:84 | ntfy curl body interpolation (LAN-only, message-content only) | Deferred (carried from v0.7.7) |
| LOW/INFO | src/search.ts:36 | No realpath check on prefixDir before Pagefind (mitigated by nameToPrefix sanitization) | Deferred (carried from v0.7.7) |
| INFO | src/build.ts:49-50 | MEMORY/** excluded only via opt-in `--no-memory` | Deferred — design choice, unchanged |
| INFO | .github/workflows/ci.yml | No least-privilege permissions block | **FIXED in scope** — `permissions: contents: read` added |

Also verified: `pull_request` trigger (not `pull_request_target`) — fork PRs get read-only token, no secrets referenced. `bun audit`: 0 vulnerabilities. security.test.ts: 9 pass.

**Step 4 — Engineer code review (Agent(Engineer), 2026-08-20). Verdict: NEEDS-WORK → resolved → sign-off conditions met.**

| Finding | Severity | Action |
|---|---|---|
| GETTING-STARTED.md said build output goes to `/tmp/claude-glass/`; actual default is `~/.local/share/claude-glass` | MAJOR | **FIXED in scope** |
| Pre-v0.7.6 root `_pagefind/` orphan upgrade note missing (deferred from v0.7.7 *to* v0.7.8) | MINOR | **FIXED in scope** — upgrade note added to RELEASE-NOTES v0.7.8 |
| layout.ts:28-32 fallback branch unreachable + untested (carried from v0.7.7) | MINOR | Deferred — now logged in ROADMAP instead of carried silently |
| CI `bun-version: latest` — new Bun release can break CI without repo change | MINOR | **FIXED in scope** — pinned 1.3.14 (matches verified local) |
| `--exclude` patterns typed with backslashes don't match on Windows | MINOR | **FIXED in scope** — patterns normalized in isExcluded() |
| Landing-page test asserted on site name (present in every title) | NIT | **FIXED in scope** — asserts on CLAUDE.md-unique rewritten link |
| Incremental tests couple to log copy | NIT | Accepted — BuildHooks also pins behavior |
| README doesn't note `~/.bun/bin` must be on PATH for bun link | NIT | Accepted — standard Bun setup |

Clean bill: Windows fixes correct + CI-validated both platforms; memory-streaming invariant genuinely pinned; per-site pagefind scoping unregressed; source dir stays read-only; `bun link` doc claim verified empirically; no flake risks in new tests (utimesSync +5s, mkdtempSync, no sleeps).

## Detours

_(logged as they occur)_

## User decisions locked

- **Target version**: v0.7.8
- **Process**: full checklist (user chose option 2)
- **Gates**: auto-continue through Security + Quality gates; PAUSE before Step 12 (tag/release) for sign-off (carried over from v0.7.7)
- **CI gate**: real GitHub Actions on the release PR (Ubuntu + Windows + audit)
