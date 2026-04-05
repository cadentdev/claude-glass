/** Tests for nav.ts — tree building, HTML rendering, and breadcrumbs */

import { describe, test, expect } from 'bun:test';
import { buildNavTree, renderNavHtml, buildBreadcrumbs } from '../nav';
import type { ProcessedFile } from '../types';

function makeFile(relativePath: string, title?: string): ProcessedFile {
  return {
    entry: {
      absolutePath: '/tmp/' + relativePath,
      relativePath,
      type: 'markdown',
      size: 100,
      mtime: new Date(),
    },
    html: '<p>content</p>',
    title: title || relativePath.split('/').pop()!.replace(/\.md$/, ''),
    metadata: {},
    outputPath: relativePath.replace(/\.md$/, '/index.html'),
  };
}

describe('buildNavTree', () => {
  test('empty files list returns root with no children', () => {
    const tree = buildNavTree([]);
    expect(tree.name).toBe('Home');
    expect(tree.isDirectory).toBe(true);
    expect(tree.children).toHaveLength(0);
  });

  test('single file at root level', () => {
    const tree = buildNavTree([makeFile('README.md')]);
    expect(tree.children).toHaveLength(1);
    expect(tree.children[0].name).toBe('README.md');
    expect(tree.children[0].isDirectory).toBe(false);
    expect(tree.children[0].outputPath).toBe('README/index.html');
  });

  test('nested files create directory grouping', () => {
    const files = [
      makeFile('skills/Foo/SKILL.md', 'Foo Skill'),
      makeFile('skills/Bar/SKILL.md', 'Bar Skill'),
    ];
    const tree = buildNavTree(files);

    // Root should have one directory child: skills
    expect(tree.children).toHaveLength(1);
    const skills = tree.children[0];
    expect(skills.name).toBe('skills');
    expect(skills.isDirectory).toBe(true);

    // skills should have two directory children: Bar and Foo (sorted alpha)
    expect(skills.children).toHaveLength(2);
    expect(skills.children[0].name).toBe('Bar');
    expect(skills.children[1].name).toBe('Foo');
  });

  test('directories sorted before files, then alphabetical', () => {
    const files = [
      makeFile('zebra.md'),
      makeFile('docs/intro.md'),
      makeFile('alpha.md'),
      makeFile('agents/helper.md'),
    ];
    const tree = buildNavTree(files);

    // Directories first: agents, docs; then files: alpha.md, zebra.md
    expect(tree.children[0].name).toBe('agents');
    expect(tree.children[0].isDirectory).toBe(true);
    expect(tree.children[1].name).toBe('docs');
    expect(tree.children[1].isDirectory).toBe(true);
    expect(tree.children[2].name).toBe('alpha.md');
    expect(tree.children[2].isDirectory).toBe(false);
    expect(tree.children[3].name).toBe('zebra.md');
    expect(tree.children[3].isDirectory).toBe(false);
  });

  test('file nodes carry title and metadata', () => {
    const file = makeFile('README.md', 'Project Readme');
    file.metadata = { tags: ['docs'] };
    const tree = buildNavTree([file]);
    expect(tree.children[0].title).toBe('Project Readme');
    expect(tree.children[0].metadata).toEqual({ tags: ['docs'] });
  });

  test('deep nesting creates intermediate directories', () => {
    const tree = buildNavTree([makeFile('a/b/c/deep.md')]);
    expect(tree.children[0].name).toBe('a');
    expect(tree.children[0].children[0].name).toBe('b');
    expect(tree.children[0].children[0].children[0].name).toBe('c');
    expect(tree.children[0].children[0].children[0].children[0].name).toBe('deep.md');
  });
});

describe('renderNavHtml', () => {
  test('simple tree produces nav element with links', () => {
    const tree = buildNavTree([makeFile('README.md', 'Readme')]);
    const html = renderNavHtml(tree, '', '/site');
    expect(html).toContain('<nav class="sidebar-nav">');
    expect(html).toContain('</nav>');
    expect(html).toContain('href="/site/README/index.html"');
    expect(html).toContain('Readme');
  });

  test('active file gets active class', () => {
    const tree = buildNavTree([
      makeFile('one.md', 'One'),
      makeFile('two.md', 'Two'),
    ]);
    const html = renderNavHtml(tree, 'one.md', '');
    expect(html).toContain('class="nav-file active"');
    // two.md should not be active
    expect(html).toMatch(/nav-file"><a href="[^"]*two/);
  });

  test('expanded directory when current path is inside it', () => {
    const tree = buildNavTree([makeFile('docs/guide.md', 'Guide')]);
    const html = renderNavHtml(tree, 'docs/guide.md', '');
    expect(html).toContain('expanded');
    expect(html).toContain('<details open');
  });

  test('collapsed directory when current path is outside it', () => {
    const tree = buildNavTree([
      makeFile('docs/guide.md', 'Guide'),
      makeFile('other.md', 'Other'),
    ]);
    const html = renderNavHtml(tree, 'other.md', '');
    expect(html).toContain('collapsed');
    expect(html).not.toContain('<details open');
  });

  test('directory shows file count', () => {
    const tree = buildNavTree([
      makeFile('docs/a.md'),
      makeFile('docs/b.md'),
    ]);
    const html = renderNavHtml(tree, '', '');
    expect(html).toContain('<span class="nav-count">2</span>');
  });

  test('file display name strips .md extension', () => {
    const file = makeFile('notes.md');
    // Clear title so it falls back to name-based display
    const tree = buildNavTree([file]);
    tree.children[0].title = undefined;
    const html = renderNavHtml(tree, '', '');
    expect(html).toContain('>notes<');
  });

  test('baseUrl is prepended to links', () => {
    const tree = buildNavTree([makeFile('page.md', 'Page')]);
    const html = renderNavHtml(tree, '', '/mysite');
    expect(html).toContain('href="/mysite/page/index.html"');
  });
});

describe('buildBreadcrumbs', () => {
  test('simple path produces Home and path crumbs', () => {
    const html = buildBreadcrumbs('docs/guide.md', '');
    expect(html).toContain('Home');
    expect(html).toContain('docs');
    expect(html).toContain('guide');
    // Last crumb is current (span, not link)
    expect(html).toContain('<span class="crumb-current">guide</span>');
    // Home is a link
    expect(html).toContain('<a href="/index.html" class="crumb">Home</a>');
  });

  test('with siteName adds site crumb after Home', () => {
    const html = buildBreadcrumbs('page.md', '/mysite', 'My Site');
    expect(html).toContain('My Site');
    expect(html).toContain('href="/mysite/index.html"');
    // Order: Home, My Site, page
    const homePos = html.indexOf('Home');
    const sitePos = html.indexOf('My Site');
    const pagePos = html.indexOf('page');
    expect(homePos).toBeLessThan(sitePos);
    expect(sitePos).toBeLessThan(pagePos);
  });

  test('without siteName has no site crumb', () => {
    const html = buildBreadcrumbs('file.md', '');
    expect(html).not.toContain('undefined');
    // Should have Home and file only
    const crumbs = html.split('crumb-sep');
    expect(crumbs).toHaveLength(2); // one separator between Home and file
  });

  test('separators use crumb-sep class', () => {
    const html = buildBreadcrumbs('a/b.md', '');
    expect(html).toContain('<span class="crumb-sep">/</span>');
  });
});
