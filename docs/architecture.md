# Architecture

Block Pramana is a standalone TypeScript service running on Bun. The first slice has one
domain operation: observe token supply. It does not store history or run a background
indexer.

## Current request path

```text
HTTP client
    |
    v
app.ts          route and HTTP error handling
    |
    v
supply.ts       identity checks, block selection, ABI decoding, observation
    |
    v
rpc.ts          bounded HTTP JSON-RPC requests and envelope validation
    |
    v
Configured Ethereum RPC
```

`index.ts` reads startup configuration and connects the handler to `Bun.serve`.
The route and domain function can also run directly in tests without starting the API
server. Transport tests use an actual loopback HTTP server.

## One observation

1. Validate the decimal chain ID and 20-byte contract address.
2. Read `eth_chainId` and reject a chain mismatch.
3. Request `eth_getBlockByNumber("finalized", false)` and validate its number and hash.
4. Call `totalSupply()` and `decimals()` using the same EIP-1898 block reference:
   `{ "blockHash": "0x...", "requireCanonical": true }`.
5. Decode the unsigned ABI words and construct a response with exact base units,
   decimals, block identity, collection time, and `rpc-observation` provenance.

RPC calls are sequential so a failure stops the observation at its failing step. Each
request has a 10-second timeout. A provider that does not support the finalized tag or
block-hash calls returns a failure; the service does not silently weaken the query.

## Data ownership

| Component        | Owns                                                      |
| ---------------- | --------------------------------------------------------- |
| HTTP layer       | Routes, status codes, and safe error responses            |
| Supply operation | Token identity, interpretation, and response semantics    |
| RPC transport    | HTTP exchange, timeouts, and JSON-RPC envelope validation |
| Configured RPC   | Every chain value observed by this initial implementation |

The transport returns `unknown`; domain code must validate a value before interpreting
it. Chain IDs, block numbers, and token amounts cross the API as decimal strings.
Decimals are a bounded integer from 0 to 255. No floating-point token arithmetic occurs.

## Verification boundary

A well-formed RPC response is not a cryptographic proof. EIP-1898 asks the provider to
read a particular canonical block; it does not make a dishonest provider honest.
`requestedTag: "finalized"` records what was requested, not an independently verified
consensus result. `observedAt` is the service's collection time, not the block time or a
freshness guarantee.

The first response therefore always uses:

```json
{
  "verification": {
    "status": "unverified",
    "method": "rpc-observation"
  }
}
```

The next slice will investigate a separately running Helios client. It needs compatible
execution RPC, consensus light-client data, and a trusted checkpoint. Before connecting
it to this operation, establish which block-reference forms and reads the pinned
version supports. Test its success and failure behavior; do not assume that a local RPC
address or a supported method name implies that every returned field was verified.

Receipt inclusion, completeness of event history, token interpretation, circulating
supply policies, and investor attribution are distinct questions. A future historical
metric must state its scanned range and coverage. A future vesting adapter must name the
contract behavior it understands. Unknown data must remain unknown.

Users of a remote hosted instance trust that instance's report. Running the service
locally and independently checking exported proofs are separate trust models.

## API and integration

HTTP/JSON is the initial public interface. It exposes domain observations, not a generic
Ethereum RPC proxy. The service never accepts an upstream URL from an API request and
does not expose the configured URL in responses or provider errors.

Yellowkey's future adapter can call this API from its data process, translate the
observation into a terminal model, and preserve evidence metadata. The renderer would
continue using its existing IPC and data hooks. Neither repository needs to import the
other's internal source files.

## Current operating scope

The service binds to loopback by default. This slice has no authentication, rate
limiting, persistence, or production deployment. Public hosting needs a separate design
and operational review. No database or cache is necessary for the single request path.

## References

- [ERC-20 interface](https://eips.ethereum.org/EIPS/eip-20)
- [EIP-1898 block references](https://eips.ethereum.org/EIPS/eip-1898)
- [Helios usage](https://github.com/a16z/helios#usage)
- [Helios RPC methods](https://github.com/a16z/helios/blob/master/rpc.md)
