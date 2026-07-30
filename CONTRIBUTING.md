# Contributing to citewire

Thanks for your interest. citewire stays small on purpose, and the guidelines
below keep it that way.

## Requirements

- Node >= 18. citewire relies on the built-in global `fetch`, so nothing older
  works.
- No install step. There are no runtime or dev dependencies to fetch.

## Running the tests

```
npm test
```

That runs `node --test` against the files in `test/`. No `npm install` is
needed. Add tests alongside any change that touches behavior.

## The zero-dependency rule

citewire has no runtime dependencies, and that is a feature we defend. A pull
request that adds one needs a strong, specific case in its description: what the
dependency does that the standard library and the current code cannot, and why
vendoring or a small local helper is not enough. Most of the time a few lines of
plain code is the better trade.

## Adding a provider

Provider pull requests are welcome. Each new provider must:

- Export a `docsUrl` pointing at the provider's own API documentation.
- Include an honest `termsNote` describing the free-access basis and any
  courtesy limits, written from what the provider actually documents, not from
  assumption.
- Default to disabled. A provider is only ever active when a deployer enables it
  in their config. Do not ship anything that turns on by itself.
- Return metadata and links only. citewire does not store or republish content,
  and neither should a provider tool.

Document the new provider in `docs/providers.md`, following the shape of the
existing entries.

## Code of conduct

Be professional. Assume good faith, keep discussion on the technical merits, and
treat other contributors the way you would want to be treated.

## CI

GitHub Actions runs `node --test` on Node 18 and 22 for every push and
pull request (`.github/workflows/ci.yml`).
