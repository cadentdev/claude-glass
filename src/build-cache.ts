/** Build cache — tracks file mtimes for incremental builds */

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';
import type { ScanEntry } from './types';

export interface BuildCacheEntry {
  relativePath: string;
  mtime: string;
  size: number;
}

export interface BuildCache {
  version: 1;
  builtAt: string;
  entries: BuildCacheEntry[];
}

const CACHE_FILE = '.claude-glass-cache.json';

function cachePath(outputDir: string, prefix: string): string {
  return join(outputDir, prefix, CACHE_FILE);
}

export function readBuildCache(outputDir: string, prefix: string): BuildCache | null {
  const path = cachePath(outputDir, prefix);
  if (!existsSync(path)) return null;
  try {
    const data = JSON.parse(readFileSync(path, 'utf-8'));
    if (data.version !== 1) return null;
    return data;
  } catch {
    return null;
  }
}

export function writeBuildCache(outputDir: string, prefix: string, entries: ScanEntry[]): void {
  const cache: BuildCache = {
    version: 1,
    builtAt: new Date().toISOString(),
    entries: entries.map(e => ({
      relativePath: e.relativePath,
      mtime: e.mtime.toISOString(),
      size: e.size,
    })),
  };
  writeFileSync(cachePath(outputDir, prefix), JSON.stringify(cache, null, 2) + '\n');
}

/**
 * Compare current scan entries against cached entries.
 * Returns { changed, added, removed, unchanged } file lists.
 */
export function diffEntries(
  current: ScanEntry[],
  cache: BuildCache
): {
  changed: ScanEntry[];
  added: ScanEntry[];
  removed: string[];
  unchanged: ScanEntry[];
} {
  const cacheMap = new Map(cache.entries.map(e => [e.relativePath, e]));
  const changed: ScanEntry[] = [];
  const added: ScanEntry[] = [];
  const unchanged: ScanEntry[] = [];

  for (const entry of current) {
    const cached = cacheMap.get(entry.relativePath);
    if (!cached) {
      added.push(entry);
    } else if (
      entry.mtime.toISOString() !== cached.mtime ||
      entry.size !== cached.size
    ) {
      changed.push(entry);
    } else {
      unchanged.push(entry);
    }
    cacheMap.delete(entry.relativePath);
  }

  // Remaining in cacheMap were removed
  const removed = [...cacheMap.keys()];

  return { changed, added, removed, unchanged };
}
