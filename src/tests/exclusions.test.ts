/** Tests for exclusion pattern matching */

import { describe, test, expect } from 'bun:test';
import { isExcluded, DEFAULT_EXCLUSIONS } from '../exclusions';

describe('DEFAULT_EXCLUSIONS', () => {
  test('is a non-empty array of strings', () => {
    expect(Array.isArray(DEFAULT_EXCLUSIONS)).toBe(true);
    expect(DEFAULT_EXCLUSIONS.length).toBeGreaterThan(0);
    for (const pattern of DEFAULT_EXCLUSIONS) {
      expect(typeof pattern).toBe('string');
    }
  });

  test('includes key patterns', () => {
    expect(DEFAULT_EXCLUSIONS).toContain('sessions/**');
    expect(DEFAULT_EXCLUSIONS).toContain('.env');
    expect(DEFAULT_EXCLUSIONS).toContain('*.png');
    expect(DEFAULT_EXCLUSIONS).toContain('.git/**');
    expect(DEFAULT_EXCLUSIONS).toContain('node_modules/**');
  });

  test('includes worktree exclusions', () => {
    expect(DEFAULT_EXCLUSIONS).toContain('worktrees/**');
    expect(DEFAULT_EXCLUSIONS).toContain('.claude/worktrees/**');
  });
});

describe('isExcluded with DEFAULT_EXCLUSIONS', () => {
  test('sessions/foo.json is excluded by sessions/**', () => {
    expect(isExcluded('sessions/foo.json', DEFAULT_EXCLUSIONS)).toBe(true);
  });

  test('.env is excluded by exact match', () => {
    expect(isExcluded('.env', DEFAULT_EXCLUSIONS)).toBe(true);
  });

  test('test.png is excluded by *.png', () => {
    expect(isExcluded('test.png', DEFAULT_EXCLUSIONS)).toBe(true);
  });

  test('deep/nested/image.png is excluded by *.png', () => {
    expect(isExcluded('deep/nested/image.png', DEFAULT_EXCLUSIONS)).toBe(true);
  });

  test('CLAUDE.md is NOT excluded', () => {
    expect(isExcluded('CLAUDE.md', DEFAULT_EXCLUSIONS)).toBe(false);
  });

  test('settings.json is NOT excluded', () => {
    expect(isExcluded('settings.json', DEFAULT_EXCLUSIONS)).toBe(false);
  });

  test('.git/config is excluded by .git/**', () => {
    expect(isExcluded('.git/config', DEFAULT_EXCLUSIONS)).toBe(true);
  });

  test('node_modules/foo is excluded by node_modules/**', () => {
    expect(isExcluded('node_modules/foo', DEFAULT_EXCLUSIONS)).toBe(true);
  });

  test('random/path.ts is NOT excluded', () => {
    expect(isExcluded('random/path.ts', DEFAULT_EXCLUSIONS)).toBe(false);
  });

  test('.git directory itself is excluded', () => {
    expect(isExcluded('.git', DEFAULT_EXCLUSIONS)).toBe(true);
  });
});

describe('isExcluded pattern types', () => {
  test('exact filename match works on nested paths', () => {
    expect(isExcluded('some/deep/path/.env', ['.env'])).toBe(true);
    expect(isExcluded('.env', ['.env'])).toBe(true);
  });

  test('extension glob matches anywhere', () => {
    expect(isExcluded('foo.key', ['*.key'])).toBe(true);
    expect(isExcluded('dir/bar.key', ['*.key'])).toBe(true);
    expect(isExcluded('foo.txt', ['*.key'])).toBe(false);
  });

  test('directory glob matches dir and contents', () => {
    expect(isExcluded('cache', ['cache/**'])).toBe(true);
    expect(isExcluded('cache/file.txt', ['cache/**'])).toBe(true);
    expect(isExcluded('cache/deep/nested', ['cache/**'])).toBe(true);
    expect(isExcluded('notcache/file.txt', ['cache/**'])).toBe(false);
  });

  test('exact path match', () => {
    expect(isExcluded('specific/file.json', ['specific/file.json'])).toBe(true);
    expect(isExcluded('other/file.json', ['specific/file.json'])).toBe(false);
  });

  test('returns false for empty exclusions', () => {
    expect(isExcluded('anything.ts', [])).toBe(false);
  });

  test('.env.* pattern is treated as exact filename (no wildcard expansion)', () => {
    // The matchPattern function treats .env.* as an exact filename match
    // because it does not start with *. — so .env.local does NOT match .env.*
    expect(isExcluded('.env.local', ['.env.*'])).toBe(false);
    // But .env itself is an exact match
    expect(isExcluded('.env', DEFAULT_EXCLUSIONS)).toBe(true);
  });

  test('sensitive key files excluded', () => {
    expect(isExcluded('server.pem', DEFAULT_EXCLUSIONS)).toBe(true);
    expect(isExcluded('id_rsa', DEFAULT_EXCLUSIONS)).toBe(true);
    expect(isExcluded('id_ed25519', DEFAULT_EXCLUSIONS)).toBe(true);
  });

  test('worktrees directory is excluded', () => {
    expect(isExcluded('worktrees/agent-abc123/file.md', DEFAULT_EXCLUSIONS)).toBe(true);
  });

  test('.claude/worktrees directory is excluded', () => {
    expect(isExcluded('.claude/worktrees/agent-abc123/file.md', DEFAULT_EXCLUSIONS)).toBe(true);
  });

  test('worktrees directory itself is excluded', () => {
    expect(isExcluded('worktrees', DEFAULT_EXCLUSIONS)).toBe(true);
    expect(isExcluded('.claude/worktrees', DEFAULT_EXCLUSIONS)).toBe(true);
  });
});
