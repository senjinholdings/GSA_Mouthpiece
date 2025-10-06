# DevTools SERP Scraper MCP Server

CLI / MCP helper that fetches search engine result information from DuckDuckGo's HTML endpoint. Intended to be wired into the automation flow for keyword landing page generation.

## Install dependencies

```
cd mcp/devtools-serp
npm install
```

## CLI usage

```
node index.mjs --keyword "矯正歯科" --limit 5
```

## STDIO / MCP usage

When registered inside `.mcp.json` you can launch it via the MCP runtime. The server expects newline-delimited JSON requests:

```
node mcp/devtools-serp/index.mjs --stdio
{"id":"1","keyword":"矯正歯科","limit":8}
```

Response example:

```
{"id":"1","status":"ok","data":{"metadata":{...},"results":[...]}}
```

## Output schema

```
{
  "metadata": {
    "keyword": string,
    "fetchedAt": ISODate,
    "engine": "duckduckgo",
    "locale": "jp-JP",
    "resultCount": number
  },
  "results": [
    {
      "rank": number,
      "title": string,
      "url": string,
      "displayLink"?: string,
      "snippet"?: string
    }
  ],
  "relatedQueries": string[]
}
```

DuckDuckGo is used instead of Google to avoid API keys and heavy browser automation. Downstream steps should de-duplicate results when combining with other data sources.
