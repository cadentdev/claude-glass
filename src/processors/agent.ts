/** Agent processor — persona cards with name, title, model, color */

import { readFileSync } from 'fs';
import { extractFrontmatter, marked, sanitizeHtml, sanitizeOptions, escapeHtml, sanitizeColor } from './markdown';
import { modelBadge } from './badges';
import type { ScanEntry, ProcessedFile } from '../types';

export function processAgent(entry: ScanEntry): ProcessedFile {
  const raw = readFileSync(entry.absolutePath, 'utf-8');
  const { frontmatter, body } = extractFrontmatter(raw);

  const name = (frontmatter.name as string) || 'Unnamed Agent';
  const description = (frontmatter.description as string) || '';
  const model = (frontmatter.model as string) || '';
  const color = (frontmatter.color as string) || '';
  const personaName = (frontmatter['persona.name'] as string) || '';
  const personaTitle = (frontmatter['persona.title'] as string) || '';

  // Build persona card — validate color to prevent CSS injection
  const safeColor = sanitizeColor(color);
  const colorSwatch = safeColor ? `<span class="color-swatch" style="background-color: ${safeColor}"></span>` : '';

  const details: string[] = [];
  if (personaName) details.push(`<strong>${escapeHtml(personaName)}</strong>`);
  if (personaTitle) details.push(`<em>${escapeHtml(personaTitle)}</em>`);
  if (model) details.push(modelBadge(model));

  const metadataHtml = `<div class="metadata-card agent-card">
  <div class="agent-header">
    ${colorSwatch}
    <div class="agent-info">
      <h3>${escapeHtml(name)}</h3>
      ${details.length > 0 ? `<div class="agent-details">${details.join(' &middot; ')}</div>` : ''}
    </div>
  </div>
  ${description ? `<p class="agent-description">${escapeHtml(description)}</p>` : ''}
</div>\n`;

  const rawHtml = marked.parse(body) as string;
  const html = sanitizeHtml(rawHtml, sanitizeOptions);

  const outputPath = entry.relativePath.replace(/\.md$/, '/index.html');

  return {
    entry,
    html: metadataHtml + html,
    title: name,
    metadata: frontmatter,
    outputPath,
  };
}
