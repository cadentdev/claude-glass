/** Regression tests for issue #16 — index generators must honor baseUrl */

import { describe, test, expect } from 'bun:test';
import { generateAgentsIndex } from '../indexes/agents-index';
import { generateSkillsIndex } from '../indexes/skills-index';
import { generateHooksIndex } from '../indexes/hooks-index';
import { generateDirectoryIndexes } from '../indexes/directory-index';
import type { ProcessedFile, NavNode } from '../types';

function mkFile(partial: Partial<ProcessedFile> & { type: ProcessedFile['entry']['type']; outputPath: string; title: string; relativePath: string }): ProcessedFile {
  return {
    entry: {
      absolutePath: '',
      relativePath: partial.relativePath,
      type: partial.type,
      size: 0,
      mtime: new Date(),
    },
    html: partial.html ?? '<p>x</p>',
    title: partial.title,
    metadata: partial.metadata ?? {},
    outputPath: partial.outputPath,
  };
}

const BASE = '/flicky';

describe('issue #16 — index generators honor baseUrl', () => {
  test('generateAgentsIndex prefixes hrefs with baseUrl', () => {
    const files: ProcessedFile[] = [
      mkFile({
        type: 'agent',
        title: 'Designer',
        relativePath: 'agents/Designer.md',
        outputPath: 'agents/Designer/index.html',
        metadata: { description: 'Visual designer', model: 'opus', color: '#abcdef' },
      }),
    ];
    const result = generateAgentsIndex(files, BASE);
    expect(result).not.toBeNull();
    expect(result!.html).toContain('href="/flicky/agents/Designer/index.html"');
    expect(result!.html).not.toContain('href="/agents/Designer/index.html"');
  });

  test('generateSkillsIndex prefixes hrefs with baseUrl', () => {
    const files: ProcessedFile[] = [
      mkFile({
        type: 'skill',
        title: 'Research',
        relativePath: 'skills/Research/SKILL.md',
        outputPath: 'skills/Research/SKILL/index.html',
        metadata: { description: 'Do research', effort: 'medium', model: 'sonnet' },
      }),
    ];
    const result = generateSkillsIndex(files, BASE);
    expect(result).not.toBeNull();
    expect(result!.html).toContain('href="/flicky/skills/Research/SKILL/index.html"');
    expect(result!.html).not.toContain('href="/skills/Research/SKILL/index.html"');
  });

  test('generateHooksIndex prefixes hrefs with baseUrl', () => {
    const files: ProcessedFile[] = [
      mkFile({
        type: 'hook',
        title: 'PRDSync',
        relativePath: 'hooks/PRDSync.hook.ts',
        outputPath: 'hooks/PRDSync.hook/index.html',
        metadata: { trigger: 'PostToolUse', purpose: 'Sync PRD to work.json' },
      }),
    ];
    const result = generateHooksIndex(files, BASE);
    expect(result).not.toBeNull();
    expect(result!.html).toContain('href="/flicky/hooks/PRDSync.hook/index.html"');
    expect(result!.html).not.toContain('href="/hooks/PRDSync.hook/index.html"');
  });

  test('generateDirectoryIndexes prefixes hrefs with baseUrl', () => {
    const navTree: NavNode = {
      name: 'root',
      path: '',
      isDirectory: true,
      children: [
        {
          name: 'agents',
          path: 'agents',
          isDirectory: true,
          children: [
            {
              name: 'Designer.md',
              path: 'agents/Designer.md',
              isDirectory: false,
              outputPath: 'agents/Designer/index.html',
              title: 'Designer',
              children: [],
            },
          ],
        },
      ],
    };

    const indexes = generateDirectoryIndexes([], navTree, BASE);
    expect(indexes.length).toBeGreaterThan(0);
    const agentsDir = indexes.find(i => i.outputPath === 'agents/index.html');
    expect(agentsDir).toBeDefined();
    expect(agentsDir!.html).toContain('href="/flicky/agents/Designer/index.html"');
    expect(agentsDir!.html).not.toContain('href="/agents/Designer/index.html"');
  });
});
