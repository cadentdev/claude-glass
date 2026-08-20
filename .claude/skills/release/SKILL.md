---
name: release
description: Run the claude-glass release process — kickoff (scope from an issue), 15 steps, 3 gates, agent-run reviews, pause before tag. Creates and maintains .dev/release-vX.Y.Z.md as the working checklist. Optionally takes an issue number/URL as the driving issue (e.g. /release 24). Use when the user asks to cut, prepare, or resume a release.
---

# claude-glass Release Process

Fifteen steps, three gates, one working file. The checklist instance is the
single source of truth for the release's state; this skill is the template it
is created from. Update the instance file as each step completes — a resumed
session must be able to pick up from it alone.

## Kickoff — establish the driving issue and scope

The skill accepts an issue number or URL as its argument (`/release 24`).
Resolve the release's **driving issue** before anything else:

1. **Issue provided as argument** → `gh issue view <n>`, confirm it with the
   user as the release's scope anchor.
2. **No argument** → ask the user for a specific issue, offering as the
   alternative: survey the open issues (`gh issue list --state open`,
   summarized with any blocking relationships) and let the user pick.
3. **No open issues** (or none suitable) → check ROADMAP.md for the next
   feature enhancement and propose it as the driving scope.

Record the outcome in the instance file under "User decisions locked":
the driving issue/scope, plus anything surveyed and explicitly ruled OUT
of this release.

Scope boundary: kickoff decides *why* this release exists; the checklist
still releases only what is merged on `main`. If the driving issue is not
yet implemented, pause here — the feature work happens first (normal
branch + PR flow), and the release resumes at Setup once it lands.

## Setup

1. Confirm the target version with the user (semver, `vX.Y.Z`) — sized to
   the driving issue (fix/feature → patch/minor).
2. Create branch `release/vX.Y.Z` from up-to-date `main`.
3. Create `.dev/release-vX.Y.Z.md` from the **Checklist instance template**
   at the bottom of this file. Prior instances (`.dev/release-v*.md`) are
   history, not the template — do not copy them.
4. Record the user decisions currently locked (confirm they still stand):
   - Auto-continue through the Security and Quality gates.
   - **PAUSE before Step 12** (tag + GitHub release) for explicit sign-off.
   - Not published to npm — publish steps are N/A.

## Environment deltas (this machine)

- **Fabric AI is NOT installed** — the `fabric` on PATH is Python SSH Fabric.
  Substitute `Agent` runs: a Pentester-prompted agent for the threat model
  (Step 1) and an Engineer-prompted agent for code review (Step 4). Run them
  in parallel. Hand-write the PR body and release notes.
- **Classifier-blocked GitHub actions** (outward actions under the user's
  identity): `gh pr merge --admin`, `gh pr review --approve`,
  `gh issue close`. Plan these as user handoffs — give the exact command
  prefixed with `!` to run in-session, batched when several are pending.
  Allowed directly: `gh pr comment/create/edit`, `gh issue comment`,
  `gh release create`, `git push` (tags and direct-to-main both work via
  admin bypass; enforce_admins=false). Main requires 1 approving review and
  the user can't approve their own PRs, so every self-authored PR needs
  their admin merge.

## Steps

**Pre-flight** — verify before Step 1 and record in the instance file:
repo clean; on `release/vX.Y.Z`; package.json name/version as expected;
host RAM adequate for review agents; tag doesn't already exist on remote;
posts repo present at `~/Repos/stratofax/posts`.

1. **Security Audit** — Agent(Pentester) threat-model pass over the release
   diff and the standing invariants (SECURITY.md). Record findings with
   severity in the instance file's Findings section.
2. **Triage Findings** — classify each finding: fix in scope, or defer.
   Every deferral is logged in ROADMAP.md the same day — never carried
   silently to the next release.
3. **Fix Blockers** — all BLOCKERs fixed before the gate; MAJORs fixed in
   scope unless the user explicitly defers.

**GATE: Security** — zero open BLOCKERs, `bun audit` clean,
`src/tests/security.test.ts` passing.

4. **Test Coverage** — full `bun test` run; record pass/fail/assertion
   counts and coverage. **Compare per-file coverage against the previous
   release, not the aggregate** — adding tests for a previously-uncovered
   file lowers the average (denominator growth, not regression). Run
   Agent(Engineer) code review here if not already running from Step 1.

**GATE: Quality** — no unresolved MAJOR review findings; MINOR/NIT either
addressed or deferred with notes.

5. **Dependency Audit** — `bun audit` on the release branch. **Re-run
   `bun audit` on any dependency PR at merge time, not just filing time** —
   advisories published since the PR was filed won't show in its claims.
6. **Documentation Final Pass** — README, CLAUDE.md, ROADMAP (move the
   release into Completed), GETTING-STARTED, SECURITY. Verify quickstart
   commands and default paths against actual behavior, not memory.
7. **Version Bump** — package.json; `bun install`; full test run post-bump.
8. **Release Notes** — RELEASE-NOTES.md entry, dated, with community
   credit where due and upgrade notes for behavior changes.
9. **PR Creation/Update** — `gh pr create`/`edit` with scope + gate
   results. Backfill the instance file's header (`PR:` field) now.
10. **Issue Triage** — close issues shipped by this release, starting with
    the driving issue from Kickoff (user handoff: `gh issue close` is
    blocked); confirm nothing open blocks the release and nothing ruled
    out at Kickoff crept in.
11. **Merge & Verify** — user admin-merges the PR (handoff); re-run tests
    on merged main.

**GATE: CI** — release PR green (ubuntu + windows + audit jobs) AND the
push-to-main run green.

12. **Tag & GitHub Release** — ⛔ **PAUSE for user sign-off first.** Then
    tag the merge commit, push the tag, `gh release create`.
13. **Post-Release** — LinkedIn draft at
    `~/Repos/stratofax/posts/03-drafts/linkedin/claude-glass-vXYZ.md`
    (frontmatter: platform/project/version/status/date, `status: draft`).
    **Commit and push the draft immediately** — `status: draft` marks it
    unreviewed; an uncommitted file is a loose end, not a review queue.
14. **Branch Cleanup** — delete merged local + remote feature branches.
15. **Retrospective** — what went well / what surprised us / workflow
    recommendations / time, in the instance file. **Then apply the
    recommendations: edit this SKILL.md in the same commit** so the next
    release starts from the improved process, not from a note.

Finish: mark the checklist complete, backfill any `TBD` header fields, and
commit the instance file + any skill edits
(`release: mark vX.Y.Z checklist complete + add retrospective`) — direct
push to main is fine for this commit.

## Checklist instance template

```markdown
# Release Checklist: vX.Y.Z

**Started:** YYYY-MM-DD | **Project:** claude-glass | **Base:** main | **Branch:** release/vX.Y.Z | **PR:** TBD

## Current Step: <step>

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
| 12. Tag & GitHub Release | [ ] | PAUSE for user sign-off |
| 13. Post-Release | [ ] | |
| 14. Branch Cleanup | [ ] | |
| 15. Retrospective | [ ] | |

## Retrospective

## Features Included

## Pre-flight verifications

## Findings

## Detours

_(logged as they occur)_

## User decisions locked
```
