/** Build manifest — tracks registered sites for incremental multi-site builds */

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join, basename, dirname, resolve } from 'path';
import { hostname } from 'os';
import type { SiteManifest, SiteEntry } from './types';

const MANIFEST_FILE = '.claude-glass.json';

export function readManifest(outputDir: string): SiteManifest {
  const path = join(outputDir, MANIFEST_FILE);
  if (!existsSync(path)) {
    return { sites: [] };
  }
  try {
    return JSON.parse(readFileSync(path, 'utf-8'));
  } catch {
    return { sites: [] };
  }
}

export function writeManifest(outputDir: string, manifest: SiteManifest): void {
  const path = join(outputDir, MANIFEST_FILE);
  writeFileSync(path, JSON.stringify(manifest, null, 2) + '\n');
}

export function updateManifest(
  manifest: SiteManifest,
  entry: Omit<SiteEntry, 'lastBuilt'> & { lastBuilt?: string }
): SiteManifest {
  const now = new Date().toISOString();
  const updated: SiteEntry = {
    ...entry,
    lastBuilt: now,
  };

  const existing = manifest.sites.findIndex((s) => s.prefix === entry.prefix);
  const sites = [...manifest.sites];
  if (existing >= 0) {
    sites[existing] = updated;
  } else {
    sites.push(updated);
  }

  return { sites };
}

/**
 * Derive a project name from the source directory path.
 *
 * - ~/.claude → machine hostname (e.g. "flicky")
 * - ~/Repos/foo/.claude → "foo" (grandparent when parent is .claude)
 * - ~/Repos/foo → "foo"
 * - /some/path/.claude → parent directory name
 */
export function deriveName(inputDir: string): string {
  const resolved = resolve(inputDir);
  const base = basename(resolved);

  // If the directory itself is .claude, use the parent
  if (base === '.claude') {
    const parent = basename(dirname(resolved));
    // If parent is home directory (e.g. "neil"), use hostname
    const homeBase = basename(require('os').homedir());
    if (parent === homeBase) {
      return hostname().toLowerCase().split('.')[0] || 'personal';
    }
    return parent;
  }

  return base;
}

/** Convert a name to a URL-safe prefix (lowercase, hyphens) */
export function nameToPrefix(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    || 'site';
}
