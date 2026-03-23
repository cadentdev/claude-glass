/** Dev server — serves built site with Bun.serve() */

import { existsSync, readFileSync, statSync, realpathSync } from 'fs';
import { join, extname, resolve } from 'path';
import type { BuildConfig } from './types';

const MIME_TYPES: Record<string, string> = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'application/javascript',
  '.json': 'application/json',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
};

export async function serve(config: BuildConfig): Promise<void> {
  const server = Bun.serve({
    port: config.port,
    hostname: config.host,

    fetch(req) {
      const url = new URL(req.url);
      let pathname = url.pathname;

      // Default to index.html
      if (pathname === '/') pathname = '/index.html';

      // Try exact path
      let filePath = join(config.outputDir, pathname);

      // If no extension, try as directory with index.html
      if (!extname(pathname)) {
        filePath = join(config.outputDir, pathname, 'index.html');
      }

      if (!existsSync(filePath) || !statSync(filePath).isFile()) {
        return new Response('Not Found', { status: 404 });
      }

      // Path containment: resolve symlinks and verify file is within output dir
      const realPath = realpathSync(filePath);
      const realOutputDir = realpathSync(config.outputDir);
      if (!realPath.startsWith(realOutputDir + '/') && realPath !== realOutputDir) {
        return new Response('Forbidden', { status: 403 });
      }

      const content = readFileSync(filePath);
      const ext = extname(filePath);
      const contentType = MIME_TYPES[ext] || 'application/octet-stream';

      return new Response(content, {
        headers: {
          'Content-Type': contentType,
          'X-Content-Type-Options': 'nosniff',
          'Content-Security-Policy': "default-src 'self'; style-src 'self' 'unsafe-inline'; script-src 'none'; img-src 'self' data:;",
        },
      });
    },
  });

  const displayHost = config.host === '0.0.0.0' ? 'localhost' : config.host;
  console.log(`\nServing at http://${displayHost}:${config.port}`);
  if (config.host === '0.0.0.0') {
    console.log(`LAN/Tailscale access: http://<your-ip>:${config.port}`);
  } else {
    console.log('Local only. Use --host 0.0.0.0 for LAN/Tailscale access.');
  }
  console.log('Press Ctrl+C to stop.\n');
}
