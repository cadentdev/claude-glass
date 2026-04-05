/** Integration tests for the actual serve() function from serve.ts */

import { describe, test, expect, afterAll } from 'bun:test';
import { serve } from '../serve';
import { mkdtempSync, writeFileSync, mkdirSync, symlinkSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import type { BuildConfig } from '../types';

describe('serve() integration', () => {
  const testDir = mkdtempSync(join(tmpdir(), 'claude-glass-serve-'));
  const port = 19877;

  // Create fixture files
  writeFileSync(join(testDir, 'index.html'), '<html><body>landing</body></html>');
  writeFileSync(join(testDir, 'style.css'), 'body { margin: 0; }');
  writeFileSync(join(testDir, 'test.wasm'), 'fake-wasm');
  mkdirSync(join(testDir, 'flicky'));
  writeFileSync(join(testDir, 'flicky', 'index.html'), '<html><body>flicky site</body></html>');
  mkdirSync(join(testDir, 'sub', 'deep'), { recursive: true });
  writeFileSync(join(testDir, 'sub', 'deep', 'index.html'), '<html><body>deep</body></html>');

  // Create a symlink outside testDir for path traversal test
  const outsideDir = mkdtempSync(join(tmpdir(), 'claude-glass-outside-'));
  writeFileSync(join(outsideDir, 'secret.html'), 'secret content');
  try {
    symlinkSync(join(outsideDir, 'secret.html'), join(testDir, 'symlink.html'));
  } catch { /* symlinks may not work in all environments */ }

  const config: BuildConfig = {
    inputDir: testDir,
    outputDir: testDir,
    port,
    host: '127.0.0.1',
    noSearch: true,
    noMemory: true,
    noLinkCheck: true,
    incremental: false,
    exclude: [],
    verbose: false,
  };

  // Suppress console.log from serve()
  const origLog = console.log;
  console.log = () => {};
  serve(config);
  console.log = origLog;

  afterAll(() => {
    // Bun.serve instances are cleaned up when process exits
  });

  const base = `http://127.0.0.1:${port}`;

  test('serves root as index.html', async () => {
    const res = await fetch(`${base}/`);
    expect(res.status).toBe(200);
    const body = await res.text();
    expect(body).toContain('landing');
  });

  test('serves CSS with correct Content-Type', async () => {
    const res = await fetch(`${base}/style.css`);
    expect(res.status).toBe(200);
    expect(res.headers.get('Content-Type')).toBe('text/css');
  });

  test('serves WASM with correct Content-Type', async () => {
    const res = await fetch(`${base}/test.wasm`);
    expect(res.status).toBe(200);
    expect(res.headers.get('Content-Type')).toBe('application/wasm');
  });

  test('directory path resolves to index.html', async () => {
    const res = await fetch(`${base}/flicky`);
    expect(res.status).toBe(200);
    const body = await res.text();
    expect(body).toContain('flicky site');
  });

  test('nested directory resolves to index.html', async () => {
    const res = await fetch(`${base}/sub/deep`);
    expect(res.status).toBe(200);
    const body = await res.text();
    expect(body).toContain('deep');
  });

  test('returns 404 for missing files', async () => {
    const res = await fetch(`${base}/nonexistent.html`);
    expect(res.status).toBe(404);
  });

  test('includes CSP header', async () => {
    const res = await fetch(`${base}/`);
    expect(res.headers.get('Content-Security-Policy')).toContain('wasm-unsafe-eval');
  });

  test('includes nosniff header', async () => {
    const res = await fetch(`${base}/style.css`);
    expect(res.headers.get('X-Content-Type-Options')).toBe('nosniff');
  });

  test('symlink outside output dir returns 403', async () => {
    const res = await fetch(`${base}/symlink.html`);
    // Either 403 (symlink resolved outside) or 404 (symlink not created)
    expect([403, 404]).toContain(res.status);
  });

  test('unknown extension returns application/octet-stream', async () => {
    writeFileSync(join(testDir, 'data.xyz'), 'binary data');
    const res = await fetch(`${base}/data.xyz`);
    expect(res.status).toBe(200);
    expect(res.headers.get('Content-Type')).toBe('application/octet-stream');
  });
});
