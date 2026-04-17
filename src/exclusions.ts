/** Default exclusion patterns for claude-glass */

export const DEFAULT_EXCLUSIONS = [
  // Runtime/ephemeral
  'sessions/**',
  'session-env/**',
  'telemetry/**',
  'todos/**',
  'debug/**',
  'file-history/**',
  'paste-cache/**',
  'shell-snapshots/**',
  'cache/**',
  'backups/**',
  'plugins/**',
  'node_modules/**',
  'Releases/**',
  'tasks/**',
  'worktrees/**',
  '.claude/worktrees/**',

  // Sensitive
  '.env',
  '.env.*',
  '*.pem',
  '*.key',
  '*.p12',
  '*.pfx',
  '*.secret',
  '*.token',
  '.credentials.json',
  'credentials.json',
  'id_rsa',
  'id_ed25519',
  'mcp-needs-auth-cache.json',
  'stats-cache.json',
  '*.sqlite',
  '*.db',

  // Binary/large
  '*.png',
  '*.jpg',
  '*.jpeg',
  '*.gif',
  '*.ico',
  '*.woff2',
  '*.woff',
  '*.ttf',
  '*.eot',

  // Git
  '.git/**',
  '.github/**',

  // Build output
  'dist/**',
  'build/**',
  'out/**',

  // Logs
  'history.jsonl',
  'ntfy-inbox.jsonl',

  // Bulk learning
  'MEMORY/LEARNING/ALGORITHM/**',

  // Install artifacts
  'PAI-Install/**',

  // Project session data (per-project .claude dirs)
  'projects/**',

  // Packs (bundled content, high volume)
  'Packs/**',

  // Observability
  'Observability/**',

  // Voice server (runtime code, not documentation)
  'VoiceServer/**',
  'VoiceServerV1/**',

  // Downloads
  'downloads/**',

  // Images
  'images/**',
];

/**
 * Check if a relative path matches any exclusion pattern.
 * Supports ** glob patterns and simple filename matches.
 */
export function isExcluded(relativePath: string, exclusions: string[]): boolean {
  for (const pattern of exclusions) {
    if (matchPattern(relativePath, pattern)) return true;
  }
  return false;
}

function matchPattern(path: string, pattern: string): boolean {
  // Exact filename match
  if (!pattern.includes('/') && !pattern.includes('*')) {
    const filename = path.split('/').pop() || '';
    return filename === pattern;
  }

  // Extension match (*.ext)
  if (pattern.startsWith('*.')) {
    const ext = pattern.slice(1); // .ext
    return path.endsWith(ext);
  }

  // Directory glob (dir/**)
  if (pattern.endsWith('/**')) {
    const dir = pattern.slice(0, -3);
    return path === dir || path.startsWith(dir + '/');
  }

  // Exact path match
  return path === pattern;
}
