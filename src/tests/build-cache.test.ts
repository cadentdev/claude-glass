/** Tests for build cache read/write and diff logic */

import { describe, test, expect, afterAll } from 'bun:test';
import { mkdtempSync, writeFileSync, mkdirSync, existsSync, readFileSync, rmSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import { readBuildCache, writeBuildCache, diffEntries } from '../build-cache';
import type { BuildCache } from '../build-cache';
import type { ScanEntry } from '../types';

const tempDirs: string[] = [];

function makeTmp(): string {
  const dir = mkdtempSync(join(tmpdir(), 'cg-cache-'));
  tempDirs.push(dir);
  return dir;
}

function makeEntry(relativePath: string, mtime: Date, size: number): ScanEntry {
  return {
    relativePath,
    absolutePath: `/fake/${relativePath}`,
    mtime,
    size,
    type: 'markdown',
  };
}

afterAll(() => {
  for (const d of tempDirs) {
    rmSync(d, { recursive: true, force: true });
  }
});

describe('readBuildCache', () => {
  test('returns null when file does not exist', () => {
    const dir = makeTmp();
    expect(readBuildCache(dir, 'mysite')).toBeNull();
  });

  test('returns null when JSON is corrupt', () => {
    const dir = makeTmp();
    const prefixDir = join(dir, 'mysite');
    mkdirSync(prefixDir, { recursive: true });
    writeFileSync(join(prefixDir, '.claude-glass-cache.json'), 'NOT JSON');
    expect(readBuildCache(dir, 'mysite')).toBeNull();
  });

  test('returns null when version is not 1', () => {
    const dir = makeTmp();
    const prefixDir = join(dir, 'mysite');
    mkdirSync(prefixDir, { recursive: true });
    writeFileSync(
      join(prefixDir, '.claude-glass-cache.json'),
      JSON.stringify({ version: 2, builtAt: '2026-01-01T00:00:00.000Z', entries: [] })
    );
    expect(readBuildCache(dir, 'mysite')).toBeNull();
  });

  test('reads a valid cache file', () => {
    const dir = makeTmp();
    const prefixDir = join(dir, 'mysite');
    mkdirSync(prefixDir, { recursive: true });
    const cache: BuildCache = {
      version: 1,
      builtAt: '2026-01-01T00:00:00.000Z',
      entries: [{ relativePath: 'README.md', mtime: '2026-01-01T00:00:00.000Z', size: 100 }],
    };
    writeFileSync(join(prefixDir, '.claude-glass-cache.json'), JSON.stringify(cache));
    const result = readBuildCache(dir, 'mysite');
    expect(result).not.toBeNull();
    expect(result!.version).toBe(1);
    expect(result!.entries).toHaveLength(1);
    expect(result!.entries[0].relativePath).toBe('README.md');
  });
});

describe('writeBuildCache', () => {
  test('writes cache file with version 1', () => {
    const dir = makeTmp();
    const prefixDir = join(dir, 'testsite');
    mkdirSync(prefixDir, { recursive: true });

    const entries: ScanEntry[] = [
      makeEntry('file1.md', new Date('2026-01-01T00:00:00.000Z'), 200),
      makeEntry('file2.ts', new Date('2026-02-01T00:00:00.000Z'), 500),
    ];
    writeBuildCache(dir, 'testsite', entries);

    const filePath = join(prefixDir, '.claude-glass-cache.json');
    expect(existsSync(filePath)).toBe(true);

    const data = JSON.parse(readFileSync(filePath, 'utf-8'));
    expect(data.version).toBe(1);
    expect(data.builtAt).toBeTruthy();
    expect(data.entries).toHaveLength(2);
    expect(data.entries[0].relativePath).toBe('file1.md');
    expect(data.entries[0].size).toBe(200);
    expect(data.entries[1].relativePath).toBe('file2.ts');
  });

  test('cache can be round-tripped through read', () => {
    const dir = makeTmp();
    const prefixDir = join(dir, 'roundtrip');
    mkdirSync(prefixDir, { recursive: true });

    const entries: ScanEntry[] = [makeEntry('test.md', new Date('2026-03-15T12:00:00.000Z'), 42)];
    writeBuildCache(dir, 'roundtrip', entries);

    const result = readBuildCache(dir, 'roundtrip');
    expect(result).not.toBeNull();
    expect(result!.entries[0].relativePath).toBe('test.md');
    expect(result!.entries[0].mtime).toBe('2026-03-15T12:00:00.000Z');
    expect(result!.entries[0].size).toBe(42);
  });
});

describe('diffEntries', () => {
  const baseTime = new Date('2026-01-01T00:00:00.000Z');

  const cachedEntries: BuildCache = {
    version: 1,
    builtAt: '2026-01-01T00:00:00.000Z',
    entries: [
      { relativePath: 'unchanged.md', mtime: baseTime.toISOString(), size: 100 },
      { relativePath: 'changed-mtime.md', mtime: baseTime.toISOString(), size: 200 },
      { relativePath: 'changed-size.md', mtime: baseTime.toISOString(), size: 300 },
      { relativePath: 'removed.md', mtime: baseTime.toISOString(), size: 400 },
    ],
  };

  const laterTime = new Date('2026-02-01T00:00:00.000Z');

  const currentEntries: ScanEntry[] = [
    makeEntry('unchanged.md', baseTime, 100),
    makeEntry('changed-mtime.md', laterTime, 200), // mtime changed
    makeEntry('changed-size.md', baseTime, 999),   // size changed
    makeEntry('added.md', laterTime, 50),           // new file
  ];

  test('identifies unchanged files', () => {
    const result = diffEntries(currentEntries, cachedEntries);
    expect(result.unchanged.map((e) => e.relativePath)).toEqual(['unchanged.md']);
  });

  test('identifies changed files (mtime)', () => {
    const result = diffEntries(currentEntries, cachedEntries);
    const changedPaths = result.changed.map((e) => e.relativePath);
    expect(changedPaths).toContain('changed-mtime.md');
  });

  test('identifies changed files (size)', () => {
    const result = diffEntries(currentEntries, cachedEntries);
    const changedPaths = result.changed.map((e) => e.relativePath);
    expect(changedPaths).toContain('changed-size.md');
  });

  test('identifies added files', () => {
    const result = diffEntries(currentEntries, cachedEntries);
    expect(result.added.map((e) => e.relativePath)).toEqual(['added.md']);
  });

  test('identifies removed files', () => {
    const result = diffEntries(currentEntries, cachedEntries);
    expect(result.removed).toEqual(['removed.md']);
  });

  test('handles empty current entries (all removed)', () => {
    const result = diffEntries([], cachedEntries);
    expect(result.changed).toHaveLength(0);
    expect(result.added).toHaveLength(0);
    expect(result.unchanged).toHaveLength(0);
    expect(result.removed).toHaveLength(4);
  });

  test('handles empty cache entries (all added)', () => {
    const emptyCache: BuildCache = { version: 1, builtAt: '', entries: [] };
    const result = diffEntries(currentEntries, emptyCache);
    expect(result.added).toHaveLength(4);
    expect(result.changed).toHaveLength(0);
    expect(result.removed).toHaveLength(0);
    expect(result.unchanged).toHaveLength(0);
  });

  test('handles both sides empty', () => {
    const emptyCache: BuildCache = { version: 1, builtAt: '', entries: [] };
    const result = diffEntries([], emptyCache);
    expect(result.added).toHaveLength(0);
    expect(result.changed).toHaveLength(0);
    expect(result.removed).toHaveLength(0);
    expect(result.unchanged).toHaveLength(0);
  });
});
