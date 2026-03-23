/** Hooks index — table of all hooks with name, trigger, purpose */

import { escapeHtml } from '../processors/markdown';
import type { ProcessedFile } from '../types';

export function generateHooksIndex(files: ProcessedFile[]): ProcessedFile | null {
  const hooks = files.filter(f => f.entry.type === 'hook');
  if (hooks.length === 0) return null;

  const rows = hooks
    .sort((a, b) => (a.title || '').localeCompare(b.title || ''))
    .map(hook => {
      const m = hook.metadata;
      const name = escapeHtml(hook.title || 'Unnamed');
      const trigger = escapeHtml((m.trigger as string) || '');
      const purpose = escapeHtml((m.purpose as string || '').slice(0, 120));
      const href = '/' + hook.outputPath;

      return `<tr>
  <td><a href="${href}">${name}</a></td>
  <td><code>${trigger}</code></td>
  <td>${purpose}</td>
</tr>`;
    })
    .join('\n');

  const html = `<p>${hooks.length} hooks found.</p>
<table class="index-table">
<thead>
  <tr><th>Name</th><th>Trigger</th><th>Purpose</th></tr>
</thead>
<tbody>
${rows}
</tbody>
</table>`;

  return {
    entry: { absolutePath: '', relativePath: '_indexes/hooks', type: 'markdown', size: 0, mtime: new Date() },
    html,
    title: 'Hooks',
    metadata: {},
    outputPath: 'hooks-index/index.html',
  };
}
