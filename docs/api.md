# API

The API listens on `127.0.0.1:3000` by default. All endpoints use `GET` and return JSON
with `Cache-Control: no-store`.

## Liveness

`GET /health`

```json
{ "status": "ok", "service": "block-pramana" }
```

This confirms that the HTTP handler is responding. It does not check the upstream RPC,
chain synchronization, or verification readiness.

## Token supply

`GET /v1/chains/{chainId}/tokens/{tokenAddress}/supply`

- `chainId`: positive decimal chain ID, such as `1` for Ethereum mainnet.
- `tokenAddress`: a 20-byte hexadecimal address, normalized to lowercase in the response.

The configured RPC must serve the requested chain and support the `finalized` block tag
and EIP-1898 block-hash references. This slice supports contracts returning standard
ABI-encoded `totalSupply()` and `decimals()` values. ERC-20 makes `decimals()` optional;
a contract without that method cannot produce this complete response.

Illustrative response for a controlled token with one million tokens and six decimals:

```json
{
  "chainId": "1",
  "tokenAddress": "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
  "amountBaseUnits": "1000000000000",
  "decimals": 6,
  "block": {
    "number": "291",
    "hash": "0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb",
    "requestedTag": "finalized"
  },
  "observedAt": "2026-10-19T06:00:00.000Z",
  "source": { "type": "configured-rpc" },
  "verification": {
    "status": "unverified",
    "method": "rpc-observation"
  }
}
```

`amountBaseUnits` is an exact decimal integer string, not a formatted token count.
Keep it as a string or `bigint`; converting to a JavaScript `number` can lose precision.
The example is synthetic and is not a live USDC observation.

`source` identifies the configured RPC path without exposing the provider URL or its
credentials. There is one upstream per service instance. Both contract reads use the
returned block hash. Block identity and finalized status remain provider observations
in this implementation; `observedAt` does not establish chain freshness.

## Errors

```json
{
  "error": {
    "code": "CHAIN_MISMATCH",
    "message": "The configured RPC belongs to a different chain."
  }
}
```

| HTTP | Code                          | Meaning                                                     |
| ---- | ----------------------------- | ----------------------------------------------------------- |
| 400  | `INVALID_REQUEST`             | Invalid chain ID or token-address format                    |
| 404  | `NOT_FOUND`                   | Unknown API route                                           |
| 405  | `METHOD_NOT_ALLOWED`          | Request method is not GET                                   |
| 422  | `CHAIN_MISMATCH`              | RPC chain ID differs from the requested chain               |
| 502  | `RPC_UNAVAILABLE`             | Network or upstream HTTP failure                            |
| 502  | `RPC_ERROR`                   | Upstream JSON-RPC error, including a reverted contract call |
| 502  | `INVALID_RPC_RESPONSE`        | Malformed JSON, envelope, quantity, or block                |
| 502  | `INVALID_CONTRACT_RESPONSE`   | Invalid ABI word or decimals outside uint8                  |
| 503  | `FINALIZED_BLOCK_UNAVAILABLE` | RPC returned no finalized block                             |
| 504  | `RPC_TIMEOUT`                 | One upstream request exceeded its time limit                |
| 500  | `INTERNAL_ERROR`              | Unexpected service failure                                  |

Failures do not return a successful observation with zero or guessed values. Provider
error bodies and unexpected exception details are not forwarded to callers.
