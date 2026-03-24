/** Internal link rewriter — fix cross-reference links in generated HTML
 *
 * Source markdown often contains links like `./SKILL.md`, `../agents/foo.md`,
 * or `../hooks/bar.hook.ts`. These need to be rewritten to point to the
 * correct output paths (e.g., `./SKILL/index.html`).
 */

import { dirname, join, normalize } from 'path';

/**
 * Rewrite internal links in HTML content.
 *
 * @param html - The HTML content to process
 * @param currentRelativePath - The relative path of the current file (e.g., "skills/DevSkill/SKILL.md")
 * @param knownPaths - Set of all known relative paths in the build
 * @param baseUrl - Base URL prefix for this site (e.g., "/flicky")
 */
export function rewriteInternalLinks(
  html: string,
  currentRelativePath: string,
  knownPaths: Map<string, string>,
  baseUrl: string = '',
): string {
  // Match href attributes that look like internal references
  return html.replace(
    /href="([^"]*?)"/g,
    (match, href: string) => {
      // Skip external, anchor, javascript, mailto, data links
      if (
        href.startsWith('http://') ||
        href.startsWith('https://') ||
        href.startsWith('#') ||
        href.startsWith('javascript:') ||
        href.startsWith('mailto:') ||
        href.startsWith('data:') ||
        href.startsWith('/')
      ) {
        return match;
      }

      // Try to resolve the relative link against the current file's directory
      const currentDir = dirname(currentRelativePath);
      const resolved = normalize(join(currentDir, href));

      // Strip any fragment
      const [pathPart, fragment] = resolved.split('#');

      // Check if this matches a known source path
      const outputPath = knownPaths.get(pathPart);
      if (outputPath) {
        const newHref = baseUrl + '/' + outputPath + (fragment ? '#' + fragment : '');
        return `href="${newHref}"`;
      }

      // Also try with common extensions if the link doesn't have one
      if (!pathPart.includes('.')) {
        for (const ext of ['.md', '/SKILL.md', '/index.html']) {
          const withExt = knownPaths.get(pathPart + ext);
          if (withExt) {
            const newHref = baseUrl + '/' + withExt + (fragment ? '#' + fragment : '');
            return `href="${newHref}"`;
          }
        }
      }

      return match;
    },
  );
}

/**
 * Build a map of source relative paths to output paths.
 */
export function buildPathMap(
  files: Array<{ relativePath: string; outputPath: string }>,
): Map<string, string> {
  const map = new Map<string, string>();
  for (const file of files) {
    map.set(file.relativePath, file.outputPath);
  }
  return map;
}
