/** Tests for markdown processor — processMarkdown, extractFrontmatter, sanitizeColor, escapeHtml */

import { describe, test, expect } from 'bun:test';
import { mkdtempSync, writeFileSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import { processMarkdown, extractFrontmatter, sanitizeColor, escapeHtml, sanitizeOptions } from '../processors/markdown';
import type { ScanEntry } from '../types';

function makeTempMd(filename: string, content: string): string {
  const tmp = mkdtempSync(join(tmpdir(), 'claude-glass-md-'));
  const filePath = join(tmp, filename);
  writeFileSync(filePath, content, 'utf-8');
  return filePath;
}

function makeEntry(absolutePath: string, relativePath: string): ScanEntry {
  return { absolutePath, relativePath, type: 'markdown', size: 100, mtime: new Date() };
}

describe('extractFrontmatter', () => {
  test('extracts YAML frontmatter', () => {
    const content = '---\nname: Test\ntitle: My Title\n---\n\n# Body';
    const { frontmatter, body } = extractFrontmatter(content);
    expect(frontmatter.name).toBe('Test');
    expect(frontmatter.title).toBe('My Title');
    expect(body).toContain('# Body');
  });

  test('no frontmatter returns empty object and full body', () => {
    const content = '# Just a heading\n\nSome text.';
    const { frontmatter, body } = extractFrontmatter(content);
    expect(Object.keys(frontmatter)).toHaveLength(0);
    expect(body).toBe(content);
  });

  test('handles values with colons', () => {
    const content = '---\nurl: https://example.com\n---\n\nBody';
    const { frontmatter } = extractFrontmatter(content);
    expect(frontmatter.url).toBe('https://example.com');
  });
});

describe('processMarkdown', () => {
  test('renders markdown with frontmatter title', () => {
    const content = '---\ntitle: My Page\n---\n\n## Section\n\nHello world.';
    const absPath = makeTempMd('page.md', content);
    const entry = makeEntry(absPath, 'docs/page.md');
    const result = processMarkdown(entry);

    expect(result.title).toBe('My Page');
    expect(result.html).toContain('Hello world');
    expect(result.html).toContain('metadata-card');
    expect(result.outputPath).toBe('docs/page/index.html');
  });

  test('uses name from frontmatter over title', () => {
    const content = '---\nname: Named\ntitle: Titled\n---\n\nBody.';
    const absPath = makeTempMd('named.md', content);
    const entry = makeEntry(absPath, 'named.md');
    const result = processMarkdown(entry);

    expect(result.title).toBe('Named');
  });

  test('falls back to heading when no frontmatter title', () => {
    const content = '# Heading Title\n\nContent here.';
    const absPath = makeTempMd('heading.md', content);
    const entry = makeEntry(absPath, 'heading.md');
    const result = processMarkdown(entry);

    expect(result.title).toBe('Heading Title');
    expect(result.html).not.toContain('metadata-card');
  });

  test('falls back to filename when no heading', () => {
    const content = 'Just plain text, no heading.';
    const absPath = makeTempMd('plain.md', content);
    const entry = makeEntry(absPath, 'docs/plain.md');
    const result = processMarkdown(entry);

    expect(result.title).toBe('plain');
  });

  test('renders code blocks with syntax highlighting', () => {
    const content = '```typescript\nconst x = 1;\n```';
    const absPath = makeTempMd('code.md', content);
    const entry = makeEntry(absPath, 'code.md');
    const result = processMarkdown(entry);

    expect(result.html).toContain('hljs');
  });

  test('renders frontmatter as metadata table', () => {
    const content = '---\nstatus: active\npriority: high\n---\n\nBody.';
    const absPath = makeTempMd('meta.md', content);
    const entry = makeEntry(absPath, 'meta.md');
    const result = processMarkdown(entry);

    expect(result.html).toContain('meta-key');
    expect(result.html).toContain('status');
    expect(result.html).toContain('active');
  });

  test('sanitizes HTML in markdown', () => {
    const content = '<script>alert(1)</script>\n\nSafe text.';
    const absPath = makeTempMd('xss.md', content);
    const entry = makeEntry(absPath, 'xss.md');
    const result = processMarkdown(entry);

    expect(result.html).not.toContain('<script>');
    expect(result.html).toContain('Safe text');
  });
});

describe('sanitizeColor', () => {
  test('accepts hex colors', () => {
    expect(sanitizeColor('#ff6600')).toBe('#ff6600');
    expect(sanitizeColor('#fff')).toBe('#fff');
    expect(sanitizeColor('#aabbccdd')).toBe('#aabbccdd');
  });

  test('accepts named colors', () => {
    expect(sanitizeColor('red')).toBe('red');
    expect(sanitizeColor('steelblue')).toBe('steelblue');
  });

  test('accepts rgb colors', () => {
    expect(sanitizeColor('rgb(255, 128, 0)')).toBe('rgb(255, 128, 0)');
  });

  test('accepts hsl colors', () => {
    expect(sanitizeColor('hsl(120, 50%, 50%)')).toBe('hsl(120, 50%, 50%)');
  });

  test('rejects malicious values', () => {
    expect(sanitizeColor('javascript:alert(1)')).toBe('');
    expect(sanitizeColor('url(http://evil.com)')).toBe('');
    expect(sanitizeColor('expression(alert(1))')).toBe('');
  });

  test('returns empty string for empty input', () => {
    expect(sanitizeColor('')).toBe('');
  });

  test('trims whitespace', () => {
    expect(sanitizeColor('  #fff  ')).toBe('#fff');
  });
});

describe('escapeHtml', () => {
  test('escapes all special characters', () => {
    expect(escapeHtml('<div>"test" & \'stuff\'</div>')).toBe('&lt;div&gt;&quot;test&quot; &amp; \'stuff\'&lt;/div&gt;');
  });
});

describe('sanitizeOptions', () => {
  test('allows standard tags plus extras', () => {
    expect(sanitizeOptions.allowedTags).toContain('details');
    expect(sanitizeOptions.allowedTags).toContain('summary');
    expect(sanitizeOptions.allowedTags).toContain('pre');
    expect(sanitizeOptions.allowedTags).toContain('code');
  });

  test('allows code class for syntax highlighting', () => {
    expect(sanitizeOptions.allowedAttributes?.code).toContain('class');
  });
});
