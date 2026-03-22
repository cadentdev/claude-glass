/** Navigation tree builder — creates sidebar hierarchy from processed files */

import type { ProcessedFile, NavNode } from './types';

export function buildNavTree(files: ProcessedFile[]): NavNode {
  const root: NavNode = {
    name: 'Home',
    path: '',
    outputPath: 'index.html',
    children: [],
    isDirectory: true,
  };

  for (const file of files) {
    const parts = file.entry.relativePath.split('/');
    let current = root;

    // Walk/create directory nodes
    for (let i = 0; i < parts.length - 1; i++) {
      const dirName = parts[i];
      const dirPath = parts.slice(0, i + 1).join('/');
      let child = current.children.find((c) => c.name === dirName && c.isDirectory);
      if (!child) {
        child = {
          name: dirName,
          path: dirPath,
          children: [],
          isDirectory: true,
        };
        current.children.push(child);
      }
      current = child;
    }

    // Add file node
    const fileName = parts[parts.length - 1];
    current.children.push({
      name: fileName,
      path: file.entry.relativePath,
      outputPath: file.outputPath,
      children: [],
      isDirectory: false,
      title: file.title,
      metadata: file.metadata,
    });
  }

  // Sort: directories first, then alphabetically
  sortTree(root);

  return root;
}

function sortTree(node: NavNode) {
  node.children.sort((a, b) => {
    if (a.isDirectory !== b.isDirectory) return a.isDirectory ? -1 : 1;
    return a.name.localeCompare(b.name);
  });
  for (const child of node.children) {
    if (child.isDirectory) sortTree(child);
  }
}

export function renderNavHtml(tree: NavNode, currentPath: string, baseUrl: string = ''): string {
  return renderNode(tree, currentPath, baseUrl, 0);
}

function renderNode(node: NavNode, currentPath: string, baseUrl: string, depth: number): string {
  if (depth === 0) {
    // Root level — render children directly
    const childrenHtml = node.children
      .map((c) => renderNode(c, currentPath, baseUrl, depth + 1))
      .join('\n');
    return `<nav class="sidebar-nav">\n<ul>\n${childrenHtml}\n</ul>\n</nav>`;
  }

  if (node.isDirectory) {
    const isExpanded = currentPath.startsWith(node.path + '/') || currentPath === node.path;
    const childrenHtml = node.children
      .map((c) => renderNode(c, currentPath, baseUrl, depth + 1))
      .join('\n');
    const expandClass = isExpanded ? 'expanded' : 'collapsed';
    const label = node.name;
    const count = countFiles(node);
    return `<li class="nav-dir ${expandClass}">
  <details${isExpanded ? ' open' : ''}>
    <summary>${escapeHtml(label)} <span class="nav-count">${count}</span></summary>
    <ul>${childrenHtml}</ul>
  </details>
</li>`;
  }

  // File node
  const href = baseUrl + '/' + (node.outputPath || node.path);
  const isActive = node.path === currentPath;
  const displayName = node.title || node.name.replace(/\.(md|ts|json)$/, '');
  return `<li class="nav-file${isActive ? ' active' : ''}"><a href="${href}">${escapeHtml(displayName)}</a></li>`;
}

function countFiles(node: NavNode): number {
  if (!node.isDirectory) return 1;
  return node.children.reduce((sum, c) => sum + countFiles(c), 0);
}

export function buildBreadcrumbs(relativePath: string, baseUrl: string = ''): string {
  const parts = relativePath.split('/');
  const crumbs = [{ name: 'Home', href: baseUrl + '/index.html' }];

  for (let i = 0; i < parts.length; i++) {
    const href = baseUrl + '/' + parts.slice(0, i + 1).join('/') + '/index.html';
    crumbs.push({ name: parts[i].replace(/\.(md|ts|json)$/, ''), href });
  }

  return crumbs
    .map((c, i) => i === crumbs.length - 1
      ? `<span class="crumb-current">${escapeHtml(c.name)}</span>`
      : `<a href="${c.href}" class="crumb">${escapeHtml(c.name)}</a>`)
    .join(' <span class="crumb-sep">/</span> ');
}

function escapeHtml(str: string): string {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
