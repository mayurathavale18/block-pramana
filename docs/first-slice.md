# Follow the first supply read

The first question is deliberately small: what supply does this contract report at one
identified block? We need to distinguish a coherent RPC observation from a verified
chain result before adding history or vesting calculations.

## Start at the request

`src/app.ts` accepts the chain ID and token address from the route. It maps known
failures to documented HTTP responses and keeps unexpected exception details private.

`src/supply.ts` validates that identity before making any RPC request. A ticker such as
`USDC` cannot identify a contract across chains, so the service takes an address and a
chain ID instead.

## Ask the RPC four questions

1. **Which chain are you serving?** `eth_chainId` must match the route.
2. **Which block do you report as finalized?** Keep its number and hash.
3. **What does `totalSupply()` return at that hash?** The call data `0x18160ddd` selects
   the function. Decode the returned 32-byte ABI word as an unsigned integer.
4. **What does `decimals()` return at the same hash?** `0x313ce567` selects the scale
   convention. A value outside uint8 cannot be accepted as decimals.

An EIP-1898 reference names the hash directly. If the provider rejects it, the operation
fails rather than switching to `latest` or a different block-reference form.

## Keep the number exact

Supply is measured in integer base units. For a token with six decimals, the base-unit
amount `1000000000000` represents one million tokens. The service returns the exact
integer string and its decimals separately. It never uses a floating-point number for
supply, even if a particular token happens to fit within the safe-integer range.

## State what was checked

`src/rpc.ts` checks the HTTP result, JSON-RPC version, response ID, and exclusive
result/error envelope. Domain code then validates quantities, addresses, block hashes,
and ABI words. These checks catch malformed data and inconsistent requests. They do not
authenticate chain state, so `verification.status` remains `unverified`.

## Run the checks

```sh
bun test
bun run typecheck
```

The supply tests demonstrate full uint256 precision, genuine zero values, same-hash
reads, chain mismatch, unavailable finality, and malformed contract/block responses.
Transport tests exercise actual loopback HTTP requests, RPC envelopes, upstream errors,
and timeout behavior. HTTP tests check routing, failure statuses, and error redaction.

To explore the boundary, change the fixture RPC to return a different, valid ABI-encoded
supply. The observation will change and will still say `unverified`. Schema validation
cannot distinguish a plausible lie from a true value. That is the next question for
the Helios slice.
