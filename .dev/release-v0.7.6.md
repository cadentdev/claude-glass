# Release Checklist: v0.7.6

**Started:** 2026-04-14 | **Project:** claude-glass

## Current Step: In Progress

| Step | Status | Notes |
|------|--------|-------|
| Pre-flight | [ ] | |
| 1. Security Audit | [ ] | |
| 2. Triage Findings | [ ] | |
| 3. Fix Blockers | [ ] | |
| --- GATE: Security | [ ] | |
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

## Features Included

- **Render-loop memory fix**: free per-page HTML during render so peak RSS scales with largest in-flight page, not total site size (build.ts)
- **Nightly cron hardening**: wrap each site build in `systemd-run --user --scope -p MemoryMax=2500M` with `bun --smol` for defense-in-depth
- **Performance and memory docs**: new README section + detailed GETTING-STARTED "Building Large Sites on Low-RAM Hosts" guide with systemd-run and zram instructions

## Findings

<!-- Security audit findings logged here -->

## Detours

<!-- Log unplanned work that happened between steps -->
