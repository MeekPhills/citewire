import { test } from 'node:test';
import assert from 'node:assert/strict';

const { createHttpHandler } = await import('../src/transports/http.js');
const { createServer } = await import('../src/core/rpc.js');
const { runStdio } = await import('../src/transports/stdio.js');

function makeServer() {
  return createServer({
    serverInfo: { name: 'citewire-http', version: '0.0.1' },
    instructions: 'http test',
    tools: [],
  });
}

// A req mock that behaves like a Node IncomingMessage stream when a body is given,
// but also exposes .body directly for express-ish handlers.
function makeReq({ method = 'POST', body } = {}) {
  const listeners = { data: [], end: [], error: [] };
  const req = {
    method,
    headers: { 'content-type': 'application/json' },
    url: '/',
    body,
    on(event, cb) {
      listeners[event] = listeners[event] || [];
      listeners[event].push(cb);
      return req;
    },
    // Async-iterable so `for await (const chunk of req)` works too.
    async *[Symbol.asyncIterator]() {
      if (body !== undefined && body !== null) yield Buffer.from(String(body));
    },
  };
  // Drive the classic 'data'/'end' events on next tick.
  queueMicrotask(() => {
    if (body !== undefined && body !== null) {
      for (const cb of listeners.data) cb(Buffer.from(String(body)));
    }
    for (const cb of listeners.end) cb();
  });
  return req;
}

// Tolerant res mock: supports express-ish (status/json/setHeader) AND node-ish
// (writeHead/write/end/statusCode) styles. Captures statusCode, headers, body.
function makeRes() {
  const res = {
    statusCode: 200,
    headers: {},
    body: undefined,
    _ended: false,
    setHeader(k, v) {
      this.headers[String(k).toLowerCase()] = v;
      return this;
    },
    getHeader(k) {
      return this.headers[String(k).toLowerCase()];
    },
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(obj) {
      this.body = obj;
      this._ended = true;
      return this;
    },
    send(data) {
      this._captureBody(data);
      this._ended = true;
      return this;
    },
    writeHead(code, headers) {
      this.statusCode = code;
      if (headers) for (const [k, v] of Object.entries(headers)) this.setHeader(k, v);
      return this;
    },
    write(data) {
      this._captureBody(data);
      return this;
    },
    end(data) {
      if (data !== undefined) this._captureBody(data);
      this._ended = true;
      return this;
    },
    _captureBody(data) {
      if (data === undefined || data === null) return;
      if (typeof data === 'object' && !Buffer.isBuffer(data)) {
        this.body = data;
      } else {
        const prev = typeof this.body === 'string' ? this.body : '';
        this.body = prev + data.toString();
      }
    },
    // Normalize whatever was captured into a parsed object when it is JSON.
    parsed() {
      if (this.body === undefined) return undefined;
      if (typeof this.body === 'object') return this.body;
      try {
        return JSON.parse(this.body);
      } catch {
        return this.body;
      }
    },
  };
  return res;
}

test('createHttpHandler returns an async (req,res) handler', () => {
  const handler = createHttpHandler(makeServer());
  assert.equal(typeof handler, 'function');
});

test('GET -> 405 with Allow: POST', async () => {
  const handler = createHttpHandler(makeServer());
  const req = makeReq({ method: 'GET' });
  const res = makeRes();
  await handler(req, res);
  assert.equal(res.statusCode, 405);
  const allow = res.getHeader('allow');
  assert.ok(allow && /POST/i.test(String(allow)), `expected Allow: POST, got ${allow}`);
});

test('POST with malformed JSON body -> 400 with error.code -32700', async () => {
  const handler = createHttpHandler(makeServer());
  const req = makeReq({ method: 'POST', body: '{bad' });
  const res = makeRes();
  await handler(req, res);
  assert.equal(res.statusCode, 400);
  const parsed = res.parsed();
  assert.ok(parsed && parsed.error, 'error body present');
  assert.equal(parsed.error.code, -32700);
});

test('POST notification -> 204 and no JSON body', async () => {
  const handler = createHttpHandler(makeServer());
  const req = makeReq({
    method: 'POST',
    body: JSON.stringify({ jsonrpc: '2.0', method: 'notifications/initialized' }),
  });
  const res = makeRes();
  await handler(req, res);
  assert.equal(res.statusCode, 204);
  const parsed = res.parsed();
  assert.ok(parsed === undefined || parsed === '' || parsed === null, `expected empty body, got ${JSON.stringify(parsed)}`);
});

test('POST initialize -> 200 with JSON-RPC result', async () => {
  const handler = createHttpHandler(makeServer());
  const req = makeReq({
    method: 'POST',
    body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'initialize', params: {} }),
  });
  const res = makeRes();
  await handler(req, res);
  assert.equal(res.statusCode, 200);
  const parsed = res.parsed();
  assert.ok(parsed && parsed.result, 'result present');
  assert.equal(parsed.result.protocolVersion, '2025-06-18');
});

test('runStdio is an importable function (smoke)', () => {
  assert.equal(typeof runStdio, 'function');
});
