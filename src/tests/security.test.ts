/** Security regression tests for v0.7.2 fixes */

import { describe, test, expect } from 'bun:test';
import { escapeHtml } from '../processors/markdown';
import { deriveName, nameToPrefix, updateManifest } from '../manifest';
import { buildBreadcrumbs } from '../nav';

describe('escapeHtml', () => {
  test('escapes angle brackets', () => {
    expect(escapeHtml('<script>alert(1)</script>')).toBe('&lt;script&gt;alert(1)&lt;/script&gt;');
  });

  test('escapes ampersand', () => {
    expect(escapeHtml('A&B')).toBe('A&amp;B');
  });

  test('escapes double quotes', () => {
    expect(escapeHtml('a"b')).toBe('a&quot;b');
  });

  test('prevents attribute breakout via double quote', () => {
    const malicious = 'test" onmouseover="alert(1)';
    const escaped = escapeHtml(malicious);
    expect(escaped).not.toContain('"');
    expect(escaped).toBe('test&quot; onmouseover=&quot;alert(1)');
  });

  test('handles empty string', () => {
    expect(escapeHtml('')).toBe('');
  });

  test('passes through safe strings unchanged', () => {
    expect(escapeHtml('Hello World 123')).toBe('Hello World 123');
  });
});

describe('manifest source path redaction', () => {
  test('nameToPrefix sanitizes to URL-safe', () => {
    expect(nameToPrefix('My Project')).toBe('my-project');
    expect(nameToPrefix('has"quotes')).toBe('has-quotes');
    expect(nameToPrefix('---')).toBe('site');
  });

  test('deriveName uses hostname for ~/.claude', () => {
    const name = deriveName(require('os').homedir() + '/.claude');
    expect(name).toBeTruthy();
    expect(name).not.toContain('/');
  });
});

describe('nav breadcrumbs', () => {
  test('escapes site name in breadcrumbs', () => {
    const crumbs = buildBreadcrumbs('skills/Foo/SKILL.md', '/prefix', 'My "Site"');
    expect(crumbs).not.toContain('"Site"');
    expect(crumbs).toContain('&quot;Site&quot;');
  });
});
