# Feature Checklist: Per-Site Search Indexing

**Issue:** N/A (retroactive) | **Branch:** feature/per-site-search-tests-docs | **Started:** 2026-04-17

## Current Phase: 9 — Retrospective

| Phase | Status | Notes |
|-------|--------|-------|
| 1. Describe Feature | [x] | Retroactive — code shipped in commits 60700ef → 9f2e83d |
| 2. Implementation Plan | [x] | Implementation complete on main; this branch adds tests + docs |
| 3. Implement & Test | [x] | 12 new tests (198 total), 0 fail |
| 4. Refactor | [!] | No refactoring needed — changes were already clean |
| 5. Light Security Review | [x] | No new attack surface — search scoping is a restriction, not an expansion |
| 6. Create PR | [x] | PR created |
| 7. Team Review | [x] | Neil reviews |
| 8a. Update Smoke-Test Script | [!] | N/A — no smoke-test script for claude-glass |
| 8b. Update User Docs | [x] | README search section, exclusions section; RELEASE-NOTES v0.7.7 draft |
| 8c. Live Smoke Test | [x] | All 4 sites serve pagefind assets at 200; paths verified at 3 depths; landing page clean |
| 9. Retrospective | [ ] | |

## Detours

- Implementation landed directly on main across 4 commits before FeatureDev was invoked. This checklist formalizes tests + docs retroactively.
- Posts site needed a non-incremental build to generate its first search index.
