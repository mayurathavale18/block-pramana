import { ServiceError } from './errors.ts';

export interface RpcClient {
  request(method: string, params: readonly unknown[]): Promise<unknown>;
}

export function createRpcClient(rpcUrl: URL, timeoutMs = 10_000): RpcClient {
  return {
    async request(method, params) {
      let response: Response;
      let payload: unknown;

      try {
        response = await fetch(rpcUrl, {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ jsonrpc: '2.0', id: 1, method, params }),
          signal: AbortSignal.timeout(timeoutMs),
          redirect: 'error',
        });
        if (!response.ok) {
          throw new ServiceError(
            'RPC_UNAVAILABLE',
            'The RPC endpoint could not complete the request.',
            502,
          );
        }
        payload = await response.json();
      } catch (error) {
        if (error instanceof ServiceError) throw error;
        if (
          error instanceof Error &&
          (error.name === 'TimeoutError' || error.name === 'AbortError')
        ) {
          throw new ServiceError('RPC_TIMEOUT', 'The RPC request timed out.', 504);
        }
        if (error instanceof SyntaxError) {
          throw new ServiceError('INVALID_RPC_RESPONSE', 'The RPC returned invalid JSON.', 502);
        }
        throw new ServiceError(
          'RPC_UNAVAILABLE',
          'The RPC endpoint could not complete the request.',
          502,
        );
      }

      if (
        typeof payload !== 'object' ||
        payload === null ||
        Array.isArray(payload) ||
        !('jsonrpc' in payload) ||
        payload.jsonrpc !== '2.0' ||
        !('id' in payload) ||
        payload.id !== 1 ||
        Object.hasOwn(payload, 'result') === Object.hasOwn(payload, 'error')
      ) {
        throw new ServiceError(
          'INVALID_RPC_RESPONSE',
          'The RPC returned an invalid envelope.',
          502,
        );
      }
      if ('error' in payload) {
        throw new ServiceError('RPC_ERROR', 'The RPC endpoint rejected the request.', 502);
      }
      if (!('result' in payload)) {
        throw new ServiceError('INVALID_RPC_RESPONSE', 'The RPC returned no result.', 502);
      }
      return payload.result;
    },
  };
}
