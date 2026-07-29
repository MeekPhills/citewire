// MCP stdio transport.
//
// Reads newline-delimited JSON-RPC messages from stdin, dispatches each to
// server.handle(), and writes each non-undefined response as a single line to
// stdout. stdout carries protocol frames only — every diagnostic goes to
// stderr — so a host reading stdout never sees anything but valid JSON lines.

// Parse-failure response per JSON-RPC 2.0: -32700 with a null id.
function parseErrorResponse() {
  return { jsonrpc: '2.0', id: null, error: { code: -32700, message: 'Parse error' } };
}

export function runStdio(server) {
  const stdin = process.stdin;
  const stdout = process.stdout;

  let buffer = '';

  // Serialize handling so responses are written in the order messages arrive,
  // even though server.handle() is async.
  let chain = Promise.resolve();

  function write(response) {
    if (response !== undefined) stdout.write(JSON.stringify(response) + '\n');
  }

  function dispatch(line) {
    chain = chain.then(async () => {
      let msg;
      try {
        msg = JSON.parse(line);
      } catch {
        write(parseErrorResponse());
        return;
      }
      try {
        write(await server.handle(msg));
      } catch (err) {
        process.stderr.write(`citewire stdio: handler error: ${err && err.stack ? err.stack : err}\n`);
      }
    });
  }

  function processBuffer() {
    let index;
    while ((index = buffer.indexOf('\n')) !== -1) {
      const line = buffer.slice(0, index);
      buffer = buffer.slice(index + 1);
      // Tolerate CRLF line endings and skip blank lines.
      const trimmed = line.endsWith('\r') ? line.slice(0, -1) : line;
      if (trimmed.length > 0) dispatch(trimmed);
    }
  }

  stdin.setEncoding('utf8');
  stdin.on('data', (data) => {
    buffer += data;
    processBuffer();
  });

  stdin.on('end', () => {
    // Flush any trailing message that lacked a final newline.
    const rest = buffer.trim();
    buffer = '';
    if (rest.length > 0) dispatch(rest);
  });

  stdin.resume(); // keep the event loop alive until stdin closes
}
