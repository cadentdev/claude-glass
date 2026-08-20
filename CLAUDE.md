# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What This Is

claude-glass is a static site generator that renders Claude Code `.claude` directories as a browseable local website. It runs on **Bun** (v1.0+, no Node) — TypeScript is executed directly with no compile step.

## Commands

```bash
bun install                          # install dependencies
bun test                             # run all tests (CI runs these on Ubuntu + Windows for every PR)
bun test src/tests/nav.test.ts       # run one test file
bun test -t "pattern"                # run tests matching a name
bun src/cli.ts build [dir]           # build static site (default input: ~/.claude, output: ~/.local/share/claude-glass)
bun src/cli.ts serve [dir]           # build + serve on http://localhost:3333
./scripts/smoke-test.sh [base-url]   # HTTP smoke tests against a running server (reads the output manifest)
```

Useful build flags during development: `--verbose`, `--incremental`, `--no-search`, `--no-link-check`, `-o <dir>` (build to a scratch directory instead of the real output).

## Architecture

The whole build is one linear pipeline orchestrated by `src/build.ts`:

1. **Scan** (`scanner.ts`) — walks the input dir, applies exclusions (`exclusions.ts`), and classifies each file into a `ContentType` (`skill`, `agent`, `workflow`, `hook`, `json`, `markdown`, ...) via filename/path rules in `classifyFile()`. Also pulls in the repo-root `CLAUDE.md` sibling of a `.claude` dir.
2. **Process** (`processors/*.ts`) — one processor per content type turns a `ScanEntry` into a `ProcessedFile` (sanitized HTML + title + metadata + output path). Dispatch is the `processFile()` switch in `build.ts`.
3. **Indexes** (`indexes/*.ts`) — generated pages: filterable skills/hooks/agents tables plus per-directory index pages. These are appended to `processed` and flow through the same render path as real files.
4. **Nav + links** (`nav.ts`, `link-rewriter.ts`) — nav tree, breadcrumbs, and rewriting of internal `.md` links to their output paths.
5. **Render + write** (`templates/layout.ts`, `templates/landing.ts`) — each page is written inside a per-site prefix subdirectory. **Memory-streaming invariant:** each file's `html` is freed (`file.html = ''`) immediately after its page is written, and the `processed` array is emptied before search/link-check phases — peak memory must scale with one in-flight page, not the whole site. Don't add a downstream phase that needs per-file HTML after the render loop; capture what you need before it (see the `siteLandingHtml` pattern).
6. **Post-build** — manifest update, root landing page, build cache (`build-cache.ts`, powers `--incremental`), per-site Pagefind search index (`search.ts`), broken-link report (`link-checker.ts`).

**Multi-site model:** one output directory hosts many sites. Each build writes into `<output>/<prefix>/` and registers itself in `<output>/.claude-glass.json` (`manifest.ts` — `deriveName()`/`nameToPrefix()` define the naming rules). Other sites' output is never touched. The Pagefind index is scoped per-site inside `<prefix>/_pagefind/` — never index the shared output root (it was a major memory/time regression).

**Adding a new content type** touches: `ContentType` in `types.ts`, `classifyFile()` in `scanner.ts`, a new `processors/*.ts`, and the `processFile()` switch in `build.ts`.

`serve.ts` is a thin `Bun.serve()` static server with symlink-resolved path containment (traversal → 403) and a CSP header.

## Security Invariants (see SECURITY.md)

- All rendered markdown goes through `sanitize-html`; the security boundary is network access (localhost bind by default), not content filtering.
- The tool is strictly read-only with respect to the source `.claude` directory.
- `src/tests/security.test.ts` covers XSS/traversal behavior — keep it passing when touching processors or the server.

## Notes

- Files over 10MB are skipped during processing; oversized/broken files are skipped with a warning, never fatal.
- `scripts/nightly-build.sh` is the reference cron deployment (per-site `systemd-run` memory scoping, ntfy summary); README's cron section documents the Linux `loginctl enable-linger` requirement it depends on.
- Release process artifacts (release notes, checklists) live in `RELEASE-NOTES.md` and `ROADMAP.md`.
