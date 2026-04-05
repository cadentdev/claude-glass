/** Tests for link-rewriter.ts — internal link rewriting and path map building */

import { describe, test, expect } from 'bun:test';
import { rewriteInternalLinks, buildPathMap } from '../link-rewriter';

describe('rewriteInternalLinks', () => {
  const knownPaths = new Map<string, string>([
    ['docs/guide.md', 'docs/guide/index.html'],
    ['skills/Foo/SKILL.md', 'skills/Foo/SKILL/index.html'],
    ['README.md', 'README/index.html'],
    ['other/page.md', 'other/page/index.html'],
  ]);

  test('external http links are unchanged', () => {
    const html = '<a href="http://example.com">link</a>';
    const result = rewriteInternalLinks(html, 'docs/file.md', knownPaths, '');
    expect(result).toBe(html);
  });

  test('external https links are unchanged', () => {
    const html = '<a href="https://example.com/path">link</a>';
    const result = rewriteInternalLinks(html, 'docs/file.md', knownPaths, '');
    expect(result).toBe(html);
  });

  test('anchor links are unchanged', () => {
    const html = '<a href="#section">link</a>';
    const result = rewriteInternalLinks(html, 'docs/file.md', knownPaths, '');
    expect(result).toBe(html);
  });

  test('mailto links are unchanged', () => {
    const html = '<a href="mailto:user@example.com">email</a>';
    const result = rewriteInternalLinks(html, 'docs/file.md', knownPaths, '');
    expect(result).toBe(html);
  });

  test('javascript links are unchanged', () => {
    const html = '<a href="javascript:void(0)">noop</a>';
    const result = rewriteInternalLinks(html, 'docs/file.md', knownPaths, '');
    expect(result).toBe(html);
  });

  test('absolute links starting with / are unchanged', () => {
    const html = '<a href="/absolute/path">link</a>';
    const result = rewriteInternalLinks(html, 'docs/file.md', knownPaths, '');
    expect(result).toBe(html);
  });

  test('known internal .md link is rewritten to output path', () => {
    const html = '<a href="guide.md">guide</a>';
    const result = rewriteInternalLinks(html, 'docs/file.md', knownPaths, '');
    expect(result).toBe('<a href="/docs/guide/index.html">guide</a>');
  });

  test('known link with baseUrl gets prefix', () => {
    const html = '<a href="guide.md">guide</a>';
    const result = rewriteInternalLinks(html, 'docs/file.md', knownPaths, '/site');
    expect(result).toBe('<a href="/site/docs/guide/index.html">guide</a>');
  });

  test('unknown link is unchanged', () => {
    const html = '<a href="nonexistent.md">missing</a>';
    const result = rewriteInternalLinks(html, 'docs/file.md', knownPaths, '');
    expect(result).toBe(html);
  });

  test('link with fragment is preserved after rewrite', () => {
    const html = '<a href="guide.md#section">guide</a>';
    const result = rewriteInternalLinks(html, 'docs/file.md', knownPaths, '');
    expect(result).toBe('<a href="/docs/guide/index.html#section">guide</a>');
  });

  test('relative path traversal resolves correctly', () => {
    const html = '<a href="../README.md">readme</a>';
    const result = rewriteInternalLinks(html, 'docs/file.md', knownPaths, '');
    expect(result).toBe('<a href="/README/index.html">readme</a>');
  });

  test('extension-less link tries .md', () => {
    const paths = new Map<string, string>([
      ['docs/guide.md', 'docs/guide/index.html'],
    ]);
    const html = '<a href="guide">guide</a>';
    const result = rewriteInternalLinks(html, 'docs/file.md', paths, '');
    expect(result).toBe('<a href="/docs/guide/index.html">guide</a>');
  });

  test('extension-less link tries /SKILL.md', () => {
    const paths = new Map<string, string>([
      ['skills/Foo/SKILL.md', 'skills/Foo/SKILL/index.html'],
    ]);
    const html = '<a href="Foo/SKILL">skill</a>';
    // Current file is in skills/ dir so Foo/SKILL resolves to skills/Foo/SKILL
    const result = rewriteInternalLinks(html, 'skills/index.md', paths, '');
    // The extensionless "skills/Foo/SKILL" doesn't match directly, but "skills/Foo/SKILL.md" does
    expect(result).toContain('skills/Foo/SKILL/index.html');
  });

  test('multiple links in one string are all processed', () => {
    const html = '<a href="guide.md">a</a> <a href="https://ext.com">b</a> <a href="../README.md">c</a>';
    const result = rewriteInternalLinks(html, 'docs/file.md', knownPaths, '');
    expect(result).toContain('/docs/guide/index.html');
    expect(result).toContain('https://ext.com');
    expect(result).toContain('/README/index.html');
  });

  test('data: links are unchanged', () => {
    const html = '<a href="data:text/html,hello">data</a>';
    const result = rewriteInternalLinks(html, 'docs/file.md', knownPaths, '');
    expect(result).toBe(html);
  });
});

describe('buildPathMap', () => {
  test('empty array returns empty map', () => {
    const map = buildPathMap([]);
    expect(map.size).toBe(0);
  });

  test('multiple files produce correct mapping', () => {
    const map = buildPathMap([
      { relativePath: 'README.md', outputPath: 'README/index.html' },
      { relativePath: 'docs/guide.md', outputPath: 'docs/guide/index.html' },
    ]);
    expect(map.size).toBe(2);
    expect(map.get('README.md')).toBe('README/index.html');
    expect(map.get('docs/guide.md')).toBe('docs/guide/index.html');
  });

  test('duplicate paths are overwritten by last entry', () => {
    const map = buildPathMap([
      { relativePath: 'a.md', outputPath: 'first.html' },
      { relativePath: 'a.md', outputPath: 'second.html' },
    ]);
    expect(map.get('a.md')).toBe('second.html');
  });
});
