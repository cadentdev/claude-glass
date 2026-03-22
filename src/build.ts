/** Build orchestrator — scan -> process -> render -> write */

import { scan } from './scanner';
import { processMarkdown } from './processors/markdown';
import { buildNavTree, renderNavHtml, buildBreadcrumbs } from './nav';
import { renderPage } from './templates/layout';
import { mkdirSync, writeFileSync, copyFileSync, existsSync } from 'fs';
import { join, dirname, relative } from 'path';
import type { BuildConfig, ProcessedFile, ScanEntry } from './types';

export async function build(config: BuildConfig): Promise<void> {
  const startTime = Date.now();
  console.log(`Scanning ${config.inputDir}...`);

  // Phase 1: Scan
  const extraExclusions = [...config.exclude];
  if (config.noMemory) {
    extraExclusions.push('MEMORY/**');
  }
  const entries = scan(config.inputDir, extraExclusions);
  console.log(`Found ${entries.length} files to process`);

  if (entries.length === 0) {
    console.error('No files found. Is this a .claude directory?');
    return;
  }

  // Phase 2: Process
  const processed: ProcessedFile[] = [];
  for (const entry of entries) {
    try {
      const file = processFile(entry);
      if (file) processed.push(file);
    } catch (err) {
      if (config.verbose) {
        console.error(`  Skip: ${entry.relativePath} (${(err as Error).message})`);
      }
    }
  }

  console.log(`Processed ${processed.length} files`);

  // Phase 3: Build nav tree
  const navTree = buildNavTree(processed);

  // Phase 4: Render and write
  mkdirSync(config.outputDir, { recursive: true });

  // Compute CSS depth for relative path
  for (const file of processed) {
    const depth = file.outputPath.split('/').length - 1;
    const cssPath = '../'.repeat(depth) + 'style.css';
    const navHtml = renderNavHtml(navTree, file.entry.relativePath);
    const breadcrumbs = buildBreadcrumbs(file.entry.relativePath);

    const html = renderPage({
      title: file.title,
      content: file.html,
      navHtml,
      breadcrumbs,
      cssPath,
    });

    const outPath = join(config.outputDir, file.outputPath);
    mkdirSync(dirname(outPath), { recursive: true });
    writeFileSync(outPath, html);

    if (config.verbose) {
      console.log(`  Write: ${file.outputPath}`);
    }
  }

  // Write landing page (CLAUDE.md or first file)
  const landing = processed.find((f) => f.entry.relativePath === 'CLAUDE.md')
    || processed.find((f) => f.entry.relativePath === 'README.md')
    || processed[0];

  if (landing) {
    const navHtml = renderNavHtml(navTree, '');
    const indexHtml = renderPage({
      title: 'Home',
      content: landing.html,
      navHtml,
      breadcrumbs: '<span class="crumb-current">Home</span>',
      cssPath: 'style.css',
    });
    writeFileSync(join(config.outputDir, 'index.html'), indexHtml);
  }

  // Copy CSS
  const cssSource = join(import.meta.dir, '..', 'assets', 'style.css');
  if (existsSync(cssSource)) {
    copyFileSync(cssSource, join(config.outputDir, 'style.css'));
  }

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log(`Built ${processed.length} pages in ${elapsed}s -> ${config.outputDir}`);
}

function processFile(entry: ScanEntry): ProcessedFile | null {
  switch (entry.type) {
    case 'markdown':
    case 'skill':
    case 'agent':
    case 'workflow':
      return processMarkdown(entry);

    case 'json':
      // Phase 0.5: JSON processor. For now, skip.
      return null;

    case 'hook':
    case 'typescript':
      // Phase 0.5: Hook/TS processor. For now, skip.
      return null;

    case 'jsonl':
      // Phase 0.5: JSONL processor. For now, skip.
      return null;

    default:
      return null;
  }
}
