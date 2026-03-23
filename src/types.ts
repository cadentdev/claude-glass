/** Core interfaces for claude-glass */

export interface ScanEntry {
  absolutePath: string;
  relativePath: string;
  type: ContentType;
  size: number;
  mtime: Date;
}

export type ContentType =
  | 'markdown'
  | 'skill'
  | 'agent'
  | 'workflow'
  | 'hook'
  | 'json'
  | 'jsonl'
  | 'typescript'
  | 'other';

export interface ProcessedFile {
  entry: ScanEntry;
  html: string;
  title: string;
  metadata: Record<string, unknown>;
  outputPath: string;
}

export interface NavNode {
  name: string;
  path: string;
  outputPath?: string;
  children: NavNode[];
  isDirectory: boolean;
  title?: string;
  metadata?: Record<string, unknown>;
}

export interface BuildConfig {
  inputDir: string;
  outputDir: string;
  port: number;
  host: string;
  noSearch: boolean;
  noMemory: boolean;
  exclude: string[];
  verbose: boolean;
  name: string;
}

export interface SiteEntry {
  name: string;
  source: string;
  prefix: string;
  lastBuilt: string;
  fileCount: number;
}

export interface SiteManifest {
  sites: SiteEntry[];
}

export interface Frontmatter {
  [key: string]: unknown;
}
