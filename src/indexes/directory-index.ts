/** Directory index generator — creates listing pages for directories that contain rendered files */

import { escapeHtml } from '../processors/markdown';
import type { ProcessedFile, NavNode } from '../types';

/**
 * Generate index pages for every directory that contains rendered files
 * but doesn't already have its own index page.
 */
export function generateDirectoryIndexes(files: ProcessedFile[], navTree: NavNode): ProcessedFile[] {
  const existingPaths = new Set(files.map(f => f.outputPath));
  const indexes: ProcessedFile[] = [];

  function walkTree(node: NavNode, pathPrefix: string) {
    if (!node.isDirectory || node.children.length === 0) return;

    const dirPath = pathPrefix ? pathPrefix : '';
    const indexPath = dirPath ? `${dirPath}/index.html` : 'index.html';

    // Skip if an index already exists for this directory
    if (existingPaths.has(indexPath)) {
      // Still walk children
      for (const child of node.children) {
        if (child.isDirectory) {
          walkTree(child, child.path);
        }
      }
      return;
    }

    // Skip root (handled by landing page)
    if (!dirPath) {
      for (const child of node.children) {
        if (child.isDirectory) {
          walkTree(child, child.path);
        }
      }
      return;
    }

    // Build directory listing
    const dirs: string[] = [];
    const fileItems: string[] = [];

    for (const child of node.children) {
      if (child.isDirectory) {
        const childCount = countFiles(child);
        const childHref = '/' + child.path + '/index.html';
        dirs.push(`<li class="dir-item"><a href="${childHref}">📁 ${escapeHtml(child.name)}</a> <span class="dir-count">(${childCount})</span></li>`);
      } else {
        const href = '/' + (child.outputPath || child.path);
        const displayName = child.title || child.name.replace(/\.(md|ts|json)$/, '');
        fileItems.push(`<li class="file-item"><a href="${href}">${escapeHtml(displayName)}</a></li>`);
      }
    }

    const sections: string[] = [];
    if (dirs.length > 0) {
      sections.push(`<h2>Directories</h2>\n<ul class="dir-listing">${dirs.join('\n')}</ul>`);
    }
    if (fileItems.length > 0) {
      sections.push(`<h2>Files</h2>\n<ul class="dir-listing">${fileItems.join('\n')}</ul>`);
    }

    const totalItems = dirs.length + fileItems.length;
    const html = `<p>${totalItems} item${totalItems !== 1 ? 's' : ''} in this directory.</p>\n${sections.join('\n')}`;

    indexes.push({
      entry: { absolutePath: '', relativePath: dirPath, type: 'markdown', size: 0, mtime: new Date() },
      html,
      title: node.name,
      metadata: {},
      outputPath: indexPath,
    });

    existingPaths.add(indexPath);

    // Recurse into children
    for (const child of node.children) {
      if (child.isDirectory) {
        walkTree(child, child.path);
      }
    }
  }

  walkTree(navTree, '');
  return indexes;
}

function countFiles(node: NavNode): number {
  if (!node.isDirectory) return 1;
  return node.children.reduce((sum, c) => sum + countFiles(c), 0);
}
