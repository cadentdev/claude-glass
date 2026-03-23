/** JSON processor — collapsible tree for settings.json and other JSON files */

import { readFileSync } from 'fs';
import { escapeHtml } from './markdown';
import type { ScanEntry, ProcessedFile } from '../types';

export function processJson(entry: ScanEntry): ProcessedFile {
  const raw = readFileSync(entry.absolutePath, 'utf-8');
  const fileName = entry.relativePath.split('/').pop() || '';
  const title = fileName.replace('.json', '');

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    // If JSON is invalid, render as raw code block
    return {
      entry,
      html: `<pre><code>${escapeHtml(raw)}</code></pre>`,
      title,
      metadata: {},
      outputPath: entry.relativePath.replace(/\.json$/, '/index.html'),
    };
  }

  const html = renderJsonTree(parsed, title, 0);

  return {
    entry,
    html,
    title,
    metadata: {},
    outputPath: entry.relativePath.replace(/\.json$/, '/index.html'),
  };
}

function renderJsonTree(value: unknown, key: string, depth: number): string {
  if (value === null || value === undefined) {
    return `<span class="json-null">null</span>`;
  }

  if (typeof value === 'string') {
    return `<span class="json-string">"${escapeHtml(value)}"</span>`;
  }

  if (typeof value === 'number' || typeof value === 'boolean') {
    return `<span class="json-primitive">${String(value)}</span>`;
  }

  if (Array.isArray(value)) {
    if (value.length === 0) return `<span class="json-bracket">[]</span>`;

    // Short arrays of primitives: render inline
    if (value.length <= 5 && value.every(v => typeof v !== 'object')) {
      const items = value.map(v => typeof v === 'string' ? `"${escapeHtml(v)}"` : String(v));
      return `<span class="json-bracket">[</span>${items.join(', ')}<span class="json-bracket">]</span>`;
    }

    const items = value.map((v, i) => `<li>${renderJsonTree(v, String(i), depth + 1)}</li>`).join('\n');
    return `<details${depth < 1 ? ' open' : ''}>
  <summary class="json-key">${escapeHtml(key)} <span class="json-count">[${value.length}]</span></summary>
  <ul class="json-array">${items}</ul>
</details>`;
  }

  if (typeof value === 'object') {
    const entries = Object.entries(value as Record<string, unknown>);
    if (entries.length === 0) return `<span class="json-bracket">{}</span>`;

    const items = entries.map(([k, v]) => {
      const rendered = renderJsonTree(v, k, depth + 1);
      // If it's a collapsible (details), it already has the key as summary
      if (typeof v === 'object' && v !== null && (Array.isArray(v) ? v.length > 5 || v.some(i => typeof i === 'object') : Object.keys(v).length > 0)) {
        return `<li>${rendered}</li>`;
      }
      return `<li><span class="json-key">${escapeHtml(k)}:</span> ${rendered}</li>`;
    }).join('\n');

    if (depth === 0) {
      // Top level: render as open sections
      return `<div class="json-tree"><ul class="json-object">${items}</ul></div>`;
    }

    return `<details${depth < 2 ? ' open' : ''}>
  <summary class="json-key">${escapeHtml(key)} <span class="json-count">{${entries.length}}</span></summary>
  <ul class="json-object">${items}</ul>
</details>`;
  }

  return escapeHtml(String(value));
}
