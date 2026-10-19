# Block Pramana

A self-hostable API for inspecting token data and the evidence behind it.

Block Pramana starts with a question: **what does this token's contract actually report?**
The first implementation reads a token's total supply at a specific finalized block,
preserves the exact amount, and returns the block and verification method alongside it.

The goal is to investigate supply, minting, burns, and vesting through chain data.
Development happens one small, tested step at a time. _Pramana_ means evidence or a means
of valid knowledge; that is the idea behind the project.

**Current stage:** RPC observations. Helios verification, historical events, and vesting
adapters are planned. Current responses explicitly report `unverified`.

## What works today

- Read `totalSupply()` and `decimals()` from a token contract.
- Pin both reads to the same block hash with [EIP-1898](https://eips.ethereum.org/EIPS/eip-1898).
- Check that the RPC's chain ID matches the requested chain.
- Return exact base-unit amounts as strings, with block identity and collection time.
- Report upstream failures instead of guessing values or falling back to `latest`.

## Run locally

Install [Bun 1.4.3](https://bun.sh/docs/installation), then:

```sh
git clone https://github.com/mayurathavale18/block-pramana.git
cd block-pramana
bun install --frozen-lockfile
cp .env.example .env
bun start
```

The example configuration uses a public Ethereum mainnet RPC and listens on
`http://127.0.0.1:3000`. You can replace `RPC_URL` with your provider's HTTP endpoint.
Keep credential-bearing URLs in `.env`, which is ignored by Git.

Read Ethereum USDC supply:

```sh
curl http://127.0.0.1:3000/v1/chains/1/tokens/0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48/supply
```

On Windows PowerShell, use `curl.exe` or:

```powershell
Invoke-RestMethod http://127.0.0.1:3000/v1/chains/1/tokens/0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48/supply
```

The address is listed by [Circle](https://www.circle.com/multi-chain-usdc/ethereum).
The endpoint only reads contract state; it does not sign or send transactions.

See the [API reference](docs/api.md) for the response and error codes.

## What the result establishes

The response records what the configured RPC returned. The block hash keeps the contract
reads consistent, but it does not independently prove that the provider told the truth.
Even the block's `finalized` status is currently reported by that provider.

Helios will be added as a separate, tested verification path. Its supported reads,
checkpoint assumptions, and historical limits must be established before any response is
labelled verified. A hosted instance's report also remains an assertion by that instance
unless the caller independently verifies the evidence.

## Development

```sh
bun run dev
bun run check
```

`check` runs formatting, strict TypeScript checking, deterministic tests, and a Bun build.
Tests use fixtures and a local HTTP server; they do not require a provider key or make
public-chain requests. See [CONTRIBUTING.md](CONTRIBUTING.md) for the workflow.

## Learn

- [Motivation](docs/motivation.md) — the questions behind the project.
- [Architecture](docs/architecture.md) — components, data flow, and trust boundaries.
- [First implementation](docs/first-slice.md) — follow one request through the code.
- [API reference](docs/api.md) — endpoints, units, and failure behavior.

## Next steps

1. Establish and test a Helios-backed read against a supported network and client version.
2. Add bounded mint/burn event history with explicit coverage and recovery behavior.
3. Inspect one known vesting-contract implementation.
4. Integrate the API into Yellowkey through its data-provider boundary.

## License

[MIT](LICENSE). The development skills adapted from Yellowkey retain their
[upstream notice](.codex/skills/LICENSE.yellowkey).
