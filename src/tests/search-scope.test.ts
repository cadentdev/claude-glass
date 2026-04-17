/** Tests for per-site search scoping — pagefind paths and landing page */

import { describe, test, expect } from 'bun:test';
import { renderPage } from '../templates/layout';
import { renderLandingPage } from '../templates/landing';
import type { SiteManifest } from '../types';

describe('layout pagefind paths are prefix-relative', () => {
  const baseOpts = {
    title: 'Test Page',
    content: '<p>hello</p>',
    navHtml: '<nav></nav>',
    breadcrumbs: '<span>Home</span>',
    cssPath: '../style.css',
    siteName: 'flicky',
    sitePrefix: 'flicky',
  };

  test('page at prefix root references _pagefind/ directly', () => {
    const html = renderPage({
      ...baseOpts,
      fullOutputPath: 'flicky/index.html',
    });
    // depth=1 (flicky), prefixDepth=0 → no ../ prefix
    expect(html).toContain('href="_pagefind/pagefind-ui.css"');
    expect(html).toContain('src="_pagefind/pagefind-ui.js"');
  });

  test('page one level deep references ../_pagefind/', () => {
    const html = renderPage({
      ...baseOpts,
      fullOutputPath: 'flicky/skills/index.html',
    });
    // depth=2, prefixDepth=1 → one ../
    expect(html).toContain('href="../_pagefind/pagefind-ui.css"');
    expect(html).toContain('src="../_pagefind/pagefind-ui.js"');
  });

  test('page two levels deep references ../../_pagefind/', () => {
    const html = renderPage({
      ...baseOpts,
      fullOutputPath: 'flicky/skills/Research/index.html',
    });
    // depth=3, prefixDepth=2 → two ../
    expect(html).toContain('href="../../_pagefind/pagefind-ui.css"');
    expect(html).toContain('src="../../_pagefind/pagefind-ui.js"');
  });

  test('pagefind paths never reach above the prefix directory', () => {
    // A page at flicky/a/b/c/index.html should reference ../../../_pagefind/
    // (3 levels to reach flicky/), NOT ../../../../_pagefind/ (which would be root)
    const html = renderPage({
      ...baseOpts,
      fullOutputPath: 'flicky/a/b/c/index.html',
    });
    expect(html).toContain('href="../../../_pagefind/pagefind-ui.css"');
    expect(html).not.toContain('../../../../_pagefind/');
  });
});

describe('landing page has no search references', () => {
  const manifest: SiteManifest = {
    sites: [
      { name: 'flicky', source: '~/.claude', prefix: 'flicky', fileCount: 100, lastBuilt: '2026-04-17T00:00:00Z' },
      { name: 'slipbox', source: '~/slipbox/.claude', prefix: 'slipbox', fileCount: 45, lastBuilt: '2026-04-17T00:00:00Z' },
    ],
  };

  test('landing page does not include pagefind JS', () => {
    const html = renderLandingPage(manifest);
    expect(html).not.toContain('pagefind-ui.js');
  });

  test('landing page does not include pagefind CSS', () => {
    const html = renderLandingPage(manifest);
    expect(html).not.toContain('pagefind-ui.css');
  });

  test('landing page does not include search element', () => {
    const html = renderLandingPage(manifest);
    expect(html).not.toContain('id="search"');
  });

  test('landing page still renders site cards', () => {
    const html = renderLandingPage(manifest);
    expect(html).toContain('flicky');
    expect(html).toContain('slipbox');
    expect(html).toContain('site-card');
  });
});
