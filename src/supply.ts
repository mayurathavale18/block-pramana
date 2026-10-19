import { ServiceError } from './errors.ts';
import type { RpcClient } from './rpc.ts';

const maxUint256 = (1n << 256n) - 1n;

export interface TokenSupplyObservation {
  chainId: string;
  tokenAddress: string;
  amountBaseUnits: string;
  decimals: number;
  block: {
    number: string;
    hash: string;
    requestedTag: 'finalized';
  };
  observedAt: string;
  source: { type: 'configured-rpc' };
  verification: { status: 'unverified'; method: 'rpc-observation' };
}

function parseQuantity(value: unknown): bigint {
  if (typeof value !== 'string' || !/^0x(?:0|[1-9a-f][0-9a-f]{0,63})$/i.test(value)) {
    throw new ServiceError('INVALID_RPC_RESPONSE', 'The RPC returned an invalid quantity.', 502);
  }
  return BigInt(value);
}

function decodeUint256(value: unknown): bigint {
  if (typeof value !== 'string' || !/^0x[0-9a-f]{64}$/i.test(value)) {
    throw new ServiceError(
      'INVALID_CONTRACT_RESPONSE',
      'The contract did not return one ABI-encoded unsigned integer.',
      502,
    );
  }
  return BigInt(value);
}

export async function readTokenSupply(
  rpc: RpcClient,
  chainId: string,
  tokenAddress: string,
  now: () => Date = () => new Date(),
): Promise<TokenSupplyObservation> {
  if (
    !/^[1-9][0-9]{0,77}$/.test(chainId) ||
    BigInt(chainId) > maxUint256 ||
    !/^0x[0-9a-f]{40}$/i.test(tokenAddress)
  ) {
    throw new ServiceError(
      'INVALID_REQUEST',
      'Use a positive decimal chain ID and a 20-byte hexadecimal token address.',
      400,
    );
  }
  const address = tokenAddress.toLowerCase();
  const actualChainId = parseQuantity(await rpc.request('eth_chainId', []));
  if (actualChainId.toString() !== chainId) {
    throw new ServiceError(
      'CHAIN_MISMATCH',
      'The configured RPC belongs to a different chain.',
      422,
    );
  }

  const block = await rpc.request('eth_getBlockByNumber', ['finalized', false]);
  if (block === null) {
    throw new ServiceError(
      'FINALIZED_BLOCK_UNAVAILABLE',
      'The RPC did not provide a finalized block.',
      503,
    );
  }
  if (
    typeof block !== 'object' ||
    Array.isArray(block) ||
    !('hash' in block) ||
    typeof block.hash !== 'string' ||
    !/^0x[0-9a-f]{64}$/i.test(block.hash) ||
    !('number' in block)
  ) {
    throw new ServiceError('INVALID_RPC_RESPONSE', 'The RPC returned an invalid block.', 502);
  }
  const blockNumber = parseQuantity(block.number);
  const blockHash = block.hash.toLowerCase();
  const blockReference = { blockHash, requireCanonical: true };

  const amountBaseUnits = decodeUint256(
    await rpc.request('eth_call', [{ to: address, data: '0x18160ddd' }, blockReference]),
  );
  const decimals = decodeUint256(
    await rpc.request('eth_call', [{ to: address, data: '0x313ce567' }, blockReference]),
  );
  if (decimals > 255n) {
    throw new ServiceError(
      'INVALID_CONTRACT_RESPONSE',
      'The contract returned decimals outside the uint8 range.',
      502,
    );
  }

  return {
    chainId,
    tokenAddress: address,
    amountBaseUnits: amountBaseUnits.toString(),
    decimals: Number(decimals),
    block: { number: blockNumber.toString(), hash: blockHash, requestedTag: 'finalized' },
    observedAt: now().toISOString(),
    source: { type: 'configured-rpc' },
    verification: { status: 'unverified', method: 'rpc-observation' },
  };
}
