/** Post-build broken link checker — scans generated HTML for internal broken links */

import { readdirSync, readFileSync, statSync, existsSync } from 'fs';
import { join, resolve, dirname } from 'path';

interface LinkResult {
  page: string;
  href: string;
  target: string;
  status: 'ok' | 'broken';
}

export function checkLinks(outputDir: string, sitePrefix: string = ''): { total: number; broken: LinkResult[] } {
  const htmlFiles: string[] = [];
  collectHtmlFiles(outputDir, htmlFiles);

  const results: LinkResult[] = [];

  for (const file of htmlFiles) {
    const content = readFileSync(file, 'utf-8');
    const pagePath = file.slice(outputDir.length);

    // Extract href attributes from <a> tags
    const hrefRegex = /href="([^"]+)"/g;
    let match;
    while ((match = hrefRegex.exec(content)) !== null) {
      const href = match[1];

      // Skip external links, anchors, javascript:, mailto:, data:
      if (href.startsWith('http://') || href.startsWith('https://') ||
          href.startsWith('#') || href.startsWith('javascript:') ||
          href.startsWith('mailto:') || href.startsWith('data:')) {
        continue;
      }

      // Resolve the target path
      let targetPath: string;
      if (href.startsWith('/')) {
        // If href is site-absolute and already contains the site prefix,
        // strip the leading /<sitePrefix> segment since outputDir IS the
        // per-site prefix directory. Otherwise fall through to the legacy
        // join-against-outputDir behavior.
        if (sitePrefix && href.startsWith('/' + sitePrefix + '/')) {
          targetPath = join(outputDir, href.slice(sitePrefix.length + 1));
        } else {
          targetPath = join(outputDir, href);
        }
      } else {
        targetPath = resolve(dirname(file), href);
      }

      // Check if target exists
      const exists = existsSync(targetPath) ||
        existsSync(targetPath + '/index.html') ||
        existsSync(targetPath.replace(/\/$/, '') + '/index.html');

      results.push({
        page: pagePath,
        href,
        target: targetPath.slice(outputDir.length),
        status: exists ? 'ok' : 'broken',
      });
    }
  }

  const broken = results.filter(r => r.status === 'broken');
  return { total: results.length, broken };
}

function collectHtmlFiles(dir: string, files: string[]) {
  for (const item of readdirSync(dir)) {
    // Skip pagefind generated directory
    if (item === '_pagefind') continue;
    const full = join(dir, item);
    const stat = statSync(full);
    if (stat.isDirectory()) {
      collectHtmlFiles(full, files);
    } else if (item.endsWith('.html')) {
      files.push(full);
    }
  }
}
