/** Server tests — MIME types, CSP, and Pagefind search support */

import { describe, test, expect, afterAll } from 'bun:test';
import { MIME_TYPES, CSP_HEADER } from '../serve';
import { mkdtempSync, writeFileSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';

// --- Unit tests: exported constants ---

describe('MIME_TYPES', () => {
  test('serves .wasm as application/wasm', () => {
    expect(MIME_TYPES['.wasm']).toBe('application/wasm');
  });

  test('serves .pagefind as application/wasm', () => {
    expect(MIME_TYPES['.pagefind']).toBe('application/wasm');
  });

  test('serves standard web types correctly', () => {
    expect(MIME_TYPES['.html']).toBe('text/html');
    expect(MIME_TYPES['.css']).toBe('text/css');
    expect(MIME_TYPES['.js']).toBe('application/javascript');
    expect(MIME_TYPES['.json']).toBe('application/json');
  });
});

describe('CSP_HEADER', () => {
  test('includes wasm-unsafe-eval for Pagefind WASM execution', () => {
    expect(CSP_HEADER).toContain('wasm-unsafe-eval');
  });

  test('restricts default-src to self', () => {
    expect(CSP_HEADER).toContain("default-src 'self'");
  });

  test('does not allow unsafe-eval (only wasm-unsafe-eval)', () => {
    // wasm-unsafe-eval is narrower than unsafe-eval — ensure we don't open the full eval gate
    const scriptSrc = CSP_HEADER.match(/script-src ([^;]+)/)?.[1] ?? '';
    expect(scriptSrc).toContain('wasm-unsafe-eval');
    expect(scriptSrc).not.toMatch(/(?<!'wasm-)'unsafe-eval'/);
  });
});

// --- Integration tests: actual HTTP responses ---

describe('serve HTTP responses', () => {
  const testDir = mkdtempSync(join(tmpdir(), 'claude-glass-test-'));
  const port = 19876; // unlikely to conflict

  // Create test fixture files
  writeFileSync(join(testDir, 'index.html'), '<html><body>test</body></html>');
  writeFileSync(join(testDir, 'test.wasm'), 'fake-wasm-content');
  writeFileSync(join(testDir, 'wasm.en.pagefind'), 'fake-pagefind-wasm');
  writeFileSync(join(testDir, 'test.css'), 'body {}');

  const server = Bun.serve({
    port,
    hostname: '127.0.0.1',
    fetch(req) {
      // Minimal reproduction of serve.ts fetch handler
      const { extname: getExt } = require('path');
      const { existsSync, readFileSync, statSync, realpathSync } = require('fs');
      const { join: joinPath } = require('path');

      const url = new URL(req.url);
      let pathname = url.pathname;
      if (pathname === '/') pathname = '/index.html';

      let filePath = joinPath(testDir, pathname);
      if (!getExt(pathname)) {
        filePath = joinPath(testDir, pathname, 'index.html');
      }

      if (!existsSync(filePath) || !statSync(filePath).isFile()) {
        return new Response('Not Found', { status: 404 });
      }

      const content = readFileSync(filePath);
      const ext = getExt(filePath);
      const contentType = MIME_TYPES[ext] || 'application/octet-stream';

      return new Response(content, {
        headers: {
          'Content-Type': contentType,
          'X-Content-Type-Options': 'nosniff',
          'Content-Security-Policy': CSP_HEADER,
        },
      });
    },
  });

  afterAll(() => {
    server.stop();
  });

  const base = `http://127.0.0.1:${port}`;

  test('serves .wasm files with application/wasm Content-Type', async () => {
    const res = await fetch(`${base}/test.wasm`);
    expect(res.status).toBe(200);
    expect(res.headers.get('Content-Type')).toBe('application/wasm');
  });

  test('serves .pagefind files with application/wasm Content-Type', async () => {
    const res = await fetch(`${base}/wasm.en.pagefind`);
    expect(res.status).toBe(200);
    expect(res.headers.get('Content-Type')).toBe('application/wasm');
  });

  test('serves .css files with text/css Content-Type', async () => {
    const res = await fetch(`${base}/test.css`);
    expect(res.status).toBe(200);
    expect(res.headers.get('Content-Type')).toBe('text/css');
  });

  test('includes wasm-unsafe-eval in CSP header', async () => {
    const res = await fetch(`${base}/index.html`);
    const csp = res.headers.get('Content-Security-Policy');
    expect(csp).toContain('wasm-unsafe-eval');
  });

  test('includes nosniff header', async () => {
    const res = await fetch(`${base}/test.wasm`);
    expect(res.headers.get('X-Content-Type-Options')).toBe('nosniff');
  });

  test('returns 404 for missing files', async () => {
    const res = await fetch(`${base}/nonexistent.wasm`);
    expect(res.status).toBe(404);
  });
});
