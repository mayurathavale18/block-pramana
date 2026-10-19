import { ServiceError } from './errors.ts';
import type { RpcClient } from './rpc.ts';
import { readTokenSupply } from './supply.ts';

function json(body: unknown, status = 200, headers: HeadersInit = {}): Response {
  return Response.json(body, {
    status,
    headers: { 'cache-control': 'no-store', ...headers },
  });
}

export function createApp(rpc: RpcClient) {
  return async function handleRequest(request: Request): Promise<Response> {
    if (request.method !== 'GET') {
      return json(
        { error: { code: 'METHOD_NOT_ALLOWED', message: 'Use GET for this API.' } },
        405,
        { allow: 'GET' },
      );
    }
    const pathname = new URL(request.url).pathname;
    if (pathname === '/health') {
      return json({ status: 'ok', service: 'block-pramana' });
    }
    const route = /^\/v1\/chains\/([^/]+)\/tokens\/([^/]+)\/supply$/.exec(pathname);
    if (!route) {
      return json({ error: { code: 'NOT_FOUND', message: 'No endpoint matches this path.' } }, 404);
    }

    try {
      return json(await readTokenSupply(rpc, route[1]!, route[2]!));
    } catch (error) {
      if (error instanceof ServiceError) {
        return json({ error: { code: error.code, message: error.message } }, error.status);
      }
      return json(
        { error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred.' } },
        500,
      );
    }
  };
}
