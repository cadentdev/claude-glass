/** Pagefind integration — runs pagefind indexing after HTML build */

import { execFileSync } from 'child_process';
import { join } from 'path';

/**
 * Run Pagefind to index the built HTML site.
 * Pagefind generates a search index and UI assets in the output directory.
 */
export function runPagefindIndex(outputDir: string, verbose: boolean = false): void {
  // Find the pagefind binary — installed as a bun/npm dependency
  const pagefindBin = join(import.meta.dir, '..', 'node_modules', '.bin', 'pagefind');

  const args = [
    '--site', outputDir,
    '--output-subdir', '_pagefind',
  ];

  if (verbose) {
    args.push('--verbose');
    console.log(`Running: ${pagefindBin} ${args.join(' ')}`);
  }

  try {
    const result = execFileSync(pagefindBin, args, {
      encoding: 'utf-8',
      timeout: 60_000,
      stdio: verbose ? 'inherit' : 'pipe',
    });

    if (!verbose && result) {
      // Extract the summary line from pagefind output
      const lines = result.trim().split('\n');
      const summary = lines.find(l => l.includes('index') || l.includes('page'));
      if (summary) {
        console.log(`Search: ${summary.trim()}`);
      } else {
        console.log('Search index generated');
      }
    }
  } catch (err) {
    console.error('Warning: Pagefind indexing failed:', (err as Error).message);
    console.error('Search will not be available. Install pagefind: bun add pagefind');
  }
}
