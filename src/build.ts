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
import { renderLandingPage } from './templates/landing';
import { readManifest, writeManifest, updateManifest, deriveName, nameToPrefix } from './manifest';
import { checkLinks } from './link-checker';
import { rewriteInternalLinks, buildPathMap } from './link-rewriter';
import { runPagefindIndex } from './search';
import { readBuildCache, writeBuildCache, diffEntries } from './build-cache';
import { mkdirSync, writeFileSync, copyFileSync, existsSync, unlinkSync } from 'fs';
import { join, dirname } from 'path';
import type { BuildConfig, ProcessedFile, ScanEntry } from './types';

export async function build(config: BuildConfig): Promise<void> {
  const startTime = Date.now();

  // Resolve project name and prefix
  const name = config.name || deriveName(config.inputDir);
  const prefix = nameToPrefix(name);
  const prefixDir = join(config.outputDir, prefix);

  console.log(`Building "${name}" (/${prefix}/) from ${config.inputDir}...`);

  // Read existing manifest (preserves other sites)
  mkdirSync(config.outputDir, { recursive: true });
  const manifest = readManifest(config.outputDir);

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

  // Incremental check: compare against build cache
  if (config.incremental) {
    const cache = readBuildCache(config.outputDir, prefix);
    if (cache) {
      const diff = diffEntries(entries, cache);
      const hasChanges = diff.changed.length > 0 || diff.added.length > 0 || diff.removed.length > 0;

      if (!hasChanges) {
        const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
        console.log(`No changes detected (${entries.length} files unchanged). Skipping build. (${elapsed}s)`);
        return;
      }

      console.log(`Incremental: ${diff.changed.length} changed, ${diff.added.length} added, ${diff.removed.length} removed, ${diff.unchanged.length} unchanged`);

      // Clean up removed files from output
      for (const removedPath of diff.removed) {
        const outputFile = join(prefixDir, removedPath.replace(/\.md$/, '/index.html').replace(/\.json$/, '.html'));
        if (existsSync(outputFile)) {
          try { unlinkSync(outputFile); } catch { /* ignore */ }
        }
      }
    } else {
      console.log('Incremental: no cache found, doing full build');
    }
  }

  // Phase 2: Process (skip files over 10MB to prevent OOM)
  const MAX_FILE_SIZE = 10 * 1024 * 1024;
  const processed: ProcessedFile[] = [];
  for (const entry of entries) {
    try {
      if (entry.size > MAX_FILE_SIZE) {
        if (config.verbose) {
          console.error(`  Skip: ${entry.relativePath} (exceeds 10MB size limit)`);
        }
        continue;
      }
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

  // Phase 4a: Rewrite internal links
  const pathMap = buildPathMap(
    processed.map((f) => ({ relativePath: f.entry.relativePath, outputPath: f.outputPath }))
  );
  const baseUrl = '/' + prefix;
  for (const file of processed) {
    file.html = rewriteInternalLinks(file.html, file.entry.relativePath, pathMap, baseUrl);
  }

  // Phase 4: Render and write into prefix subdirectory
  mkdirSync(prefixDir, { recursive: true });

  for (const file of processed) {
    // Output path within the prefix subdirectory
    const prefixedOutputPath = join(prefix, file.outputPath);
    // CSS depth is relative to the file within the prefix dir
    const depthInPrefix = file.outputPath.split('/').length - 1;
    const cssPath = '../'.repeat(depthInPrefix) + 'style.css';
    const navHtml = renderNavHtml(navTree, file.entry.relativePath, baseUrl);
    const breadcrumbs = buildBreadcrumbs(file.entry.relativePath, baseUrl, name);

    const html = renderPage({
      title: file.title,
      content: file.html,
      navHtml,
      breadcrumbs,
      cssPath,
      fullOutputPath: prefixedOutputPath,
      siteName: name,
      sitePrefix: prefix,
    });

    const outPath = join(config.outputDir, prefixedOutputPath);
    mkdirSync(dirname(outPath), { recursive: true });
    writeFileSync(outPath, html);

    if (config.verbose) {
      console.log(`  Write: ${prefixedOutputPath}`);
    }
  }

  // Write site-level landing page (CLAUDE.md or first file) as prefix/index.html
  const siteLanding = processed.find((f) => f.entry.relativePath === 'CLAUDE.md')
    || processed.find((f) => f.entry.relativePath === 'README.md')
    || processed[0];

  if (siteLanding) {
    const navHtml = renderNavHtml(navTree, '', baseUrl);
    const indexHtml = renderPage({
      title: name,
      content: siteLanding.html,
      navHtml,
      breadcrumbs: `<a href="/index.html" class="crumb">Home</a> <span class="crumb-sep">/</span> <span class="crumb-current">${escapeHtml(name)}</span>`,
      cssPath: 'style.css',
      fullOutputPath: prefix + '/index.html',
      siteName: name,
      sitePrefix: prefix,
    });
    writeFileSync(join(prefixDir, 'index.html'), indexHtml);
  }

  // Copy CSS into prefix subdirectory
  const cssSource = join(import.meta.dir, '..', 'assets', 'style.css');
  if (existsSync(cssSource)) {
    copyFileSync(cssSource, join(prefixDir, 'style.css'));
    // Also copy to root for landing page
    copyFileSync(cssSource, join(config.outputDir, 'style.css'));
  }

  // Update manifest with this site's entry (use basename-relative path, not absolute)
  const sourceLabel = config.inputDir.replace(require('os').homedir(), '~');
  const updatedManifest = updateManifest(manifest, {
    name,
    source: sourceLabel,
    prefix,
    fileCount: processed.length,
  });
  writeManifest(config.outputDir, updatedManifest);

  // Generate root landing page from manifest
  const landingHtml = renderLandingPage(updatedManifest);
  writeFileSync(join(config.outputDir, 'index.html'), landingHtml);

  // Write build cache for next incremental run
  writeBuildCache(config.outputDir, prefix, entries);

  // Phase 6: Generate search index (unless --no-search) — before link check so pagefind assets exist
  if (!config.noSearch) {
    console.log('\nGenerating search index...');
    runPagefindIndex(config.outputDir, config.verbose);
  }

  // Phase 7: Check for broken links (only within this site's prefix dir)
  if (!config.noLinkCheck) {
    const { total, broken } = checkLinks(prefixDir);
    if (broken.length > 0) {
      console.log(`\nLinks: ${total} total, ${broken.length} broken`);
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
  }

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log(`Built ${processed.length} pages in ${elapsed}s -> ${prefixDir}`);
  console.log(`Sites in manifest: ${updatedManifest.sites.map(s => s.name).join(', ')}`);
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
      return null;
    case 'jsonl':
      return null;
    default:
      return null;
  }
}

function escapeHtml(str: string): string {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}
