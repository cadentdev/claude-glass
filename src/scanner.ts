/** Filesystem scanner — walks .claude directory with exclusion filtering */

import { readdirSync, statSync } from 'fs';
import { join, relative, basename } from 'path';
import { DEFAULT_EXCLUSIONS, isExcluded } from './exclusions';
import type { ScanEntry, ContentType } from './types';

export function scan(inputDir: string, extraExclusions: string[] = []): ScanEntry[] {
  const exclusions = [...DEFAULT_EXCLUSIONS, ...extraExclusions];
  const entries: ScanEntry[] = [];

  function walk(dir: string) {
    let items: string[];
    try {
      items = readdirSync(dir);
    } catch {
      return;
    }

    for (const item of items) {
      const absolutePath = join(dir, item);
      const relativePath = relative(inputDir, absolutePath);

      if (isExcluded(relativePath, exclusions)) continue;

      let stat;
      try {
        stat = statSync(absolutePath);
      } catch {
        continue;
      }

      if (stat.isDirectory()) {
        walk(absolutePath);
      } else if (stat.isFile()) {
        const type = classifyFile(relativePath, item);
        if (type !== 'other') {
          entries.push({
            absolutePath,
            relativePath,
            type,
            size: stat.size,
            mtime: stat.mtime,
          });
        }
      }
    }
  }

  walk(inputDir);
  return entries;
}

function classifyFile(relativePath: string, filename: string): ContentType {
  // SKILL.md files
  if (filename === 'SKILL.md') return 'skill';

  // Agent definitions
  if (relativePath.startsWith('agents/') && filename.endsWith('.md')) return 'agent';

  // Workflow files
  if (relativePath.includes('/Workflows/') && filename.endsWith('.md')) return 'workflow';

  // Hook files
  if (filename.endsWith('.hook.ts')) return 'hook';

  // JSON files
  if (filename === 'settings.json' || filename.endsWith('.json')) return 'json';

  // JSONL files
  if (filename.endsWith('.jsonl')) return 'jsonl';

  // Markdown files
  if (filename.endsWith('.md')) return 'markdown';

  // TypeScript files (non-hook)
  if (filename.endsWith('.ts')) return 'typescript';

  return 'other';
}
