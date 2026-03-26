# Release Checklist: v0.7.2

**Started:** 2026-03-26 | **Project:** claude-glass

## Features Included

- Fix search result titles — show "Page Title - siteName" instead of "claude-glass" for every hit
- Site identity in navigation — breadcrumbs, sidebar, and `<title>` tag include site name
- Nightly cron build script — incremental builds for memory-constrained machines (flicky)
- Pagefind ETIMEDOUT fix (v0.7.1, already released but included in this branch)

## Current Step: GATE: Security

| Step | Status | Notes |
|------|--------|-------|
| Pre-flight | [x] | JS/TS Bun project, clean tree, on feature/search-identity-fixes |
| 1. Security Audit | [x] | 3 MEDIUM, 6 LOW, 5 INFO — pentester + threat model |
| 2. Triage Findings | [x] | 1 blocker, 4 should-fix, 9 nice-to-have |
| 3. Fix Blockers | [x] | escapeHtml unified, manifest redacted, hrefs encoded, roadmap updated |
| --- GATE: Security | [x] | All blockers resolved, should-fix #2 #5 deferred to v0.8.0 |
| 4. Test Coverage | [ ] | |
| --- GATE: Quality | [ ] | |
| 5. Dependency Audit | [ ] | |
| 6. Documentation Final Pass | [ ] | |
| 7. Version Bump | [ ] | |
| 8. Release Notes | [ ] | |
| 9. PR Creation/Update | [ ] | |
| 10. Issue Triage | [ ] | |
| 11. Merge & Verify | [ ] | |
| --- GATE: CI | [ ] | |
| 12. Tag & GitHub Release | [ ] | |
| 13. Post-Release | [ ] | |
| 14. Branch Cleanup | [ ] | |
| 15. Retrospective | [ ] | |

## Findings

<!-- Security audit findings logged here -->

## Detours

<!-- Log unplanned work that happened between steps -->
