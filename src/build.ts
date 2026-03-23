/** Build orchestrator — scan -> process -> render -> write */

import { scan } from './scanner';
import { processMarkdown } from './processors/markdown';
import { processSkill } from './processors/skill';
import { processAgent } from './processors/agent';
import { processWorkflow } from './processors/workflow';
import { processHook } from './processors/hook';
import { processJson } from './processors/json-file';
import { generateSkillsIndex } from './indexes/skills-index';
import { generateHooksIndex } from './indexes/hooks-index';
import { generateAgentsIndex } from './indexes/agents-index';
import { generateDirectoryIndexes } from './indexes/directory-index';
import { buildNavTree, renderNavHtml, buildBreadcrumbs } from './nav';
import { renderPage } from './templates/layout';
import { checkLinks } from './link-checker';
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

  // Phase 2b: Generate index pages
  const indexes = [
    generateSkillsIndex(processed),
    generateHooksIndex(processed),
    generateAgentsIndex(processed),
  ].filter(Boolean) as ProcessedFile[];

  processed.push(...indexes);
  if (indexes.length > 0) {
    console.log(`Generated ${indexes.length} index pages`);
  }

  // Phase 3: Build nav tree
  const navTree = buildNavTree(processed);

  // Phase 3b: Generate directory index pages
  const dirIndexes = generateDirectoryIndexes(processed, navTree);
  if (dirIndexes.length > 0) {
    processed.push(...dirIndexes);
    console.log(`Generated ${dirIndexes.length} directory index pages`);
  }

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

  // Phase 6: Check for broken links
  const { total, broken } = checkLinks(config.outputDir);
  if (broken.length > 0) {
    console.log(`\nLinks: ${total} total, ${broken.length} broken`);
    // Show up to 20 unique broken targets
    const uniqueTargets = [...new Set(broken.map(b => b.href))].slice(0, 20);
    for (const href of uniqueTargets) {
      const count = broken.filter(b => b.href === href).length;
      console.log(`  ✗ ${href} (${count} page${count > 1 ? 's' : ''})`);
    }
    if (uniqueTargets.length < [...new Set(broken.map(b => b.href))].length) {
      console.log(`  ... and ${[...new Set(broken.map(b => b.href))].length - uniqueTargets.length} more`);
    }
  } else {
    console.log(`Links: ${total} checked, all OK`);
  }

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log(`Built ${processed.length} pages in ${elapsed}s -> ${config.outputDir}`);
}

function processFile(entry: ScanEntry): ProcessedFile | null {
  switch (entry.type) {
    case 'skill':
      return processSkill(entry);
    case 'agent':
      return processAgent(entry);
    case 'workflow':
      return processWorkflow(entry);
    case 'hook':
      return processHook(entry);
    case 'json':
      return processJson(entry);
    case 'markdown':
      return processMarkdown(entry);
    case 'typescript':
      // Non-hook TS files: skip for now
      return null;
    case 'jsonl':
      // JSONL: skip (summary stats deferred)
      return null;
    default:
      return null;
  }
}
