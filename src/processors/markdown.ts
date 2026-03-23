/** Generic markdown processor — renders .md to HTML with frontmatter extraction */

import { Marked } from 'marked';
import { markedHighlight } from 'marked-highlight';
import hljs from 'highlight.js/lib/core';
import typescript from 'highlight.js/lib/languages/typescript';
import json from 'highlight.js/lib/languages/json';
import yaml from 'highlight.js/lib/languages/yaml';
import bash from 'highlight.js/lib/languages/bash';
import sanitizeHtml from 'sanitize-html';
import { readFileSync } from 'fs';
import type { ScanEntry, ProcessedFile, Frontmatter } from '../types';

// Register only the languages we need
hljs.registerLanguage('typescript', typescript);
hljs.registerLanguage('ts', typescript);
hljs.registerLanguage('javascript', typescript);
hljs.registerLanguage('js', typescript);
hljs.registerLanguage('json', json);
hljs.registerLanguage('yaml', yaml);
hljs.registerLanguage('bash', bash);
hljs.registerLanguage('sh', bash);

const marked = new Marked(
  markedHighlight({
    langPrefix: 'hljs language-',
    highlight(code, lang) {
      if (lang && hljs.getLanguage(lang)) {
        return hljs.highlight(code, { language: lang }).value;
      }
      return code;
    },
  })
);

export function extractFrontmatter(content: string): { frontmatter: Frontmatter; body: string } {
  const match = content.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
  if (!match) return { frontmatter: {}, body: content };

  const fm: Frontmatter = {};
  for (const line of match[1].split('\n')) {
    const colonIdx = line.indexOf(':');
    if (colonIdx > 0) {
      const key = line.slice(0, colonIdx).trim();
      const value = line.slice(colonIdx + 1).trim();
      fm[key] = value;
    }
  }

  return { frontmatter: fm, body: match[2] };
}

function extractTitle(body: string, relativePath: string): string {
  // Try first heading
  const headingMatch = body.match(/^#{1,3}\s+(.+)$/m);
  if (headingMatch) return headingMatch[1].trim();

  // Fall back to filename
  const parts = relativePath.split('/');
  const filename = parts[parts.length - 1];
  return filename.replace(/\.(md|ts|json)$/, '');
}

export function processMarkdown(entry: ScanEntry): ProcessedFile {
  const raw = readFileSync(entry.absolutePath, 'utf-8');
  const { frontmatter, body } = extractFrontmatter(raw);

  const title = (frontmatter.name as string) || (frontmatter.title as string) || extractTitle(body, entry.relativePath);
  const rawHtml = marked.parse(body) as string;
  const html = sanitizeHtml(rawHtml, sanitizeOptions);

  // Build metadata card if frontmatter has entries
  let metadataHtml = '';
  const fmKeys = Object.keys(frontmatter);
  if (fmKeys.length > 0) {
    const rows = fmKeys
      .map((k) => `<tr><td class="meta-key">${escapeHtml(k)}</td><td class="meta-val">${escapeHtml(String(frontmatter[k]))}</td></tr>`)
      .join('\n');
    metadataHtml = `<div class="metadata-card"><table>${rows}</table></div>\n`;
  }

  const outputPath = entry.relativePath.replace(/\.md$/, '/index.html');

  return {
    entry,
    html: metadataHtml + html,
    title,
    metadata: frontmatter,
    outputPath,
  };
}

export { marked, sanitizeHtml };

export const sanitizeOptions = {
  allowedTags: sanitizeHtml.defaults.allowedTags.concat([
    'details', 'summary', 'img', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
    'pre', 'code', 'span', 'del', 'input', 'hr',
  ]),
  allowedAttributes: {
    ...sanitizeHtml.defaults.allowedAttributes,
    code: ['class'],
    span: ['class'],
    pre: ['class'],
    input: ['type', 'checked', 'disabled'],
    img: ['src', 'alt', 'title'],
    a: ['href', 'title', 'target', 'rel'],
  },
  allowedClasses: {
    code: ['hljs', 'language-*'],
    span: ['hljs-*'],
    pre: ['hljs'],
  },
  disallowedTagsMode: 'escape' as const,
};

/** Validate a CSS color value — only allow hex, rgb, hsl, and named colors */
const CSS_COLOR_RE = /^(#[0-9a-fA-F]{3,8}|rgb\(\s*\d{1,3}\s*,\s*\d{1,3}\s*,\s*\d{1,3}\s*\)|hsl\(\s*\d{1,3}\s*,\s*\d{1,3}%\s*,\s*\d{1,3}%\s*\)|[a-zA-Z]{1,20})$/;

export function sanitizeColor(color: string): string {
  if (!color) return '';
  const trimmed = color.trim();
  return CSS_COLOR_RE.test(trimmed) ? trimmed : '';
}

export function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
