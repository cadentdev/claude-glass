#!/usr/bin/env bun
/**
 * claude-glass CLI
 *
 * Static site generator for browsing Claude Code .claude directories.
 *
 * Usage:
 *   claude-glass build [dir]     Build static site
 *   claude-glass serve [dir]     Build + serve with live-reload
 *   claude-glass info [dir]      Print file stats
 */

import { build } from './build';
import { serve } from './serve';
import type { BuildConfig } from './types';
import { resolve } from 'path';
import { homedir } from 'os';

function parseArgs(args: string[]): { command: string; config: BuildConfig } {
  const command = args[0] || 'serve';
  let inputDir = '';
  let outputDir = homedir() + '/.local/share/claude-glass';
  let port = 3333;
  let host = '127.0.0.1';
  let noSearch = false;
  let noMemory = false;
  let noLinkCheck = false;
  let incremental = false;
  const exclude: string[] = [];
  let verbose = false;
  let name = '';

  for (let i = 1; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--output' || arg === '-o') {
      outputDir = args[++i] || outputDir;
    } else if (arg === '--port' || arg === '-p') {
      port = parseInt(args[++i] || '3333', 10);
    } else if (arg === '--host') {
      host = args[++i] || host;
    } else if (arg === '--no-search') {
      noSearch = true;
    } else if (arg === '--no-memory') {
      noMemory = true;
    } else if (arg === '--no-link-check') {
      noLinkCheck = true;
    } else if (arg === '--incremental') {
      incremental = true;
    } else if (arg === '--exclude') {
      exclude.push(args[++i] || '');
    } else if (arg === '--name') {
      name = args[++i] || '';
    } else if (arg === '--verbose') {
      verbose = true;
    } else if (!arg.startsWith('-') && !inputDir) {
      inputDir = arg;
    }
  }

  // Default to ~/.claude
  if (!inputDir) {
    inputDir = resolve(homedir(), '.claude');
  }

  // Resolve paths
  inputDir = resolve(inputDir);
  outputDir = resolve(outputDir);

  return {
    command,
    config: { inputDir, outputDir, port, host, noSearch, noMemory, noLinkCheck, incremental, exclude, verbose, name },
  };
}

function printUsage() {
  console.log(`
claude-glass - Browse your .claude directory

Usage:
  claude-glass build [dir]     Build static site
  claude-glass serve [dir]     Build + serve with live-reload
  claude-glass info [dir]      Print file stats

Options:
  --output, -o <path>    Output directory (default: ~/.local/share/claude-glass)
  --port, -p <number>    Server port (default: 3333)
  --host <addr>          Bind address (default: 127.0.0.1, use 0.0.0.0 for LAN)
  --name <string>        Override project name (default: auto-derived from path)
  --no-search            Skip search index generation
  --no-memory            Exclude MEMORY/ directory tree
  --no-link-check        Skip broken link checking
  --incremental          Only rebuild if source files changed
  --exclude <glob>       Additional exclusion pattern (repeatable)
  --verbose              Print processing details

Examples:
  claude-glass serve                    # Serve ~/.claude on port 3333
  claude-glass build ~/.claude -o ./out # Build to ./out
  claude-glass serve /path/to/.claude   # Serve a specific directory
`);
}

async function main() {
  const args = process.argv.slice(2);

  if (args.includes('--help') || args.includes('-h')) {
    printUsage();
    process.exit(0);
  }

  const { command, config } = parseArgs(args);

  switch (command) {
    case 'build':
      await build(config);
      break;
    case 'serve':
      await build(config);
      await serve(config);
      break;
    case 'info':
      // TODO: Phase 0.7
      console.log(`Input: ${config.inputDir}`);
      console.log('Info command not yet implemented.');
      break;
    default:
      console.error(`Unknown command: ${command}`);
      printUsage();
      process.exit(1);
  }
}

main().catch((err) => {
  console.error('Error:', err.message);
  process.exit(1);
});
