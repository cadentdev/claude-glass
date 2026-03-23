/** Hook processor — JSDoc extraction + syntax-highlighted TypeScript */

import { readFileSync } from 'fs';
import hljs from 'highlight.js/lib/core';
import { escapeHtml } from './markdown';
import type { ScanEntry, ProcessedFile } from '../types';

interface HookMeta {
  name: string;
  purpose: string;
  trigger: string;
  version: string;
}

function extractJSDoc(source: string): HookMeta {
  const name = source.match(/\* (.+\.hook\.ts)/)?.[1] || '';
  const purpose = source.match(/\*\s*(?:PURPOSE:\s*)?(.*?)(?:\n\s*\*\s*\n|\n\s*\*\/)/s)?.[1]?.trim() || '';
  const trigger = source.match(/TRIGGER:\s*(.+)/)?.[1]?.trim() || '';
  const version = source.match(/v(\d+\.\d+\.\d+)/)?.[1] || '';

  return { name, purpose, trigger, version };
}

export function processHook(entry: ScanEntry): ProcessedFile {
  const source = readFileSync(entry.absolutePath, 'utf-8');
  const meta = extractJSDoc(source);

  const fileName = entry.relativePath.split('/').pop() || '';
  const title = fileName.replace('.hook.ts', '');

  // Build metadata card from JSDoc
  const rows: string[] = [];
  if (meta.trigger) rows.push(`<tr><td class="meta-key">Trigger</td><td class="meta-val"><code>${escapeHtml(meta.trigger)}</code></td></tr>`);
  if (meta.purpose) rows.push(`<tr><td class="meta-key">Purpose</td><td class="meta-val">${escapeHtml(meta.purpose)}</td></tr>`);
  if (meta.version) rows.push(`<tr><td class="meta-key">Version</td><td class="meta-val">${escapeHtml(meta.version)}</td></tr>`);

  const metadataHtml = rows.length > 0
    ? `<div class="metadata-card hook-card"><table>${rows.join('\n')}</table></div>\n`
    : '';

  // Syntax-highlight the full source
  const highlighted = hljs.highlight(source, { language: 'typescript' }).value;
  const codeHtml = `<pre class="hljs"><code class="hljs language-typescript">${highlighted}</code></pre>`;

  const outputPath = entry.relativePath.replace(/\.ts$/, '/index.html');

  return {
    entry,
    html: metadataHtml + codeHtml,
    title,
    metadata: { trigger: meta.trigger, purpose: meta.purpose, version: meta.version },
    outputPath,
  };
}
