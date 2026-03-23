/** Agents index — card grid with persona name, title, model, color */

import { escapeHtml } from '../processors/markdown';
import { modelBadge } from '../processors/badges';
import type { ProcessedFile } from '../types';

export function generateAgentsIndex(files: ProcessedFile[]): ProcessedFile | null {
  const agents = files.filter(f => f.entry.type === 'agent');
  if (agents.length === 0) return null;

  const cards = agents
    .sort((a, b) => (a.title || '').localeCompare(b.title || ''))
    .map(agent => {
      const m = agent.metadata;
      const name = escapeHtml(agent.title || 'Unnamed');
      const description = escapeHtml((m.description as string) || '');
      const model = m.model as string || '';
      const color = m.color as string || '';
      const personaName = escapeHtml((m['persona.name'] as string) || '');
      const personaTitle = escapeHtml((m['persona.title'] as string) || '');
      const href = '/' + agent.outputPath;

      const colorSwatch = color ? `<span class="color-swatch" style="background: ${escapeHtml(color)}"></span>` : '';
      const modelHtml = modelBadge(model);

      return `<a href="${href}" class="agent-index-card">
  <div class="agent-card-header">
    ${colorSwatch}
    <strong>${name}</strong>
    ${modelHtml}
  </div>
  ${personaName ? `<div class="agent-card-persona">${personaName}${personaTitle ? ` — ${personaTitle}` : ''}</div>` : ''}
  ${description ? `<div class="agent-card-desc">${description.slice(0, 100)}</div>` : ''}
</a>`;
    })
    .join('\n');

  const html = `<p>${agents.length} agents found.</p>
<div class="agent-grid">
${cards}
</div>`;

  return {
    entry: { absolutePath: '', relativePath: '_indexes/agents', type: 'markdown', size: 0, mtime: new Date() },
    html,
    title: 'Agents',
    metadata: {},
    outputPath: 'agents-index/index.html',
  };
}
