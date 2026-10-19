import { describe, expect, test } from 'bun:test';
import { readTokenSupply } from '../src/supply.ts';
import type { RpcClient } from '../src/rpc.ts';

const tokenAddress = `0x${'a'.repeat(40)}`;
const blockHash = `0x${'b'.repeat(64)}`;
const observedAt = new Date('2026-10-19T06:00:00.000Z');
const largeSupply = (1n << 256n) - 1n;

function fixtureRpc(overrides: Record<string, unknown> = {}) {
  const calls: { method: string; params: readonly unknown[] }[] = [];
  const responses: Record<string, unknown> = {
    eth_chainId: '0x1',
    eth_getBlockByNumber: { number: '0x123', hash: blockHash },
    totalSupply: `0x${largeSupply.toString(16).padStart(64, '0')}`,
    decimals: `0x${'6'.padStart(64, '0')}`,
    ...overrides,
  };
  const rpc: RpcClient = {
    async request(method, params) {
      calls.push({ method, params });
      if (method === 'eth_call') {
        const transaction = params[0] as { data: string };
        return responses[transaction.data === '0x18160ddd' ? 'totalSupply' : 'decimals'];
      }
      return responses[method];
    },
  };
  return { rpc, calls };
}

describe('token supply observation', () => {
  test('preserves uint256 precision and pins both contract reads to one finalized hash', async () => {
    const { rpc, calls } = fixtureRpc();
    const supply = await readTokenSupply(rpc, '1', tokenAddress, () => observedAt);

    expect(supply).toEqual({
      chainId: '1',
      tokenAddress,
      amountBaseUnits: largeSupply.toString(),
      decimals: 6,
      block: { number: '291', hash: blockHash, requestedTag: 'finalized' },
      observedAt: observedAt.toISOString(),
      source: { type: 'configured-rpc' },
      verification: { status: 'unverified', method: 'rpc-observation' },
    });
    expect(calls).toEqual([
      { method: 'eth_chainId', params: [] },
      { method: 'eth_getBlockByNumber', params: ['finalized', false] },
      {
        method: 'eth_call',
        params: [
          { to: tokenAddress, data: '0x18160ddd' },
          { blockHash, requireCanonical: true },
        ],
      },
      {
        method: 'eth_call',
        params: [
          { to: tokenAddress, data: '0x313ce567' },
          { blockHash, requireCanonical: true },
        ],
      },
    ]);
  });

  test('accepts a genuine zero supply and zero decimals', async () => {
    const zeroWord = `0x${'0'.repeat(64)}`;
    const { rpc } = fixtureRpc({ totalSupply: zeroWord, decimals: zeroWord });
    const supply = await readTokenSupply(rpc, '1', tokenAddress);
    expect(supply.amountBaseUnits).toBe('0');
    expect(supply.decimals).toBe(0);
  });

  test('rejects a different chain before reading the token', async () => {
    const { rpc, calls } = fixtureRpc({ eth_chainId: '0xa' });
    await expect(readTokenSupply(rpc, '1', tokenAddress)).rejects.toMatchObject({
      code: 'CHAIN_MISMATCH',
    });
    expect(calls).toHaveLength(1);
  });

  test('does not substitute latest when finalized data is unavailable', async () => {
    const { rpc, calls } = fixtureRpc({ eth_getBlockByNumber: null });
    await expect(readTokenSupply(rpc, '1', tokenAddress)).rejects.toMatchObject({
      code: 'FINALIZED_BLOCK_UNAVAILABLE',
    });
    expect(calls).toHaveLength(2);
  });

  test.each(['0x', '0x01', `0x${'g'.repeat(64)}`, `0x${'0'.repeat(128)}`])(
    'rejects malformed uint256 contract data: %s',
    async (totalSupply) => {
      const { rpc } = fixtureRpc({ totalSupply });
      await expect(readTokenSupply(rpc, '1', tokenAddress)).rejects.toMatchObject({
        code: 'INVALID_CONTRACT_RESPONSE',
      });
    },
  );

  test('rejects decimals outside uint8 instead of guessing a scale', async () => {
    const { rpc } = fixtureRpc({ decimals: `0x${'100'.padStart(64, '0')}` });
    await expect(readTokenSupply(rpc, '1', tokenAddress)).rejects.toMatchObject({
      code: 'INVALID_CONTRACT_RESPONSE',
    });
  });

  test.each([
    { number: '0x01', hash: blockHash },
    { number: '0x123', hash: '0x123' },
    { hash: blockHash },
  ])('rejects malformed finalized block data: %j', async (block) => {
    const { rpc } = fixtureRpc({ eth_getBlockByNumber: block });
    await expect(readTokenSupply(rpc, '1', tokenAddress)).rejects.toMatchObject({
      code: 'INVALID_RPC_RESPONSE',
    });
  });

  test.each([
    ['0', tokenAddress],
    ['01', tokenAddress],
    ['-1', tokenAddress],
    ['1'.repeat(100), tokenAddress],
    ['1', 'USDC'],
    ['1', `0x${'g'.repeat(40)}`],
  ])('rejects invalid identity before making RPC calls: %s, %s', async (chainId, address) => {
    const { rpc, calls } = fixtureRpc();
    await expect(readTokenSupply(rpc, chainId, address)).rejects.toMatchObject({
      code: 'INVALID_REQUEST',
    });
    expect(calls).toHaveLength(0);
  });
});
