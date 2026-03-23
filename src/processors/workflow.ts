/** Workflow processor — breadcrumb to parent skill */

import { readFileSync } from 'fs';
import { marked, sanitizeHtml, sanitizeOptions, escapeHtml } from './markdown';
import type { ScanEntry, ProcessedFile } from '../types';

export function processWorkflow(entry: ScanEntry): ProcessedFile {
  const raw = readFileSync(entry.absolutePath, 'utf-8');

  // Workflows have no frontmatter — extract title from first heading
  const headingMatch = raw.match(/^#{1,3}\s+(.+)$/m);
  const title = headingMatch ? headingMatch[1].trim() : entry.relativePath.split('/').pop()?.replace('.md', '') || 'Workflow';

  // Find parent skill from path: skills/SkillName/Workflows/ThisFile.md
  const parts = entry.relativePath.split('/');
  const workflowIdx = parts.indexOf('Workflows');
  let parentInfo = '';
  if (workflowIdx > 0) {
    const parentPath = parts.slice(0, workflowIdx).join('/');
    const parentName = parts[workflowIdx - 1];
    const parentLink = '/' + parentPath + '/SKILL/index.html';
    parentInfo = `<div class="workflow-parent">
  <span class="parent-label">Workflow of</span>
  <a href="${parentLink}" class="parent-link">${escapeHtml(parentName)}</a>
</div>\n`;
  }

  const rawHtml = marked.parse(raw) as string;
  const html = sanitizeHtml(rawHtml, sanitizeOptions);

  const outputPath = entry.relativePath.replace(/\.md$/, '/index.html');

  return {
    entry,
    html: parentInfo + html,
    title,
    metadata: {},
    outputPath,
  };
}
