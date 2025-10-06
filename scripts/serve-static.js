#!/usr/bin/env node

import http from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { createReadStream } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const DEFAULT_RELATIVE_ROOT = '../mouthpiece_矯正歯科';
const DEFAULT_PORT = process.env.PORT ? Number(process.env.PORT) : 5500;

const args = process.argv.slice(2);
const rootArgIndex = args.findIndex((arg) => arg === '--root');
const portArgIndex = args.findIndex((arg) => arg === '--port');

const staticRoot = path.resolve(
  rootArgIndex !== -1 && args[rootArgIndex + 1] ? args[rootArgIndex + 1] : path.join(__dirname, DEFAULT_RELATIVE_ROOT)
);
const port = portArgIndex !== -1 && args[portArgIndex + 1] ? Number(args[portArgIndex + 1]) : DEFAULT_PORT;

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.htm': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml; charset=utf-8',
  '.ico': 'image/x-icon',
  '.txt': 'text/plain; charset=utf-8',
  '.csv': 'text/csv; charset=utf-8',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2'
};

function getContentType(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  return MIME_TYPES[ext] || 'application/octet-stream';
}

function resolveRequestPath(urlPath) {
  const decodedPath = decodeURIComponent(urlPath.split('?')[0]);
  const safePath = path.normalize(decodedPath).replace(/^\/+/, '');
  const target = path.join(staticRoot, safePath);
  if (!target.startsWith(staticRoot)) {
    return null;
  }
  return target;
}

async function createResponse(filePath, res) {
  try {
    const fileStat = await stat(filePath);
    if (fileStat.isDirectory()) {
      const indexPath = path.join(filePath, 'index.html');
      return createResponse(indexPath, res);
    }

    res.statusCode = 200;
    res.setHeader('Content-Type', getContentType(filePath));
    createReadStream(filePath).pipe(res);
  } catch (error) {
    if (error.code === 'ENOENT') {
      res.statusCode = 404;
      res.setHeader('Content-Type', 'text/plain; charset=utf-8');
      res.end('404 Not Found');
      return;
    }

    res.statusCode = 500;
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.end('500 Internal Server Error');
    console.error('[serve-static] Error serving %s: %s', filePath, error.message);
  }
}

const server = http.createServer(async (req, res) => {
  if (!req.url) {
    res.statusCode = 400;
    res.end('Bad Request');
    return;
  }

  const requestedPath = resolveRequestPath(req.url);
  if (!requestedPath) {
    res.statusCode = 403;
    res.end('Forbidden');
    return;
  }

  await createResponse(requestedPath, res);
});

server.on('listening', () => {
  console.log('[serve-static] Serving %s on http://localhost:%d/', staticRoot, port);
  console.log('[serve-static] Press Ctrl+C to stop the server.');
});

server.on('error', (error) => {
  console.error('[serve-static] Server error:', error.message);
  process.exit(1);
});

server.listen(port);
