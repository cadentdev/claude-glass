# Release Checklist: v0.7.4

**Started:** 2026-04-05 | **Project:** claude-glass

## Current Step: 4. Test Coverage

| Step | Status | Notes |
|------|--------|-------|
| Pre-flight | [x] | JS/TS Bun project, 2 commits since v0.7.3 |
| 1. Security Audit | [x] | 0 blockers, 2 INFO, 1 LOW |
| 2. Triage Findings | [x] | No blockers or should-fix |
| 3. Fix Blockers | [x] | Nothing to fix |
| --- GATE: Security | [x] | PASS |
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

- Output directory moved from /tmp to ~/.local/share/claude-glass (XDG-compliant, reboot-safe)
- Deployment smoke test script (scripts/smoke-test.sh, 14 curl-based checks)
- Nightly build ntfy notification with status summary

## Findings

<!-- Security audit findings logged here -->

## Detours

<!-- Log unplanned work that happened between steps -->
