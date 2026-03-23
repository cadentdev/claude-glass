/** Skills index — table of all skills with name, description, effort, model */

import { escapeHtml } from '../processors/markdown';
import { effortBadge, modelBadge } from '../processors/badges';
import type { ProcessedFile } from '../types';

export function generateSkillsIndex(files: ProcessedFile[]): ProcessedFile | null {
  const skills = files.filter(f => f.entry.type === 'skill');
  if (skills.length === 0) return null;

  // Count workflows per skill
  const workflows = files.filter(f => f.entry.type === 'workflow');
  const workflowCounts: Record<string, number> = {};
  for (const wf of workflows) {
    const parts = wf.entry.relativePath.split('/');
    const wfIdx = parts.indexOf('Workflows');
    if (wfIdx > 0) {
      const parentPath = parts.slice(0, wfIdx).join('/');
      workflowCounts[parentPath] = (workflowCounts[parentPath] || 0) + 1;
    }
  }

  const rows = skills
    .sort((a, b) => (a.title || '').localeCompare(b.title || ''))
    .map(skill => {
      const m = skill.metadata;
      const name = escapeHtml(skill.title || 'Unnamed');
      const description = escapeHtml((m.description as string || '').slice(0, 100));
      const effort = m.effort as string || '';
      const model = m.model as string || '';
      const href = '/' + skill.outputPath;

      // Find workflow count
      const skillDir = skill.entry.relativePath.replace(/\/SKILL\.md$/, '');
      const wfCount = workflowCounts[skillDir] || 0;

      const effortHtml = effortBadge(effort);
      const modelHtml = modelBadge(model);

      return `<tr>
  <td><a href="${href}">${name}</a></td>
  <td>${description}</td>
  <td>${effortHtml}</td>
  <td>${modelHtml}</td>
  <td>${wfCount || ''}</td>
</tr>`;
    })
    .join('\n');

  const html = `<p>${skills.length} skills found.</p>
<table class="index-table">
<thead>
  <tr><th>Name</th><th>Description</th><th>Effort</th><th>Model</th><th>Workflows</th></tr>
</thead>
<tbody>
${rows}
</tbody>
</table>`;

  return {
    entry: { absolutePath: '', relativePath: '_indexes/skills', type: 'markdown', size: 0, mtime: new Date() },
    html,
    title: 'Skills',
    metadata: {},
    outputPath: 'skills-index/index.html',
  };
}
