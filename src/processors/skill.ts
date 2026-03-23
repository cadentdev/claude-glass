/** Skill processor — SKILL.md with effort/model badges in metadata card */

import { readFileSync } from 'fs';
import { extractFrontmatter, marked, sanitizeHtml, sanitizeOptions, escapeHtml } from './markdown';
import { effortBadge, modelBadge, tagBadge } from './badges';
import type { ScanEntry, ProcessedFile } from '../types';

export function processSkill(entry: ScanEntry): ProcessedFile {
  const raw = readFileSync(entry.absolutePath, 'utf-8');
  const { frontmatter, body } = extractFrontmatter(raw);

  const name = (frontmatter.name as string) || 'Unnamed Skill';
  const description = (frontmatter.description as string) || '';
  const effort = (frontmatter.effort as string) || '';
  const model = (frontmatter.model as string) || '';
  const userInvocable = frontmatter.user_invocable === 'true';

  // Build skill metadata card
  const badges: string[] = [];
  if (effort) badges.push(effortBadge(effort));
  if (model) badges.push(modelBadge(model));
  if (userInvocable) badges.push(tagBadge('user-invocable'));

  const badgeHtml = badges.length > 0 ? `<div class="badge-row">${badges.join(' ')}</div>` : '';

  const metadataHtml = `<div class="metadata-card skill-card">
  <h3 class="skill-name">${escapeHtml(name)}</h3>
  ${badgeHtml}
  <p class="skill-description">${escapeHtml(description)}</p>
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
