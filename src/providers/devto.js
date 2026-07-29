// src/providers/devto.js
//
// Queries: the DEV Community (dev.to) public articles API, filtered by tag.
// Free-access basis: dev.to exposes a public read API with no key required.
// Article rights vary by author; this is a research tool, not a publication
// source.
// Enabling this provider is the deployer's own act. Reachability is not
// permission: the deployer must review dev.to's API terms before turning it on.

import { fetchJson, buildUrl, toolJson, toolError, clampLimit } from './util.js';

const ENDPOINT = 'https://dev.to/api/articles';

export const key = 'devto';
export const title = 'DEV Community (dev.to public articles)';
export const docsUrl = 'https://developers.forem.com/api';
export const termsNote =
  'Public read API; article rights vary by author. Research tool only — not a publication source.';

export function tools(config) {
  return [
    {
      name: 'devto.search',
      description:
        'List recent dev.to articles for a tag. Returns title, url, published date, author, tags and reaction count.',
      inputSchema: {
        type: 'object',
        properties: {
          tag: { type: 'string', description: "Tag to filter by. Default 'ai'.", default: 'ai' },
          limit: { type: 'integer', description: 'Max articles (1-25, default 10).' },
        },
      },
      handler: async (args) => {
        const tag = (args && args.tag) || 'ai';
        if (typeof tag !== 'string') return toolError('tag must be a string');
        const limit = clampLimit(args && args.limit);
        const url = buildUrl(ENDPOINT, { tag, per_page: limit });
        const data = await fetchJson(url, { fetchImpl: config && config.fetch });
        const results = Array.isArray(data) ? data : [];
        const items = results.slice(0, limit).map((a) => ({
          title: a.title,
          url: a.url,
          published_at: a.published_at,
          user: a.user ? a.user.name : null,
          tags: a.tag_list,
          positive_reactions_count: a.positive_reactions_count,
        }));
        return toolJson({ provider: key, tag, count: items.length, items, termsNote });
      },
    },
  ];
}

export default { key, title, docsUrl, termsNote, tools };
