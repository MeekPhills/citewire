import { test } from 'node:test';
import assert from 'node:assert/strict';

const { createCitewire } = await import('../src/index.js');

function req(method, params, id = 1) {
  return { jsonrpc: '2.0', id, method, ...(params !== undefined ? { params } : {}) };
}

test('createCitewire with empty config still serves initialize', async () => {
  const server = createCitewire({});
  assert.equal(typeof server.handle, 'function');
  assert.ok(Array.isArray(server.tools));
  const res = await server.handle(req('initialize', {}));
  assert.equal(res.result.protocolVersion, '2025-06-18');
  assert.ok(res.result.capabilities.tools);
});

test('createCitewire with empty config: tools/list resolves to an array', async () => {
  const server = createCitewire({});
  const res = await server.handle(req('tools/list', {}));
  assert.ok(Array.isArray(res.result.tools));
});

test('createCitewire composes platform + provider tools', async () => {
  const server = createCitewire({
    platform: { name: 'Example News', siteUrl: 'https://news.example', apiBase: 'https://api.example/v1' },
    providers: { openalex: { enabled: true } },
  });
  const res = await server.handle(req('tools/list', {}));
  const names = res.result.tools.map((t) => t.name);
  assert.ok(names.some((n) => n.startsWith('news.')), 'platform tools present');
  assert.ok(names.some((n) => n.startsWith('openalex.')), 'provider tools present');
  // Descriptors from tools/list never leak the handler property.
  for (const t of res.result.tools) {
    assert.ok(!('handler' in t));
  }
});
