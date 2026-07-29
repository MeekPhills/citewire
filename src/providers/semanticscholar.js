// src/providers/semanticscholar.js
//
// Queries: the Semantic Scholar Academic Graph paper-search endpoint.
// Free-access basis: the Graph API is usable without a key at roughly one
// request per second. The API license governs its data; each paper's full-text
// rights vary and are not granted here.
// Enabling this provider is the deployer's own act. Reachability is not
// permission: the deployer must review Semantic Scholar's terms before turning
// it on.

import { fetchJson, buildUrl, toolJson, toolError, clampLimit } from './util.js';

const ENDPOINT = 'https://api.semanticscholar.org/graph/v1/paper/search';
const FIELDS = 'title,abstract,year,url,citationCount,authors';

export const key = 'semanticscholar';
export const title = 'Semantic Scholar (academic graph search)';
export const docsUrl = 'https://api.semanticscholar.org/api-docs/graph';
export const termsNote =
  'API license applies; paper full-text rights vary. ~1 req/sec unauthenticated.';

export function tools(config) {
  return [
    {
      name: 'semanticscholar.search',
      description:
        'Search papers in the Semantic Scholar Academic Graph. Returns title, abstract, year, url, citation count and authors.',
      inputSchema: {
        type: 'object',
        properties: {
          query: { type: 'string', description: 'Free-text paper search.' },
          limit: { type: 'integer', description: 'Max results (1-25, default 10).' },
        },
        required: ['query'],
      },
      handler: async (args) => {
        const query = args && args.query;
        if (!query || typeof query !== 'string') return toolError('query is required');
        const limit = clampLimit(args && args.limit);
        const url = buildUrl(ENDPOINT, { query, limit, fields: FIELDS });
        const data = await fetchJson(url, { fetchImpl: config && config.fetch });
        const results = Array.isArray(data && data.data) ? data.data : [];
        const items = results.slice(0, limit).map((p) => ({
          title: p.title,
          abstract: p.abstract,
          year: p.year,
          url: p.url,
          citationCount: p.citationCount,
          authors: Array.isArray(p.authors) ? p.authors.map((a) => a.name) : [],
        }));
        return toolJson({ provider: key, query, count: items.length, items, termsNote });
      },
    },
  ];
}

export default { key, title, docsUrl, termsNote, tools };
