/** Tests for manifest read/write/update and name derivation */

import { describe, test, expect, afterAll, beforeAll } from 'bun:test';
import { mkdtempSync, writeFileSync, mkdirSync, existsSync, readFileSync, rmSync } from 'fs';
import { join } from 'path';
import { tmpdir, hostname } from 'os';
import { readManifest, writeManifest, updateManifest, deriveName, nameToPrefix } from '../manifest';
import type { SiteManifest } from '../types';

const tempDirs: string[] = [];

function makeTmp(): string {
  const dir = mkdtempSync(join(tmpdir(), 'cg-manifest-'));
  tempDirs.push(dir);
  return dir;
}

afterAll(() => {
  for (const d of tempDirs) {
    rmSync(d, { recursive: true, force: true });
  }
});

describe('readManifest', () => {
  test('returns empty sites when file does not exist', () => {
    const dir = makeTmp();
    const result = readManifest(dir);
    expect(result).toEqual({ sites: [] });
  });

  test('reads a valid manifest file', () => {
    const dir = makeTmp();
    const manifest: SiteManifest = {
      sites: [
        { name: 'test', source: '/tmp/test', prefix: 'test', lastBuilt: '2026-01-01T00:00:00.000Z', fileCount: 5 },
      ],
    };
    writeFileSync(join(dir, '.claude-glass.json'), JSON.stringify(manifest));
    const result = readManifest(dir);
    expect(result.sites).toHaveLength(1);
    expect(result.sites[0].name).toBe('test');
    expect(result.sites[0].fileCount).toBe(5);
  });

  test('returns empty sites when file is corrupt JSON', () => {
    const dir = makeTmp();
    writeFileSync(join(dir, '.claude-glass.json'), '{not valid json!!!');
    const result = readManifest(dir);
    expect(result).toEqual({ sites: [] });
  });
});

describe('writeManifest', () => {
  test('writes manifest to .claude-glass.json', () => {
    const dir = makeTmp();
    const manifest: SiteManifest = {
      sites: [
        { name: 'alpha', source: '/src/alpha', prefix: 'alpha', lastBuilt: '2026-01-01T00:00:00.000Z', fileCount: 3 },
      ],
    };
    writeManifest(dir, manifest);
    const file = join(dir, '.claude-glass.json');
    expect(existsSync(file)).toBe(true);
    const content = JSON.parse(readFileSync(file, 'utf-8'));
    expect(content.sites[0].name).toBe('alpha');
  });

  test('overwrites existing manifest', () => {
    const dir = makeTmp();
    const first: SiteManifest = { sites: [{ name: 'a', source: '/a', prefix: 'a', lastBuilt: '', fileCount: 1 }] };
    const second: SiteManifest = { sites: [{ name: 'b', source: '/b', prefix: 'b', lastBuilt: '', fileCount: 2 }] };
    writeManifest(dir, first);
    writeManifest(dir, second);
    const content = JSON.parse(readFileSync(join(dir, '.claude-glass.json'), 'utf-8'));
    expect(content.sites).toHaveLength(1);
    expect(content.sites[0].name).toBe('b');
  });
});

describe('updateManifest', () => {
  test('adds a new entry', () => {
    const manifest: SiteManifest = { sites: [] };
    const result = updateManifest(manifest, {
      name: 'new-site',
      source: '/home/neil/new-site',
      prefix: 'new-site',
      fileCount: 10,
    });
    expect(result.sites).toHaveLength(1);
    expect(result.sites[0].name).toBe('new-site');
    expect(result.sites[0].lastBuilt).toBeTruthy();
    // lastBuilt should be a valid ISO string
    expect(new Date(result.sites[0].lastBuilt).toISOString()).toBe(result.sites[0].lastBuilt);
  });

  test('updates existing entry by prefix match', () => {
    const manifest: SiteManifest = {
      sites: [
        { name: 'old', source: '/old', prefix: 'my-prefix', lastBuilt: '2020-01-01T00:00:00.000Z', fileCount: 1 },
      ],
    };
    const result = updateManifest(manifest, {
      name: 'updated',
      source: '/updated',
      prefix: 'my-prefix',
      fileCount: 99,
    });
    expect(result.sites).toHaveLength(1);
    expect(result.sites[0].name).toBe('updated');
    expect(result.sites[0].fileCount).toBe(99);
    // lastBuilt should be refreshed
    expect(result.sites[0].lastBuilt).not.toBe('2020-01-01T00:00:00.000Z');
  });

  test('does not mutate original manifest', () => {
    const manifest: SiteManifest = {
      sites: [{ name: 'a', source: '/a', prefix: 'a', lastBuilt: '2020-01-01T00:00:00.000Z', fileCount: 1 }],
    };
    const result = updateManifest(manifest, { name: 'b', source: '/b', prefix: 'b', fileCount: 2 });
    expect(manifest.sites).toHaveLength(1);
    expect(result.sites).toHaveLength(2);
  });
});

describe('deriveName', () => {
  test('uses hostname for ~/.claude', () => {
    const home = require('os').homedir();
    const name = deriveName(join(home, '.claude'));
    const expected = hostname().toLowerCase().split('.')[0];
    expect(name).toBe(expected);
  });

  test('uses grandparent for ~/Repos/foo/.claude', () => {
    const home = require('os').homedir();
    const name = deriveName(join(home, 'Repos', 'myproject', '.claude'));
    expect(name).toBe('myproject');
  });

  test('uses basename for ~/Repos/foo', () => {
    const home = require('os').homedir();
    const name = deriveName(join(home, 'Repos', 'coolrepo'));
    expect(name).toBe('coolrepo');
  });

  test('uses parent name for arbitrary .claude dirs', () => {
    const name = deriveName('/opt/projects/webapp/.claude');
    expect(name).toBe('webapp');
  });

  test('uses basename for plain directory', () => {
    const name = deriveName('/some/random/directory');
    expect(name).toBe('directory');
  });
});

describe('nameToPrefix', () => {
  test('lowercases the name', () => {
    expect(nameToPrefix('MyProject')).toBe('myproject');
  });

  test('replaces spaces with hyphens', () => {
    expect(nameToPrefix('my project')).toBe('my-project');
  });

  test('replaces special characters with hyphens', () => {
    expect(nameToPrefix('foo@bar!baz')).toBe('foo-bar-baz');
  });

  test('collapses multiple hyphens', () => {
    expect(nameToPrefix('a---b')).toBe('a-b');
  });

  test('strips leading and trailing hyphens', () => {
    expect(nameToPrefix('-hello-')).toBe('hello');
  });

  test('returns "site" for empty/all-special input', () => {
    expect(nameToPrefix('!!!')).toBe('site');
    expect(nameToPrefix('')).toBe('site');
  });

  test('preserves numbers', () => {
    expect(nameToPrefix('project123')).toBe('project123');
  });
});
