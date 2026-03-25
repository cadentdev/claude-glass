/** Pagefind integration — runs pagefind indexing after HTML build */

import { join } from 'path';
import { existsSync } from 'fs';

/**
 * Resolve the actual pagefind binary, bypassing the Node.js wrapper.
 * The npm wrapper (bin.cjs) spawns a full Node process just to spawnSync
 * the real binary — on memory-constrained machines this can ETIMEDOUT.
 */
function resolvePagefindBinary(): string {
  const root = join(import.meta.dir, '..', 'node_modules');

  // Try platform-specific package first (direct binary, no Node overhead)
  const platformBins = [
    join(root, '@pagefind', `linux-x64`, 'bin', 'pagefind_extended'),
    join(root, '@pagefind', `linux-x64`, 'bin', 'pagefind'),
    join(root, '@pagefind', `darwin-arm64`, 'bin', 'pagefind_extended'),
    join(root, '@pagefind', `darwin-arm64`, 'bin', 'pagefind'),
    join(root, '@pagefind', `darwin-x64`, 'bin', 'pagefind_extended'),
    join(root, '@pagefind', `darwin-x64`, 'bin', 'pagefind'),
  ];

  for (const bin of platformBins) {
    if (existsSync(bin)) return bin;
  }

  // Fall back to the Node wrapper
  return join(root, '.bin', 'pagefind');
}

/**
 * Run Pagefind to index the built HTML site.
 * Pagefind generates a search index and UI assets in the output directory.
 */
export function runPagefindIndex(outputDir: string, verbose: boolean = false): void {
  const pagefindBin = resolvePagefindBinary();

  const args = [
    '--site', outputDir,
    '--output-subdir', '_pagefind',
  ];

  if (verbose) {
    args.push('--verbose');
    console.log(`Running: ${pagefindBin} ${args.join(' ')}`);
  }

  try {
    if (verbose) {
      console.log(`Running: ${pagefindBin} ${args.join(' ')}`);
    }

    // Use Bun.spawnSync for reliable subprocess execution.
    // Node's execFileSync under Bun can ETIMEDOUT even when the binary
    // completes in <1s — likely a Bun compatibility issue.
    const proc = Bun.spawnSync([pagefindBin, ...args], {
      stdout: verbose ? 'inherit' : 'pipe',
      stderr: verbose ? 'inherit' : 'pipe',
    });

    if (proc.exitCode === 0) {
      if (!verbose) {
        const output = proc.stdout.toString().trim();
        const lines = output.split('\n');
        const summary = lines.find(l => l.includes('Indexed') && l.includes('page'));
        if (summary) {
          console.log(`Search: ${summary.trim()}`);
        } else {
          console.log('Search index generated');
        }
      }
    } else {
      const stderr = proc.stderr.toString().trim();
      console.error(`Warning: Pagefind exited with code ${proc.exitCode}`);
      if (stderr) console.error(stderr);
      console.error('Search will not be available.');
    }
  } catch (err) {
    console.error('Warning: Pagefind indexing failed:', (err as Error).message);
    console.error('Search will not be available. Install pagefind: bun add pagefind');
  }
}
