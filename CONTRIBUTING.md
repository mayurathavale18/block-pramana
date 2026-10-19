# Contributing

Block Pramana is built incrementally to make its chain reads and verification decisions
understandable. Start with the [architecture](docs/architecture.md) and
[first request walkthrough](docs/first-slice.md).

## Setup

Use the Bun version in `.bun-version`:

```sh
bun install --frozen-lockfile
cp .env.example .env
bun run dev
```

There are no runtime package dependencies. TypeScript, Bun's type definitions, and
Prettier are development dependencies.

## Making a change

Explain the question the change answers, its inputs and expected outputs, and what it
can establish from the available evidence. Keep each change small enough to trace from
request to result. Discuss a new capability in an issue before expanding the scope.

Use descriptive camelCase names for functions and variables and PascalCase names for
types. Put units in names when they matter: `amountBaseUnits`, `blockNumber`, and
`observedAt` convey different things. Preserve token quantities with `bigint`; serialize
them as decimal strings at JSON boundaries.

Test behavior and failure paths. For a bug, add a reproducing regression test before the
fix where practical. Update the API documentation when an observable response changes.

Before committing:

```sh
bun run format
bun run check
```

The suite uses deterministic RPC fixtures and loopback HTTP servers. Public RPC checks
are separate, opt-in experiments; record the provider, chain, block, and result without
including credentials. A green fixture suite does not prove live provider or Helios
compatibility.

With `RPC_URL` configured for Ethereum mainnet, run `bun run smoke:live` for a bounded
USDC supply check through an actual loopback API server. It also checks chain-mismatch
handling and shuts the server down when finished. This command contacts your configured
provider and is not part of the offline suite.

## Development instructions

`AGENTS.md` records the project's workflow and evidence rules. Adapted Yellowkey skills
live in `.codex/skills/` and are referenced there. Their graph tooling is optional when
unavailable; source inspection and meaningful tests remain required.

## Reporting problems

Include the endpoint, chain ID, contract address, error code, Bun version, and relevant
block identity. Remove API keys, private RPC paths, and other credentials from reports.
Do not post a `.env` file.
