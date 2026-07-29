// MCP Streamable HTTP transport (stateless JSON-RPC 2.0 over POST).
//
// Same semantics as the production Vercel function: POST only, no sessions, no
// SSE. Works both as a serverless handler (runtime pre-parses req.body) and on
// a plain node:http server (we collect the body chunks ourselves).

function rpcError(id, code, message) {
  return { jsonrpc: '2.0', id: id ?? null, error: { code, message } };
}

// Collect a request body as a string. Used only when the runtime did not
// pre-parse req.body (plain node:http). Resolves '' for an empty body.
function readBody(req) {
  return new Promise((resolve, reject) => {
    let data = '';
    req.setEncoding('utf8');
    req.on('data', (chunk) => {
      data += chunk;
    });
    req.on('end', () => resolve(data));
    req.on('error', reject);
  });
}

// Build the async (req, res) handler. Shared by serverless exports and runHttp.
export function createHttpHandler(server) {
  return async function handler(req, res) {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Cache-Control', 'no-store');

    if (req.method !== 'POST') {
      // No event stream is offered; the spec permits 405 for other methods.
      res.setHeader('Allow', 'POST');
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      res.statusCode = 405;
      res.end(JSON.stringify(rpcError(null, -32600, 'POST only; this server offers no event stream.')));
      return;
    }

    // Body may arrive pre-parsed (serverless) as an object, as a JSON string,
    // or not at all (plain node:http) — in which case we read the stream.
    let message = req.body;
    if (message === undefined) {
      const raw = await readBody(req);
      message = raw === '' ? undefined : raw;
    }
    if (typeof message === 'string') {
      try {
        message = JSON.parse(message);
      } catch {
        res.setHeader('Content-Type', 'application/json; charset=utf-8');
        res.statusCode = 400;
        res.end(JSON.stringify(rpcError(null, -32700, 'Body is not valid JSON.')));
        return;
      }
    }
    if (message == null) {
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      res.statusCode = 400;
      res.end(JSON.stringify(rpcError(null, -32700, 'Body is not valid JSON.')));
      return;
    }

    const response = await server.handle(message);
    if (response === undefined) {
      // Notification: no response body. We use 204 No Content here. (The
      // Vercel reference returns 202 Accepted; either is spec-acceptable, and
      // 204 is the clearer "nothing to send" for a generic HTTP server.)
      res.statusCode = 204;
      res.end();
      return;
    }
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.statusCode = 200;
    res.end(JSON.stringify(response));
  };
}

// Start a node:http server routing every path to the MCP handler.
export async function runHttp(server, { port = 8722 } = {}) {
  const http = await import('node:http');
  const handler = createHttpHandler(server);
  const httpServer = http.createServer((req, res) => {
    // Errors must never crash the process; surface them as a 500 to stderr.
    Promise.resolve(handler(req, res)).catch((err) => {
      process.stderr.write(`citewire http: handler error: ${err && err.stack ? err.stack : err}\n`);
      if (!res.headersSent) {
        res.setHeader('Content-Type', 'application/json; charset=utf-8');
        res.statusCode = 500;
        res.end(JSON.stringify(rpcError(null, -32603, 'Internal error.')));
      } else if (!res.writableEnded) {
        res.end();
      }
    });
  });

  await new Promise((resolve) => {
    httpServer.listen(port, () => {
      const addr = httpServer.address();
      const shown = addr && typeof addr === 'object' ? `http://localhost:${addr.port}/` : String(addr);
      process.stderr.write(`citewire: MCP HTTP transport listening on ${shown}\n`);
      resolve();
    });
  });

  return httpServer;
}
