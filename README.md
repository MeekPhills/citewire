# citewire

An attribution-first MCP server for free news sources and free article APIs.

## Why it exists

Agents need to read news and research metadata, but the publishers who create
that work keep the rights and the traffic. citewire reads the metadata and links
straight back to the original article, so an agent can list, search, and cite a
story without the content ever being copied, stored, or republished. The name is
the whole idea: cite plus wire.

## What it does

citewire has two jobs.

1. **Serve a news platform.** Any site that exposes a compatible read API (list,
   detail, topics) becomes a set of typed MCP tools (`news.list`, `news.get`,
   `news.topics`, `news.about`) by declaring one small JSON block. The tools are a
   mechanical projection of the HTTP surface, so they cannot drift from the API
   they wrap. See [docs/platform-contract.md](docs/platform-contract.md).
2. **Query free article APIs.** Ten open news and research APIs are available as
   pass-through tools. Nothing is stored and nothing is republished; each tool
   returns metadata and links to the original. Every provider is **disabled by
   default**. Enabling one is your deliberate act, and reviewing that provider's
   terms for your use is your responsibility. See
   [docs/providers.md](docs/providers.md).

## Quick start

Run over stdio (the default transport, and how MCP clients launch the server):

```
npx citewire --config citewire.config.json
```

Wire it into Claude Desktop (`claude_desktop_config.json`) or Claude Code
(`.mcp.json`):

```json
{
  "mcpServers": {
    "citewire": {
      "command": "npx",
      "args": ["citewire", "--config", "citewire.config.json"]
    }
  }
}
```

Use an absolute path for `--config` if the client does not launch from your
project directory.

Serve over Streamable HTTP instead of stdio (default port 8722, JSON-RPC over
`POST /`):

```
npx citewire --config citewire.config.json --http 8722
```

## Configuration

A deployment is described entirely by a small JSON file: an optional `platform`
to wrap, and the providers you choose to enable. This example wraps the Karaya
Group Industry News platform and enables one provider, OpenAlex:

```json
{
  "platform": {
    "name": "Karaya Group Industry News",
    "siteUrl": "https://karaya.group",
    "apiBase": "https://karaya.group/api/v1/news"
  },
  "providers": {
    "openalex": { "enabled": true }
  }
}
```

Omit the `platform` block to run providers only. Omit `providers`, or leave a
provider out of it, and that provider stays disabled. A bad config fails loudly
at startup with an error that names the offending field.

## Platform tools

These four tools exist only when a `platform` block is configured.

| Tool          | Purpose                                                                        |
| ------------- | ------------------------------------------------------------------------------ |
| `news.list`   | List items newest first. Filters: `topic`, `industry`, `q`, `days`, `cursor`, `page_size`. |
| `news.get`    | One item by `slug`, with attribution and related coverage.                     |
| `news.topics` | The active taxonomy topics (slug, label, description).                          |
| `news.about`  | Static facts about the server and platform, including the attribution policy.  |

## Providers

Ten free APIs. None requires an API key. Every one ships **disabled**. Provider
tools are namespaced under a short prefix; the authoritative list for a given
deployment is whatever the running server advertises through `tools/list`. Full
detail, endpoints, and free-access terms are in
[docs/providers.md](docs/providers.md).

| Provider          | Tool                    | Queries                                            | Key required | Default  |
| ----------------- | ----------------------- | -------------------------------------------------- | ------------ | -------- |
| GDELT DOC 2.0     | `gdelt.search`          | Worldwide news article metadata                    | none         | disabled |
| GDELT Context 2.0 | `gdelt.context`         | Snippet-level context around a search term         | none         | disabled |
| arXiv             | `arxiv.search`          | Preprint metadata across physics, CS, math, and more | none       | disabled |
| OpenAlex          | `openalex.search`       | Scholarly works, authors, and venues               | none         | disabled |
| Crossref          | `crossref.search`       | DOI registration metadata                          | none         | disabled |
| Semantic Scholar  | `semanticscholar.search`| Papers and author graph                            | none         | disabled |
| Europe PMC        | `europepmc.search`      | Life-sciences and biomedical literature            | none         | disabled |
| dblp              | `dblp.search`           | Computer-science bibliography                       | none         | disabled |
| Hacker News       | `hackernews.top`, `hackernews.item` | HN stories and items (Firebase API)                | none         | disabled |
| DEV               | `devto.search`          | Published DEV articles                             | none         | disabled |

## Design

- **Zero runtime dependencies.** ESM, Node >= 18. Nothing to audit but the
  source in this repo.
- **Hand-written JSON-RPC.** The MCP core is a small dispatcher, not a wrapped
  SDK.
- **Stateless.** No sessions and no stored state. Each request is handled on its
  own.
- **Transport-agnostic core.** `createCitewire(config)` builds one server;
  stdio and Streamable HTTP both pump messages through it. The HTTP handler is
  plain Node and also mounts inside a serverless function.
- **Storage is out of scope.** citewire never stores or republishes content. It
  reads metadata and links to the original. That boundary is the point of the
  project, not a limitation of it.

## Deployments

Karaya Group's Industry News platform
([karaya.group/industry-news](https://karaya.group/industry-news)) is the first
production deployment. It serves citewire at
[https://karaya.group/mcp](https://karaya.group/mcp).

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md). Tests run with `npm test` (`node --test`,
no install required).

## License

MIT. See [LICENSE](LICENSE).
