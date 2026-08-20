/** Unit tests for build() — the build orchestrator (issue #23)
 *
 * Covers: small-site happy path, the memory-streaming invariant from the
 * v0.7.6 OOM fix, downstream-phase isolation, error recovery, incremental
 * builds, and multi-site isolation. Search stays disabled here — pagefind
 * execution is covered by scripts/smoke-test.sh.
 */

import { describe, test, expect, afterAll } from 'bun:test';
import { build, type BuildHooks } from '../build';
import {
  mkdtempSync,
  writeFileSync,
  mkdirSync,
  existsSync,
  readFileSync,
  rmSync,
  unlinkSync,
  utimesSync,
} from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import type { BuildConfig } from '../types';

const cleanupDirs: string[] = [];
afterAll(() => {
  for (const dir of cleanupDirs) rmSync(dir, { recursive: true, force: true });
});

function makeTempDir(label: string): string {
  const dir = mkdtempSync(join(tmpdir(), `cg-build-${label}-`));
  cleanupDirs.push(dir);
  return dir;
}

/** A small synthetic .claude-style tree exercising several content types. */
function makeSite(): string {
  const dir = makeTempDir('in');
  writeFileSync(join(dir, 'CLAUDE.md'), '# Test Site\n\nSee [the guide](docs/guide.md).\n');
  writeFileSync(join(dir, 'settings.json'), '{"theme": "dark", "port": 3333}');
  mkdirSync(join(dir, 'docs'));
  writeFileSync(join(dir, 'docs', 'guide.md'), '# Guide\n\nHello world.\n');
  writeFileSync(join(dir, 'docs', 'notes.md'), '# Notes\n\nMore content.\n');
  mkdirSync(join(dir, 'skills', 'DemoSkill'), { recursive: true });
  writeFileSync(
    join(dir, 'skills', 'DemoSkill', 'SKILL.md'),
    '---\nname: demo-skill\ndescription: A demo skill\n---\n\n# Demo Skill\n',
  );
  mkdirSync(join(dir, 'agents'));
  writeFileSync(join(dir, 'agents', 'helper.md'), '---\nname: helper\n---\n\n# Helper agent\n');
  return dir;
}

function makeConfig(inputDir: string, outputDir: string, overrides: Partial<BuildConfig> = {}): BuildConfig {
  return {
    inputDir,
    outputDir,
    port: 3333,
    host: '127.0.0.1',
    noSearch: true,
    noMemory: false,
    noLinkCheck: false,
    incremental: false,
    exclude: [],
    verbose: false,
    name: 'Test Site',
    ...overrides,
  };
}

/** Run build() with console output captured; returns the log lines. */
async function quietBuild(config: BuildConfig, hooks?: BuildHooks): Promise<string[]> {
  const logs: string[] = [];
  const origLog = console.log;
  const origErr = console.error;
  console.log = (...args: unknown[]) => { logs.push(args.join(' ')); };
  console.error = (...args: unknown[]) => { logs.push(args.join(' ')); };
  try {
    await build(config, hooks);
  } finally {
    console.log = origLog;
    console.error = origErr;
  }
  return logs;
}

describe('build() happy path', async () => {
  const inputDir = makeSite();
  const outputDir = makeTempDir('out');
  await quietBuild(makeConfig(inputDir, outputDir));
  const prefixDir = join(outputDir, 'test-site');

  test('name is prefixed correctly ("Test Site" -> test-site/)', () => {
    expect(existsSync(prefixDir)).toBe(true);
  });

  test('renders a page per source file', () => {
    expect(existsSync(join(prefixDir, 'CLAUDE', 'index.html'))).toBe(true);
    expect(existsSync(join(prefixDir, 'docs', 'guide', 'index.html'))).toBe(true);
    expect(existsSync(join(prefixDir, 'docs', 'notes', 'index.html'))).toBe(true);
    expect(existsSync(join(prefixDir, 'settings', 'index.html'))).toBe(true);
    expect(existsSync(join(prefixDir, 'skills', 'DemoSkill', 'SKILL', 'index.html'))).toBe(true);
    expect(existsSync(join(prefixDir, 'agents', 'helper', 'index.html'))).toBe(true);
  });

  test('writes generated index pages', () => {
    expect(existsSync(join(prefixDir, 'skills-index', 'index.html'))).toBe(true);
    expect(existsSync(join(prefixDir, 'agents-index', 'index.html'))).toBe(true);
    // Directory index for docs/
    expect(existsSync(join(prefixDir, 'docs', 'index.html'))).toBe(true);
  });

  test('site landing page uses CLAUDE.md content', () => {
    const html = readFileSync(join(prefixDir, 'index.html'), 'utf-8');
    // Assert on body content unique to CLAUDE.md (its rewritten guide link),
    // not the site name, which appears in every page title.
    expect(html).toContain('href="/test-site/docs/guide/index.html"');
  });

  test('root landing page and manifest register the site', () => {
    expect(existsSync(join(outputDir, 'index.html'))).toBe(true);
    const manifest = JSON.parse(readFileSync(join(outputDir, '.claude-glass.json'), 'utf-8'));
    expect(manifest.sites).toHaveLength(1);
    expect(manifest.sites[0].name).toBe('Test Site');
    expect(manifest.sites[0].prefix).toBe('test-site');
    expect(manifest.sites[0].fileCount).toBeGreaterThan(0);
  });

  test('internal .md links are rewritten to output paths', () => {
    const html = readFileSync(join(prefixDir, 'CLAUDE', 'index.html'), 'utf-8');
    expect(html).toContain('href="/test-site/docs/guide/index.html"');
    expect(html).not.toContain('href="docs/guide.md"');
  });

  test('copies stylesheet into prefix dir and output root', () => {
    expect(existsSync(join(prefixDir, 'style.css'))).toBe(true);
    expect(existsSync(join(outputDir, 'style.css'))).toBe(true);
  });
});

