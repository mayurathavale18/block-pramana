import { afterEach, describe, expect, test } from 'bun:test';
import { createRpcClient } from '../src/rpc.ts';

const servers: Bun.Server<undefined>[] = [];

function serveRpc(fetch: (request: Request) => Response | Promise<Response>) {
  const server = Bun.serve({ hostname: '127.0.0.1', port: 0, fetch });
  servers.push(server);
  return server.url;
}

afterEach(() => {
  for (const server of servers.splice(0)) server.stop(true);
});

describe('JSON-RPC transport', () => {
  test('sends an Ethereum JSON-RPC request and returns its result', async () => {
    const rpcUrl = serveRpc(async (request) => {
      expect(request.method).toBe('POST');
      expect(await request.json()).toEqual({
        jsonrpc: '2.0',
        id: 1,
        method: 'eth_chainId',
        params: [],
      });
      return Response.json({ jsonrpc: '2.0', id: 1, result: '0x1' });
    });
    expect(await createRpcClient(rpcUrl).request('eth_chainId', [])).toBe('0x1');
  });

  test.each(
    [
      { jsonrpc: '2.0', id: 2, result: '0x1' },
      { jsonrpc: '1.0', id: 1, result: '0x1' },
      { jsonrpc: '2.0', id: 1 },
      { jsonrpc: '2.0', id: 1, result: '0x1', error: { code: -1, message: 'bad' } },
      [],
      null,
    ].map((body) => ({ body })),
  )('rejects invalid response envelopes: %j', async ({ body }) => {
    const rpcUrl = serveRpc(() => Response.json(body));
    await expect(createRpcClient(rpcUrl).request('eth_chainId', [])).rejects.toMatchObject({
      code: 'INVALID_RPC_RESPONSE',
    });
  });

  test('rejects an HTTP failure without returning its body', async () => {
    const rpcUrl = serveRpc(() => new Response('private upstream details', { status: 429 }));
    await expect(createRpcClient(rpcUrl).request('eth_chainId', [])).rejects.toMatchObject({
      code: 'RPC_UNAVAILABLE',
      message: 'The RPC endpoint could not complete the request.',
    });
  });

  test('does not pass provider error messages into the API', async () => {
    const rpcUrl = serveRpc(() =>
      Response.json({
        jsonrpc: '2.0',
        id: 1,
        error: { code: -32000, message: 'private upstream details' },
      }),
    );
    await expect(createRpcClient(rpcUrl).request('eth_call', [])).rejects.toMatchObject({
      code: 'RPC_ERROR',
      message: 'The RPC endpoint rejected the request.',
    });
  });

  test('rejects a response that is not JSON', async () => {
    const rpcUrl = serveRpc(() => new Response('<html>unavailable</html>'));
    await expect(createRpcClient(rpcUrl).request('eth_chainId', [])).rejects.toMatchObject({
      code: 'INVALID_RPC_RESPONSE',
    });
  });

  test('bounds the upstream wait with a timeout', async () => {
    const rpcUrl = serveRpc(async () => {
      await Bun.sleep(100);
      return Response.json({ jsonrpc: '2.0', id: 1, result: '0x1' });
    });
    await expect(createRpcClient(rpcUrl, 10).request('eth_chainId', [])).rejects.toMatchObject({
      code: 'RPC_TIMEOUT',
    });
  });
});
