# Release Checklist: v0.7.2

**Started:** 2026-03-26 | **Project:** claude-glass

## Features Included

- Fix search result titles — show "Page Title - siteName" instead of "claude-glass" for every hit
- Site identity in navigation — breadcrumbs, sidebar, and `<title>` tag include site name
- Nightly cron build script — incremental builds for memory-constrained machines (flicky)
- Pagefind ETIMEDOUT fix (v0.7.1, already released but included in this branch)

## Current Step: 15. Retrospective

| Step | Status | Notes |
|------|--------|-------|
| Pre-flight | [x] | JS/TS Bun project, clean tree, on feature/search-identity-fixes |
| 1. Security Audit | [x] | 3 MEDIUM, 6 LOW, 5 INFO — pentester + threat model |
| 2. Triage Findings | [x] | 1 blocker, 4 should-fix, 9 nice-to-have |
| 3. Fix Blockers | [x] | escapeHtml unified, manifest redacted, hrefs encoded, roadmap updated |
| --- GATE: Security | [x] | All blockers resolved, should-fix #2 #5 deferred to v0.8.0 |
| 4. Test Coverage | [x] | 9 tests, 14 assertions — security regressions. Full suite is v0.9.0 scope |
| --- GATE: Quality | [x] | All tests pass, no test infra existed prior — baseline established |
| 5. Dependency Audit | [x] | 5 runtime + 2 dev deps, all current, no CVEs |
| 6. Documentation Final Pass | [x] | README, SECURITY.md, ROADMAP.md all consistent |
| 7. Version Bump | [x] | 0.7.1 → 0.7.2 in package.json |
| 8. Release Notes | [x] | RELEASE-NOTES.md updated |
| 9. PR Creation/Update | [x] | PR #8 |
| 10. Issue Triage | [x] | No open issues |
| 11. Merge & Verify | [x] | Merged to main, credential scan clean |
| --- GATE: CI | [!] | No CI configured (Phase 0.9 scope) |
| 12. Tag & GitHub Release | [x] | v0.7.2 tagged and published |
| 13. Post-Release | [x] | LinkedIn draft created, no npm publish (not yet public) |
| 14. Branch Cleanup | [x] | feature/search-identity-fixes deleted local + remote |
| 15. Retrospective | [ ] | |

## Findings

<!-- Security audit findings logged here -->

## Detours

<!-- Log unplanned work that happened between steps -->
