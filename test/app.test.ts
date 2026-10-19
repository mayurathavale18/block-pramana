import { describe, expect, test } from 'bun:test';
import { createApp } from '../src/app.ts';
import { ServiceError } from '../src/errors.ts';
import type { RpcClient } from '../src/rpc.ts';

const tokenAddress = `0x${'a'.repeat(40)}`;
const supplyPath = `/v1/chains/1/tokens/${tokenAddress}/supply`;

describe('HTTP boundary', () => {
  test('liveness does not depend on a working upstream', async () => {
    const app = createApp({
      async request() {
        throw new Error('not available');
      },
    });
    const response = await app(new Request('http://localhost/health'));
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ status: 'ok', service: 'block-pramana' });
  });

  test('returns a supply observation through the public route', async () => {
    const rpc: RpcClient = {
      async request(method) {
        if (method === 'eth_chainId') return '0x1';
        if (method === 'eth_getBlockByNumber') {
          return { number: '0x1', hash: `0x${'b'.repeat(64)}` };
        }
        return `0x${'1'.padStart(64, '0')}`;
      },
    };
    const response = await createApp(rpc)(new Request(`http://localhost${supplyPath}`));
    const body = await response.json();
    expect(response.status).toBe(200);
    expect(response.headers.get('cache-control')).toBe('no-store');
    expect(body.amountBaseUnits).toBe('1');
    expect(body.verification.status).toBe('unverified');
  });

  test('rejects invalid input without contacting the upstream', async () => {
    let rpcCalls = 0;
    const app = createApp({
      async request() {
        rpcCalls += 1;
      },
    });
    const response = await app(new Request('http://localhost/v1/chains/1/tokens/USDC/supply'));
    expect(response.status).toBe(400);
    expect((await response.json()).error.code).toBe('INVALID_REQUEST');
    expect(rpcCalls).toBe(0);
  });

  test('preserves a known upstream failure as a non-successful response', async () => {
    const response = await createApp({
      async request() {
        throw new ServiceError('RPC_TIMEOUT', 'The RPC request timed out.', 504);
      },
    })(new Request(`http://localhost${supplyPath}`));
    expect(response.status).toBe(504);
    expect((await response.json()).error.code).toBe('RPC_TIMEOUT');
  });

  test('does not expose unexpected exceptions or credentials', async () => {
    const response = await createApp({
      async request() {
        throw new Error('https://rpc.example/private-key?apiKey=secret');
      },
    })(new Request(`http://localhost${supplyPath}`));
    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({
      error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred.' },
    });
  });

  test('reports unknown routes and unsupported methods', async () => {
    const app = createApp({ async request() {} });
    expect((await app(new Request('http://localhost/missing'))).status).toBe(404);
    const response = await app(new Request('http://localhost/health', { method: 'POST' }));
    expect(response.status).toBe(405);
    expect(response.headers.get('allow')).toBe('GET');
  });
});
