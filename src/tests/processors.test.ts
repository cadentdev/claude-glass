import { describe, test, expect } from 'bun:test';
import { mkdtempSync, writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import { processSkill } from '../processors/skill';
import { processHook } from '../processors/hook';
import { processAgent } from '../processors/agent';
import { processWorkflow } from '../processors/workflow';
import { processJson } from '../processors/json-file';
import type { ScanEntry } from '../types';

function makeTempFile(filename: string, content: string, subdir?: string): string {
  const tmp = mkdtempSync(join(tmpdir(), 'claude-glass-test-'));
  const dir = subdir ? join(tmp, subdir) : tmp;
  if (subdir) mkdirSync(dir, { recursive: true });
  const filePath = join(dir, filename);
  writeFileSync(filePath, content, 'utf-8');
  return filePath;
}

function makeEntry(absolutePath: string, relativePath: string, type: string): ScanEntry {
  return {
    absolutePath,
    relativePath,
    type: type as ScanEntry['type'],
    size: 100,
    mtime: new Date(),
  };
}

// ──────────────────────────────────────────────
// processSkill
// ──────────────────────────────────────────────
describe('processSkill', () => {
  test('extracts frontmatter and renders metadata card', () => {
    const content = `---
name: Deploy
description: Deploys things fast
effort: high
model: opus
user_invocable: true
---

# Deploy Workflow

Steps here.
`;
    const absPath = makeTempFile('SKILL.md', content);
    const entry = makeEntry(absPath, 'skills/Deploy/SKILL.md', 'skill');
    const result = processSkill(entry);

    expect(result.title).toBe('Deploy');
    expect(result.html).toContain('badge-orange'); // high effort
    expect(result.html).toContain('badge-blue');   // opus model
    expect(result.html).toContain('user-invocable');
    expect(result.html).toContain('Deploys things fast');
    expect(result.outputPath).toBe('skills/Deploy/SKILL/index.html');
  });

  test('missing frontmatter → defaults', () => {
    const content = `Just some body text without frontmatter.`;
    const absPath = makeTempFile('SKILL.md', content);
    const entry = makeEntry(absPath, 'skills/Mystery/SKILL.md', 'skill');
    const result = processSkill(entry);

    expect(result.title).toBe('Unnamed Skill');
    expect(result.html).toContain('Unnamed Skill');
    // No badges when effort/model are empty
    expect(result.html).not.toContain('badge-row');
    expect(result.outputPath).toBe('skills/Mystery/SKILL/index.html');
  });
});

// ──────────────────────────────────────────────
// processHook
// ──────────────────────────────────────────────
describe('processHook', () => {
  test('extracts JSDoc metadata and syntax-highlights source', () => {
    const content = [
      '/**',
      ' * session-start.hook.ts',
      ' */',
      '',
      '// PURPOSE: Initialize session state',
      '// TRIGGER: session:start',
      '// @version v1.2.3',
      '',
      'export async function run() {',
      '  console.log("hello");',
      '}',
    ].join('\n');
    const absPath = makeTempFile('session-start.hook.ts', content);
    const entry = makeEntry(absPath, 'hooks/session-start.hook.ts', 'hook');
    const result = processHook(entry);

    expect(result.title).toBe('session-start');
    expect(result.metadata.trigger).toBe('session:start');
    expect(result.metadata.version).toBe('1.2.3');
    expect(result.metadata.version).toBe('1.2.3');
    expect(result.html).toContain('Trigger');
    expect(result.html).toContain('Purpose');
    expect(result.html).toContain('hljs');
    expect(result.outputPath).toBe('hooks/session-start.hook/index.html');
  });

  test('outputPath converts .ts to /index.html', () => {
    const content = `// minimal hook\nexport function run() {}`;
    const absPath = makeTempFile('minimal.hook.ts', content);
    const entry = makeEntry(absPath, 'hooks/minimal.hook.ts', 'hook');
    const result = processHook(entry);

    expect(result.outputPath).toBe('hooks/minimal.hook/index.html');
  });
});

// ──────────────────────────────────────────────
// processAgent
// ──────────────────────────────────────────────
describe('processAgent', () => {
  test('renders persona card with color swatch and model badge', () => {
    const content = `---
name: SAM
description: Strategic advisor
model: opus
color: #ff6600
persona.name: Sam
persona.title: Chief Strategy Officer
---

# SAM Agent

Does strategy things.
`;
    const absPath = makeTempFile('SAM.md', content);
    const entry = makeEntry(absPath, 'agents/SAM.md', 'agent');
    const result = processAgent(entry);

    expect(result.title).toBe('SAM');
    expect(result.html).toContain('color-swatch');
    expect(result.html).toContain('#ff6600');
    expect(result.html).toContain('badge-blue'); // opus
    expect(result.html).toContain('Sam');
    expect(result.html).toContain('Chief Strategy Officer');
    expect(result.html).toContain('Strategic advisor');
    expect(result.outputPath).toBe('agents/SAM/index.html');
  });

  test('invalid CSS color is sanitized out', () => {
    const content = `---
name: Evil
color: javascript:alert(1)
---

Body.
`;
    const absPath = makeTempFile('evil.md', content);
    const entry = makeEntry(absPath, 'agents/evil.md', 'agent');
    const result = processAgent(entry);

    expect(result.html).not.toContain('javascript:');
    expect(result.html).not.toContain('color-swatch');
  });

  test('valid named color passes sanitization', () => {
    const content = `---
name: Blue
color: steelblue
---

Body.
`;
    const absPath = makeTempFile('blue.md', content);
    const entry = makeEntry(absPath, 'agents/blue.md', 'agent');
    const result = processAgent(entry);

    expect(result.html).toContain('color-swatch');
    expect(result.html).toContain('steelblue');
  });
});

// ──────────────────────────────────────────────
// processWorkflow
// ──────────────────────────────────────────────
describe('processWorkflow', () => {
  test('extracts title from first heading', () => {
    const content = `# Full Release

Steps:
1. Build
2. Test
3. Deploy
`;
    const absPath = makeTempFile('FullRelease.md', content);
    const entry = makeEntry(absPath, 'skills/Deploy/Workflows/FullRelease.md', 'workflow');
    const result = processWorkflow(entry);

    expect(result.title).toBe('Full Release');
    expect(result.outputPath).toBe('skills/Deploy/Workflows/FullRelease/index.html');
  });

  test('generates parent skill link from path with Workflows dir', () => {
    const content = `## Check Coverage\n\nRun tests.`;
    const absPath = makeTempFile('CoverageCheck.md', content);
    const entry = makeEntry(absPath, 'skills/TestRunner/Workflows/CoverageCheck.md', 'workflow');
    const result = processWorkflow(entry);

    expect(result.html).toContain('Workflow of');
    expect(result.html).toContain('href="/skills/TestRunner/SKILL/index.html"');
    expect(result.html).toContain('TestRunner');
  });

  test('no Workflows dir in path → no parent info', () => {
    const content = `# Standalone\n\nNo parent.`;
    const absPath = makeTempFile('standalone.md', content);
    const entry = makeEntry(absPath, 'docs/standalone.md', 'workflow');
    const result = processWorkflow(entry);

    expect(result.html).not.toContain('workflow-parent');
    expect(result.html).not.toContain('Workflow of');
  });

  test('no heading → falls back to filename', () => {
    const content = `Just some text without a heading.`;
    const absPath = makeTempFile('mystery.md', content);
    const entry = makeEntry(absPath, 'docs/mystery.md', 'workflow');
    const result = processWorkflow(entry);

    expect(result.title).toBe('mystery');
  });
});

// ──────────────────────────────────────────────
// processJson
// ──────────────────────────────────────────────
describe('processJson', () => {
  test('valid JSON → renders tree', () => {
    const content = JSON.stringify({ name: 'test', count: 42, active: true }, null, 2);
    const absPath = makeTempFile('config.json', content);
    const entry = makeEntry(absPath, 'settings/config.json', 'json');
    const result = processJson(entry);

    expect(result.title).toBe('config');
    expect(result.html).toContain('json-');
    expect(result.html).toContain('test');
    expect(result.outputPath).toBe('settings/config/index.html');
  });

  test('invalid JSON → renders raw code block', () => {
    const content = '{ broken json: }}}';
    const absPath = makeTempFile('broken.json', content);
    const entry = makeEntry(absPath, 'data/broken.json', 'json');
    const result = processJson(entry);

    expect(result.title).toBe('broken');
    expect(result.html).toContain('<pre><code>');
    expect(result.html).toContain('broken json');
    expect(result.outputPath).toBe('data/broken/index.html');
  });

  test('outputPath converts .json to /index.html', () => {
    const content = '{"a": 1}';
    const absPath = makeTempFile('simple.json', content);
    const entry = makeEntry(absPath, 'simple.json', 'json');
    const result = processJson(entry);

    expect(result.outputPath).toBe('simple/index.html');
  });

  test('nested objects render collapsible tree', () => {
    const content = JSON.stringify({
      server: { host: 'localhost', port: 8080 },
      features: ['a', 'b', 'c'],
    });
    const absPath = makeTempFile('nested.json', content);
    const entry = makeEntry(absPath, 'nested.json', 'json');
    const result = processJson(entry);

    expect(result.html).toContain('json-tree');
    expect(result.html).toContain('localhost');
  });

  test('HTML in JSON values is escaped', () => {
    const content = JSON.stringify({ xss: '<script>alert(1)</script>' });
    const absPath = makeTempFile('xss.json', content);
    const entry = makeEntry(absPath, 'xss.json', 'json');
    const result = processJson(entry);

    expect(result.html).toContain('&lt;script&gt;');
    expect(result.html).not.toContain('<script>alert');
  });
});
