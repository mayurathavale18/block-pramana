export interface Config {
  rpcUrl: URL;
  hostname: string;
  port: number;
}

export function readConfig(environment: Record<string, string | undefined>): Config {
  let rpcUrl: URL;
  try {
    rpcUrl = new URL(environment.RPC_URL ?? '');
    if (!['http:', 'https:'].includes(rpcUrl.protocol)) throw new Error();
  } catch {
    throw new Error('Set RPC_URL to an HTTP or HTTPS Ethereum JSON-RPC endpoint.');
  }
  const port = environment.PORT ?? '3000';
  if (!/^[0-9]{1,5}$/.test(port) || Number(port) < 1 || Number(port) > 65535) {
    throw new Error('PORT must be an integer between 1 and 65535.');
  }
  const hostname = environment.HOST ?? '127.0.0.1';
  if (!hostname.trim()) throw new Error('HOST must not be empty.');
  return { rpcUrl, hostname, port: Number(port) };
}
