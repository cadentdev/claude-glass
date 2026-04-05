import { describe, test, expect } from 'bun:test';
import { effortBadge, modelBadge, tagBadge } from '../processors/badges';

describe('effortBadge', () => {
  test('low → badge-green', () => {
    const html = effortBadge('low');
    expect(html).toContain('badge-green');
    expect(html).toContain('low effort');
  });

  test('medium → badge-yellow', () => {
    const html = effortBadge('medium');
    expect(html).toContain('badge-yellow');
    expect(html).toContain('medium effort');
  });

  test('high → badge-orange', () => {
    const html = effortBadge('high');
    expect(html).toContain('badge-orange');
    expect(html).toContain('high effort');
  });

  test('unknown value → badge-default', () => {
    const html = effortBadge('extreme');
    expect(html).toContain('badge-default');
    expect(html).toContain('extreme effort');
  });

  test('empty string → empty string', () => {
    expect(effortBadge('')).toBe('');
  });

  test('HTML in effort is escaped', () => {
    const html = effortBadge('<script>');
    expect(html).toContain('&lt;script&gt;');
    expect(html).not.toContain('<script>');
  });
});

describe('modelBadge', () => {
  test('opus → badge-blue', () => {
    const html = modelBadge('opus');
    expect(html).toContain('badge-blue');
    expect(html).toContain('opus');
  });

  test('sonnet → badge-purple', () => {
    const html = modelBadge('sonnet');
    expect(html).toContain('badge-purple');
    expect(html).toContain('sonnet');
  });

  test('haiku → badge-red', () => {
    const html = modelBadge('haiku');
    expect(html).toContain('badge-red');
    expect(html).toContain('haiku');
  });

  test('unknown model → badge-blue (default)', () => {
    const html = modelBadge('gpt-4');
    expect(html).toContain('badge-blue');
    expect(html).toContain('gpt-4');
  });

  test('empty string → empty string', () => {
    expect(modelBadge('')).toBe('');
  });

  test('HTML in model is escaped', () => {
    const html = modelBadge('<img src=x>');
    expect(html).toContain('&lt;img');
    expect(html).not.toContain('<img');
  });
});

describe('tagBadge', () => {
  test('renders label with default class badge-purple', () => {
    const html = tagBadge('user-invocable');
    expect(html).toContain('badge-purple');
    expect(html).toContain('user-invocable');
  });

  test('renders with custom class', () => {
    const html = tagBadge('beta', 'badge-red');
    expect(html).toContain('badge-red');
    expect(html).toContain('beta');
  });

  test('HTML in label is escaped', () => {
    const html = tagBadge('<b>bold</b>');
    expect(html).toContain('&lt;b&gt;');
    expect(html).not.toContain('<b>');
  });
});
