import { createApp } from './app.ts';
import { readConfig } from './config.ts';
import { createRpcClient } from './rpc.ts';

const config = readConfig(Bun.env);
const server = Bun.serve({
  hostname: config.hostname,
  port: config.port,
  idleTimeout: 60,
  fetch: createApp(createRpcClient(config.rpcUrl)),
});

console.log(`Block Pramana listening on ${server.url.origin}`);

function shutdown() {
  void server.stop();
}

process.once('SIGINT', shutdown);
process.once('SIGTERM', shutdown);
