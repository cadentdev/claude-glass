# Release Checklist: v0.7.6

**Started:** 2026-04-14 | **Completed:** 2026-04-14 | **Project:** claude-glass

## Current Step: Complete

| Step | Status | Notes |
|------|--------|-------|
| Pre-flight | [x] | 4 commits since v0.7.5 (including #19 merged earlier) |
| 1. Security Audit | [x] | 0 blockers, manual review of diff (build.ts memory-only, nightly-build.sh proper argv quoting, docs no-code) |
| 2. Triage Findings | [x] | No findings |
| 3. Fix Blockers | [x] | Nothing to fix |
| --- GATE: Security | [x] | PASS |
| 4. Test Coverage | [x] | 186/186 pass, 97.01% lines, 92.54% funcs |
| --- GATE: Quality | [x] | PASS |
| 5. Dependency Audit | [x] | `bun audit` clean, 0 vulnerabilities |
| 6. Documentation Final Pass | [x] | Anchor slug verified, no stale version refs |
| 7. Version Bump | [x] | 0.7.5 → 0.7.6 in package.json |
| 8. Release Notes | [x] | v0.7.6 entry added to RELEASE-NOTES.md |
| 9. PR Creation/Update | [x] | PR #21 — title and body updated via REST API (gh cli hit GraphQL deprecation bug) |
| 10. Issue Triage | [x] | #20 and #17 open, neither fixed by this release; #20 noted as unblocked |
| 11. Merge & Verify | [x] | Merged at 3269226 via `gh pr merge --merge --admin`; 186/186 on merged main |
| --- GATE: CI | [x] | PASS (no CI, admin merge) |
| 12. Tag & GitHub Release | [x] | v0.7.6 tagged and released at https://github.com/cadentdev/claude-glass/releases/tag/v0.7.6 |
| 13. Post-Release | [x] | Checklist updated to complete state |
| 14. Branch Cleanup | [x] | fix/oom-streaming-render deleted (local + origin) |
| 15. Retrospective | [x] | See below |

## Features Included

- **Render-loop memory fix** — free per-page HTML during render so peak RSS scales with largest in-flight page, not total site size (`src/build.ts`)
- **Nightly cron hardening** — each site build wrapped in `systemd-run --user --scope -p MemoryMax=2500M` with `bun --smol` (`scripts/nightly-build.sh`)
- **Performance and memory docs** — new README section + detailed GETTING-STARTED "Building Large Sites on Low-RAM Hosts" guide with systemd-run and zram instructions

## Findings

Security audit: 0 blockers, 0 findings of any severity.

`src/build.ts` changes are pure memory management (string clearing and array truncation) with no new parsing, path construction, or command execution. Verified that no downstream phase (search, link-check, pagefind, manifest write, landing page render) reads `processed[]` after the array-release point — the captured `siteLandingHtml` and `pageCount` locals are the only fields used downstream.

`scripts/nightly-build.sh` changes use `systemd-run` in argv style with all variables properly quoted. Call sites pass hardcoded strings, not external input. No shell injection surface.

Documentation changes contain no executable content.

## Detours

- **zram host-level install on flicky (out-of-tree).** Installed `systemd-zram-generator` and activated `/dev/zram0` at priority 100 (1.9 GB, lzo-rle compression). Documented in GETTING-STARTED as a recommendation; actual install was operator-level on the build host. Not part of the release artifacts but relevant to validating "does the whole stack actually prevent OOM on flicky."

- **PR edit GraphQL bug.** `gh pr edit` hit a GitHub Projects Classic deprecation error and refused to update title/body. Worked around by using `gh api -X PATCH repos/.../pulls/21` directly, which doesn't traverse the projectCards field. Worth filing upstream if it recurs on future releases.

## Retrospective

**What went well:**
- Incident → fix → release in a single session. Root cause was clear (build.ts holding `processed[]` for full lifetime of `build()`), fix was surgical (19 lines modified in build.ts), and validation was unambiguous (real failing workload under a memory ceiling, before/after numbers).
- Branching off `main` rather than continuing on the `feature/issue-20-build-stats-footer` WIP kept concerns separated and kept the release clean. The #20 rebase is now onto a released baseline with the OOM fix already in place — easier to verify #20 on a working build.
- Three layered fixes (code + cron cap + zram) rather than picking one. Each protects against a different failure mode: fix A prevents the OOM in normal operation, the cron cap contains any future surprise to a single process, and zram absorbs transient spikes without engaging disk I/O.
- Full end-to-end validation twice — once on the raw fix (peak 1.64 GB), once on the complete cron script with all 4 sites (peak 1.55 GB, 4/4 OK).

**What to improve:**
- `src/build.ts` still has 0% unit-test coverage — the end-to-end validation caught the bug and proved the fix, but a unit test that builds a synthetic 100-page site and asserts memory behavior would catch regressions faster. Candidate for a follow-up issue.
- The `gh pr edit` GraphQL bug cost a few minutes. Consider scripting PR updates via `gh api` directly for release workflows.

**Carry-forward:**
- #20 (build-stats footer) WIP is safe at `eda9c5d` on `feature/issue-20-build-stats-footer`. Next step: rebase onto new main, resolve the small `src/build.ts` conflict (fix A touches the render loop, #20 adds a stats-page call after the loop), finish the PRD, ship as 0.7.7.
