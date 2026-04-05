/** Tests for link-checker.ts — post-build broken link detection */

import { describe, test, expect } from 'bun:test';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import { checkLinks } from '../link-checker';

function makeTempSite(): string {
  return mkdtempSync(join(tmpdir(), 'link-checker-test-'));
}

describe('checkLinks', () => {
  test('valid internal link is not reported as broken', () => {
    const dir = makeTempSite();
    try {
      writeFileSync(join(dir, 'index.html'), '<a href="page.html">link</a>');
      writeFileSync(join(dir, 'page.html'), '<p>target</p>');
      const result = checkLinks(dir);
      expect(result.total).toBe(1);
      expect(result.broken).toHaveLength(0);
    } finally {
      rmSync(dir, { recursive: true });
    }
  });

  test('broken internal link is detected', () => {
    const dir = makeTempSite();
    try {
      writeFileSync(join(dir, 'index.html'), '<a href="missing.html">broken</a>');
      const result = checkLinks(dir);
      expect(result.total).toBe(1);
      expect(result.broken).toHaveLength(1);
      expect(result.broken[0].href).toBe('missing.html');
      expect(result.broken[0].status).toBe('broken');
    } finally {
      rmSync(dir, { recursive: true });
    }
  });

  test('external https links are skipped', () => {
    const dir = makeTempSite();
    try {
      writeFileSync(join(dir, 'index.html'), '<a href="https://example.com">ext</a>');
      const result = checkLinks(dir);
      expect(result.total).toBe(0);
      expect(result.broken).toHaveLength(0);
    } finally {
      rmSync(dir, { recursive: true });
    }
  });

  test('anchor links are skipped', () => {
    const dir = makeTempSite();
    try {
      writeFileSync(join(dir, 'index.html'), '<a href="#section">anchor</a>');
      const result = checkLinks(dir);
      expect(result.total).toBe(0);
      expect(result.broken).toHaveLength(0);
    } finally {
      rmSync(dir, { recursive: true });
    }
  });

  test('mailto links are skipped', () => {
    const dir = makeTempSite();
    try {
      writeFileSync(join(dir, 'index.html'), '<a href="mailto:a@b.com">mail</a>');
      const result = checkLinks(dir);
      expect(result.total).toBe(0);
    } finally {
      rmSync(dir, { recursive: true });
    }
  });

  test('link to directory with index.html resolves as valid', () => {
    const dir = makeTempSite();
    try {
      mkdirSync(join(dir, 'subdir'));
      writeFileSync(join(dir, 'subdir', 'index.html'), '<p>sub</p>');
      writeFileSync(join(dir, 'index.html'), '<a href="subdir">dir link</a>');
      const result = checkLinks(dir);
      expect(result.total).toBe(1);
      expect(result.broken).toHaveLength(0);
    } finally {
      rmSync(dir, { recursive: true });
    }
  });

  test('absolute link starting with / resolves against outputDir', () => {
    const dir = makeTempSite();
    try {
      mkdirSync(join(dir, 'pages'));
      writeFileSync(join(dir, 'pages', 'about.html'), '<p>about</p>');
      writeFileSync(join(dir, 'index.html'), '<a href="/pages/about.html">about</a>');
      const result = checkLinks(dir);
      expect(result.total).toBe(1);
      expect(result.broken).toHaveLength(0);
    } finally {
      rmSync(dir, { recursive: true });
    }
  });

  test('multiple links with mixed valid and broken', () => {
    const dir = makeTempSite();
    try {
      writeFileSync(join(dir, 'exists.html'), '<p>ok</p>');
      writeFileSync(
        join(dir, 'index.html'),
        '<a href="exists.html">ok</a> <a href="nope.html">broken</a> <a href="https://skip.me">ext</a>',
      );
      const result = checkLinks(dir);
      expect(result.total).toBe(2); // exists.html + nope.html (https skipped)
      expect(result.broken).toHaveLength(1);
      expect(result.broken[0].href).toBe('nope.html');
    } finally {
      rmSync(dir, { recursive: true });
    }
  });

  test('nested HTML files are scanned', () => {
    const dir = makeTempSite();
    try {
      mkdirSync(join(dir, 'sub'));
      writeFileSync(join(dir, 'sub', 'page.html'), '<a href="missing.html">broken</a>');
      const result = checkLinks(dir);
      expect(result.total).toBe(1);
      expect(result.broken).toHaveLength(1);
    } finally {
      rmSync(dir, { recursive: true });
    }
  });

  test('_pagefind directory is skipped', () => {
    const dir = makeTempSite();
    try {
      mkdirSync(join(dir, '_pagefind'));
      writeFileSync(join(dir, '_pagefind', 'index.html'), '<a href="missing.html">skip</a>');
      writeFileSync(join(dir, 'index.html'), '<p>main</p>');
      const result = checkLinks(dir);
      expect(result.total).toBe(0);
      expect(result.broken).toHaveLength(0);
    } finally {
      rmSync(dir, { recursive: true });
    }
  });

  test('empty output directory returns zero total', () => {
    const dir = makeTempSite();
    try {
      const result = checkLinks(dir);
      expect(result.total).toBe(0);
      expect(result.broken).toHaveLength(0);
    } finally {
      rmSync(dir, { recursive: true });
    }
  });
});
