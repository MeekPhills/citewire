# Providers

citewire can query ten free news and research APIs as pass-through tools. Each
tool returns metadata and links to the original source. Nothing is stored and
nothing is republished.

None of these providers requires an API key. Every one of them ships
**disabled**. Read [Terms responsibility](#terms-responsibility) before you
enable any of them.

The free-access basis and courtesy limits below are summarized from each
provider's own documentation. They change. Treat the linked documentation, not
this page, as the current source of truth.

---

## GDELT DOC 2.0

- **Tool:** `gdelt.search`
- **Endpoint:** `https://api.gdeltproject.org/api/v2/doc/doc`
- **Returns:** Worldwide news article metadata (title, url, domain, seen date,
  language). Metadata and links only, never full text.
- **Free-access basis:** GDELT is an open-data project. The DOC endpoint needs
  no key. GDELT asks callers to pace requests courteously rather than hammer the
  endpoint.
- **Docs:** https://blog.gdeltproject.org/gdelt-doc-2-0-api-debuts/

## GDELT Context 2.0

- **Tool:** `gdelt.context`
- **Endpoint:** `https://api.gdeltproject.org/api/v2/context/context`
- **Returns:** Snippet-level context matches around a search term, with source
  metadata and URLs. Metadata and links only.
- **Free-access basis:** Open-data GDELT endpoint, no key required. As with the
  DOC API, pace requests courteously.
- **Docs:** https://blog.gdeltproject.org/announcing-the-gdelt-context-2-0-api/

## arXiv

- **Tool:** `arxiv.search`
- **Endpoint:** `http://export.arxiv.org/api/query`
- **Returns:** Preprint metadata (title, authors, abstract, categories, links)
  across physics, mathematics, computer science, and more. The API responds in
  Atom XML.
- **Free-access basis:** Free and open, no key. arXiv asks API clients to pace
  requests courteously, leaving a few seconds between calls and avoiding rapid
  bursts.
- **Docs:** https://info.arxiv.org/help/api/index.html

## OpenAlex

- **Tool:** `openalex.search`
- **Endpoint:** `https://api.openalex.org/works`
- **Returns:** Scholarly works, authors, and venues. Metadata is CC0.
- **Free-access basis:** Free, no key required. OpenAlex recommends including a
  contact email (its "polite pool") for more consistent service, and documents
  rate expectations for the shared endpoint.
- **Docs:** https://docs.openalex.org/

## Crossref

- **Tool:** `crossref.search`
- **Endpoint:** `https://api.crossref.org/works`
- **Returns:** DOI registration metadata for scholarly works (titles, authors,
  containers, DOIs, links).
- **Free-access basis:** Free, no key. Crossref offers a "polite pool" with more
  consistent performance to callers who identify themselves in the `User-Agent`.
  citewire sends a descriptive `User-Agent` on every request.
- **Docs:** https://api.crossref.org/

## Semantic Scholar

- **Tool:** `semanticscholar.search`
- **Endpoint:** `https://api.semanticscholar.org/graph/v1/paper/search`
- **Returns:** Papers and the author graph (titles, abstracts, authors,
  citations, links).
- **Free-access basis:** Free without a key. Unauthenticated use is subject to a
  shared rate limit that Semantic Scholar documents at roughly one request per
  second. An optional free API key raises that ceiling.
- **Docs:** https://api.semanticscholar.org/api-docs/

## Europe PMC

- **Tool:** `europepmc.search`
- **Endpoint:** `https://www.ebi.ac.uk/europepmc/webservices/rest/search`
- **Returns:** Life-sciences and biomedical literature metadata (titles,
  authors, abstracts, identifiers, links).
- **Free-access basis:** Free, no key required. Pace requests courteously.
- **Docs:** https://europepmc.org/RestfulWebService

## dblp

- **Tool:** `dblp.search`
- **Endpoint:** `https://dblp.org/search/publ/api`
- **Returns:** Computer-science bibliography records (titles, authors, venues,
  years, links).
- **Free-access basis:** Free. dblp throttles heavy and bulk access, so keep
  request volume modest.
- **Docs:** https://dblp.org/faq/How+to+use+the+dblp+search+API.html

## Hacker News

- **Tools:** `hackernews.top`, `hackernews.item`
- **Endpoint:** `https://hacker-news.firebaseio.com/v0/`
- **Returns:** Hacker News stories and items (title, url, author, score,
  comments) from the official Firebase API.
- **Free-access basis:** Public, no key, no documented hard limit. Pace requests
  reasonably.
- **Docs:** https://github.com/HackerNews/API

## DEV

- **Tool:** `devto.search`
- **Endpoint:** `https://dev.to/api/articles`
- **Returns:** Published DEV articles (title, author, tags, url, published date).
- **Free-access basis:** The public read endpoints require no key. Writing to
  DEV needs an API key, but citewire only reads.
- **Docs:** https://developers.forem.com/api

---

## Terms responsibility

citewire ships every provider disabled. Enabling one is your deliberate act, and
it is your responsibility to review that provider's current terms of use for
your use case before you turn it on. Reachability is not permission. An endpoint
answering a request does not mean your intended use is allowed.

Free-tier terms, rate limits, and access rules change, sometimes without notice.
The summaries on this page are a starting point, not legal advice and not a
substitute for reading the provider's own terms at the time you deploy.