describe('build() memory-streaming invariant (v0.7.6 OOM fix)', () => {
  test('every page html is freed after the render loop and the array is released', async () => {
    const inputDir = makeSite();
    const outputDir = makeTempDir('out');

    let capturedRef: unknown[] | null = null;
    let pagesSeen = 0;
    let htmlLeaks = 0;
    const hooks: BuildHooks = {
      afterRender: (processed) => {
        capturedRef = processed;
        pagesSeen = processed.length;
        htmlLeaks = processed.filter((f) => f.html !== '').length;
      },
    };

    await quietBuild(makeConfig(inputDir, outputDir), hooks);

    // Hook fired and saw the full page set (source pages + generated indexes)
    expect(pagesSeen).toBeGreaterThan(6);
    // Regression guard: no page may still hold its rendered HTML after the loop
    expect(htmlLeaks).toBe(0);
    // The array itself must be emptied before search/link-check phases
    expect(capturedRef!.length).toBe(0);
  });

  test('link check still succeeds after the processed array is released', async () => {
    const inputDir = makeSite();
    const outputDir = makeTempDir('out');
    // noLinkCheck: false — checkLinks() runs after processed.length = 0.
    // Completing without throwing pins that no downstream phase reads the array.
    const logs = await quietBuild(makeConfig(inputDir, outputDir, { noLinkCheck: false }));
    expect(logs.some((l) => l.includes('Links:'))).toBe(true);
  });
});

describe('build() error recovery', () => {
  test('oversized and malformed files do not abort the build', async () => {
    const inputDir = makeSite();
    const outputDir = makeTempDir('out');

    // >10MB markdown file — must be skipped, not fatal
    writeFileSync(join(inputDir, 'huge.md'), Buffer.alloc(11 * 1024 * 1024, 0x61));
    // Malformed JSON — must fall back to a raw code block, not fatal
    writeFileSync(join(inputDir, 'broken.json'), '{ not: valid json !!!');

    await quietBuild(makeConfig(inputDir, outputDir));
    const prefixDir = join(outputDir, 'test-site');

    // Healthy files still rendered
    expect(existsSync(join(prefixDir, 'docs', 'guide', 'index.html'))).toBe(true);
    // Oversized file skipped entirely
    expect(existsSync(join(prefixDir, 'huge', 'index.html'))).toBe(false);
    // Malformed JSON rendered as escaped raw content
    const brokenHtml = readFileSync(join(prefixDir, 'broken', 'index.html'), 'utf-8');
    expect(brokenHtml).toContain('not: valid json');
  });
});

describe('build() incremental', () => {
  test('skips the rebuild when nothing changed', async () => {
    const inputDir = makeSite();
    const outputDir = makeTempDir('out');
    const config = makeConfig(inputDir, outputDir, { incremental: true });

    const firstLogs = await quietBuild(config);
    expect(firstLogs.some((l) => l.includes('no cache found'))).toBe(true);

    let renderRan = false;
    const secondLogs = await quietBuild(config, { afterRender: () => { renderRan = true; } });
    expect(secondLogs.some((l) => l.includes('Skipping build'))).toBe(true);
    expect(renderRan).toBe(false);
  });

  test('rebuilds when a source file changes', async () => {
    const inputDir = makeSite();
    const outputDir = makeTempDir('out');
    const config = makeConfig(inputDir, outputDir, { incremental: true });
    await quietBuild(config);

    const guide = join(inputDir, 'docs', 'guide.md');
    writeFileSync(guide, '# Guide\n\nUpdated content, different size.\n');
    const future = new Date(Date.now() + 5000);
    utimesSync(guide, future, future);

    let renderRan = false;
    const logs = await quietBuild(config, { afterRender: () => { renderRan = true; } });
    expect(logs.some((l) => l.includes('1 changed'))).toBe(true);
    expect(renderRan).toBe(true);
  });

  test('removes output pages for deleted source files', async () => {
    const inputDir = makeSite();
    const outputDir = makeTempDir('out');
    const config = makeConfig(inputDir, outputDir, { incremental: true });
    await quietBuild(config);

    const notesOut = join(outputDir, 'test-site', 'docs', 'notes', 'index.html');
    expect(existsSync(notesOut)).toBe(true);

    unlinkSync(join(inputDir, 'docs', 'notes.md'));
    await quietBuild(config);
    expect(existsSync(notesOut)).toBe(false);
  });
});

describe('build() multi-site isolation', () => {
  test('building a second site leaves the first untouched and registers both', async () => {
    const outputDir = makeTempDir('out');

    const siteA = makeSite();
    await quietBuild(makeConfig(siteA, outputDir, { name: 'Alpha' }));

    const siteB = makeTempDir('in');
    writeFileSync(join(siteB, 'CLAUDE.md'), '# Beta Site\n');
    await quietBuild(makeConfig(siteB, outputDir, { name: 'Beta' }));

    // Site A's output is preserved
    expect(existsSync(join(outputDir, 'alpha', 'docs', 'guide', 'index.html'))).toBe(true);
    // Site B rendered under its own prefix
    expect(existsSync(join(outputDir, 'beta', 'index.html'))).toBe(true);

    const manifest = JSON.parse(readFileSync(join(outputDir, '.claude-glass.json'), 'utf-8'));
    const names = manifest.sites.map((s: { name: string }) => s.name).sort();
    expect(names).toEqual(['Alpha', 'Beta']);

    const landing = readFileSync(join(outputDir, 'index.html'), 'utf-8');
    expect(landing).toContain('Alpha');
    expect(landing).toContain('Beta');
  });
});
