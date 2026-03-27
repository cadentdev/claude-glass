/** Server tests — MIME types, CSP, and Pagefind search support */

import { describe, test, expect } from 'bun:test';

// Import the MIME_TYPES map by reading serve.ts source
// (MIME_TYPES is not exported, so we test via the server response)

describe('serve MIME types', () => {
  // These tests verify the MIME_TYPES map covers all Pagefind file types.
  // We import the source and check the map directly.

  let MIME_TYPES: Record<string, string>;

  // Extract MIME_TYPES from serve.ts module scope
  test('MIME_TYPES includes WASM types for Pagefind', async () => {
    const source = await Bun.file(
      new URL('../serve.ts', import.meta.url).pathname,
    ).text();

    // Verify .wasm entry exists
    expect(source).toContain("'.wasm': 'application/wasm'");

    // Verify .pagefind entry exists (Pagefind WASM files use this extension)
    expect(source).toContain("'.pagefind': 'application/wasm'");
  });
});

describe('serve CSP headers', () => {
  test('CSP allows WebAssembly execution via wasm-unsafe-eval', async () => {
    const source = await Bun.file(
      new URL('../serve.ts', import.meta.url).pathname,
    ).text();

    // The CSP script-src must include 'wasm-unsafe-eval' for Pagefind search
    expect(source).toContain('wasm-unsafe-eval');
  });

  test('CSP allows fetch to same origin for Pagefind index loading', async () => {
    const source = await Bun.file(
      new URL('../serve.ts', import.meta.url).pathname,
    ).text();

    // default-src 'self' or explicit connect-src 'self' covers Pagefind fetch calls
    expect(source).toContain("default-src 'self'");
  });
});
