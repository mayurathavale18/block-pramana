import { describe, expect, test } from 'bun:test';
import { readConfig } from '../src/config.ts';

describe('startup configuration', () => {
  test('uses loopback and port 3000 by default', () => {
    const config = readConfig({ RPC_URL: 'https://rpc.example/private?apiKey=secret' });
    expect(config.hostname).toBe('127.0.0.1');
    expect(config.port).toBe(3000);
    expect(config.rpcUrl.protocol).toBe('https:');
  });

  test.each([undefined, '', 'not a URL', 'file:///private', 'ws://localhost:8545'])(
    'rejects missing or unsupported RPC URLs: %s',
    (rpcUrl) => {
      expect(() => readConfig({ RPC_URL: rpcUrl })).toThrow(
        'Set RPC_URL to an HTTP or HTTPS Ethereum JSON-RPC endpoint.',
      );
    },
  );

  test.each(['0', '-1', '65536', '3000extra', '1.5', ''])(
    'rejects an invalid listening port: %s',
    (port) => {
      expect(() => readConfig({ RPC_URL: 'http://localhost:8545', PORT: port })).toThrow(
        'PORT must be an integer between 1 and 65535.',
      );
    },
  );

  test('does not repeat a malformed credential-bearing URL in an error', () => {
    expect(() => readConfig({ RPC_URL: 'https://bad host/private?apiKey=secret' })).toThrow(
      'Set RPC_URL to an HTTP or HTTPS Ethereum JSON-RPC endpoint.',
    );
  });
});
