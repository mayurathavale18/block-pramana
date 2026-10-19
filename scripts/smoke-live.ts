import assert from 'node:assert/strict';
import { createApp } from '../src/app.ts';
import { readConfig } from '../src/config.ts';
import { createRpcClient } from '../src/rpc.ts';

const config = readConfig(Bun.env);
const server = Bun.serve({
  hostname: '127.0.0.1',
  port: 0,
  idleTimeout: 60,
  fetch: createApp(createRpcClient(config.rpcUrl)),
});
const tokenAddress = '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48';

try {
  const health = await fetch(new URL('/health', server.url));
  assert.equal(health.status, 200);

  const response = await fetch(new URL(`/v1/chains/1/tokens/${tokenAddress}/supply`, server.url));
  const body = await response.json();
  assert.equal(response.status, 200, JSON.stringify(body));
  assert.equal(body.chainId, '1');
  assert.equal(body.tokenAddress, tokenAddress);
  assert.match(body.amountBaseUnits, /^[0-9]+$/);
  assert.ok(BigInt(body.amountBaseUnits) > 0n);
  assert.equal(body.decimals, 6);
  assert.match(body.block.hash, /^0x[0-9a-f]{64}$/);
  assert.equal(body.block.requestedTag, 'finalized');
  assert.equal(body.verification.status, 'unverified');

  const mismatch = await fetch(new URL(`/v1/chains/10/tokens/${tokenAddress}/supply`, server.url));
  assert.equal(mismatch.status, 422);
  assert.equal((await mismatch.json()).error.code, 'CHAIN_MISMATCH');

  console.log(
    JSON.stringify(
      {
        result: 'passed',
        chainId: body.chainId,
        tokenAddress: body.tokenAddress,
        amountBaseUnits: body.amountBaseUnits,
        decimals: body.decimals,
        block: body.block,
        verification: body.verification,
      },
      null,
      2,
    ),
  );
} finally {
  await server.stop(true);
}
