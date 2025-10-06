#!/usr/bin/env node
/**
 * DevTools SERP scraper.
 *
 * Provides two modes:
 *  1) CLI:  node index.mjs --keyword \"矯正歯科\" --limit 8
 *  2) STDIO: node index.mjs --stdio (expects JSON lines: {\"id\":\"1\",\"keyword\":\"...\"})
 *
 * The implementation uses DuckDuckGo's HTML endpoint which does not require
 * an API key and is comparatively automation-friendly. The results are
 * normalised into a compact JSON structure that downstream LLM processes can
 * consume directly.
 */

import { createInterface } from 'node:readline/promises';
import { stdin, stdout, exit } from 'node:process';
import { URL, URLSearchParams } from 'node:url';
import { load } from 'cheerio';

const USER_AGENT =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/127.0.0.0 Safari/537.36';

function parseArgs(argv) {
  const args = { keyword: undefined, limit: 10, stdio: false };
  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    if (token === '--keyword' || token === '-k') {
      args.keyword = argv[i + 1];
      i += 1;
    } else if (token === '--limit' || token === '-l') {
      const raw = argv[i + 1];
      if (raw) {
        const num = Number(raw);
        if (!Number.isNaN(num) && num > 0) {
          args.limit = Math.floor(num);
        }
      }
      i += 1;
    } else if (token === '--stdio') {
      args.stdio = true;
    } else if (token === '--help' || token === '-h') {
      return { help: true };
    }
  }
  return args;
}

function showHelp() {
  console.error(`DevTools SERP scraper\n\nUsage:\n  node index.mjs --keyword \"矯正歯科\" [--limit 5]\n  node index.mjs --stdio < request.jsonl\n`);
}

function normaliseUrl(rawUrl) {
  if (!rawUrl) return undefined;
  try {
    const url = new URL(rawUrl, 'https://duckduckgo.com');
    if (url.hostname === 'duckduckgo.com' && url.pathname === '/l/') {
      const uddg = url.searchParams.get('uddg');
      if (uddg) {
        return decodeURIComponent(uddg);
      }
    }
    return url.toString();
  } catch {
    return rawUrl;
  }
}

function normaliseText(text) {
  return text.replace(/\s+/g, ' ').trim();
}

async function fetchSerp(keyword, { limit = 10 } = {}) {
  if (!keyword || !keyword.trim()) {
    throw new Error('keyword is required');
  }

  const endpoint = new URL('https://html.duckduckgo.com/html/');
  const params = new URLSearchParams({ q: keyword, kl: 'jp-ja', ia: 'web' });
  endpoint.search = params.toString();

  const response = await fetch(endpoint, {
    headers: {
      'User-Agent': USER_AGENT,
      'Accept-Language': 'ja,en-US;q=0.9,en;q=0.8',
      Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    },
  });

  if (!response.ok) {
    throw new Error(`SERP request failed: ${response.status} ${response.statusText}`);
  }

  const html = await response.text();
  const $ = load(html);

  const results = [];
  $('.result__body').each((_, element) => {
    if (results.length >= limit) return;
    const container = $(element);
    const anchor = container.find('a.result__a');
    const href = normaliseUrl(anchor.attr('href'));
    const title = normaliseText(anchor.text() || '');
    if (!href || !title) return;
    const snippet = normaliseText(container.find('.result__snippet').text() || '');
    const displayLink = normaliseText(container.find('.result__url .result__url__domain').text() || '');
    results.push({
      rank: results.length + 1,
      title,
      url: href,
      displayLink: displayLink || undefined,
      snippet: snippet || undefined,
    });
  });

  const related = [];
  $('.related-searches__item a').each((_, el) => {
    const term = normaliseText($(el).text() || '');
    if (term) related.push(term);
  });

  const metadata = {
    keyword,
    fetchedAt: new Date().toISOString(),
    engine: 'duckduckgo',
    locale: 'jp-JP',
    resultCount: results.length,
  };

  return { metadata, results, relatedQueries: related };
}

async function handleCli(keyword, limit) {
  try {
    const payload = await fetchSerp(keyword, { limit });
    stdout.write(`${JSON.stringify(payload, null, 2)}\n`);
  } catch (error) {
    console.error(error.message || error);
    exit(1);
  }
}

async function handleStdio(limit) {
  const rl = createInterface({ input: stdin, crlfDelay: Infinity });
  for await (const line of rl) {
    if (!line.trim()) continue;
    let request;
    try {
      request = JSON.parse(line);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      stdout.write(`${JSON.stringify({ status: 'error', error: message })}\n`);
      continue;
    }

    const reqLimit = Number(request.limit) > 0 ? Math.floor(Number(request.limit)) : limit;
    try {
      const payload = await fetchSerp(request.keyword, { limit: reqLimit });
      stdout.write(
        `${JSON.stringify({ id: request.id ?? null, status: 'ok', data: payload })}\n`,
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      stdout.write(
        `${JSON.stringify({ id: request.id ?? null, status: 'error', error: message })}\n`,
      );
    }
  }
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    showHelp();
    return;
  }

  if (args.stdio) {
    await handleStdio(args.limit);
    return;
  }

  if (!args.keyword) {
    showHelp();
    exit(1);
    return;
  }

  await handleCli(args.keyword, args.limit);
}

await main();
