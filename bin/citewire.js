#!/usr/bin/env node
// citewire CLI — runs the MCP server over stdio (default) or HTTP.
//
//   citewire [--config <path>] [--http [port]]
//
// stdio is the default transport (Claude Desktop/Code launch it this way).
// --http starts a local HTTP server, optionally on a given port.

import { existsSync } from 'node:fs';
import { createCitewire, loadConfig } from '../src/index.js';
import { runStdio } from '../src/transports/stdio.js';
import { runHttp } from '../src/transports/http.js';

const USAGE = `citewire — MCP server for free news sources and free article APIs

Usage:
  citewire [--config <path>] [--http [port]]

Options:
  --config <path>   Path to a config JSON file (default: ./citewire.config.json if present)
  --http [port]     Serve over HTTP instead of stdio (default port 8722)
  --help, -h        Show this help
`;

function parseArgs(argv) {
  const opts = { config: null, http: false, port: undefined, help: false };
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '--help' || arg === '-h') {
      opts.help = true;
    } else if (arg === '--config') {
      opts.config = argv[++i];
      if (opts.config === undefined) throw new Error('--config requires a path argument');
    } else if (arg === '--http') {
      opts.http = true;
      // An optional numeric port may follow --http.
      const next = argv[i + 1];
      if (next !== undefined && /^\d+$/.test(next)) {
        opts.port = Number(next);
        i++;
      }
    } else {
      throw new Error(`unknown argument: ${arg}`);
    }
  }
  return opts;
}

async function main() {
  let opts;
  try {
    opts = parseArgs(process.argv.slice(2));
  } catch (err) {
    process.stderr.write(`citewire: ${err.message}\n\n${USAGE}`);
    process.exit(2);
  }

  if (opts.help) {
    process.stderr.write(USAGE);
    process.exit(0);
  }

  // Resolve config: explicit --config, else the conventional file if it exists,
  // else an empty config.
  let config = {};
  const path = opts.config || (existsSync('./citewire.config.json') ? './citewire.config.json' : null);
  if (path) {
    try {
      config = await loadConfig(path);
    } catch (err) {
      process.stderr.write(`citewire: failed to load config ${path}: ${err.message}\n`);
      process.exit(1);
    }
  }

  const server = createCitewire(config);

  if (opts.http) {
    await runHttp(server, opts.port !== undefined ? { port: opts.port } : {});
  } else {
    runStdio(server);
  }
}

main().catch((err) => {
  process.stderr.write(`citewire: ${err && err.stack ? err.stack : err}\n`);
  process.exit(1);
});
