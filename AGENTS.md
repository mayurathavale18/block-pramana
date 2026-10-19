# Block Pramana

## Project direction

Build an independent, open-source, self-hostable service in TypeScript with Bun. Helios runs as a separate process and connects to a compatible execution RPC plus consensus light-client data. Yellowkey integration comes after the standalone service produces the expected evidence and behavior.

Repository: `mayurathavale18/block-pramana`. Read `README.md` for current behavior and `docs/architecture.md` for the data path and verification boundaries. This project is developed in small slices; a planned capability is not a shipped feature.

## Learning workflow

- Implement one small, understandable slice at a time. Before each slice, explain the question it answers, the data flow, the expected behavior, and the verification boundary.
- Explain important changes and their tests before moving to the next feature. Optimize for understanding and correctness; do not scaffold the whole roadmap at once.
- Trace actual callers and data ownership before changing a shared interface. Record material architecture decisions and their tradeoffs when they arise.
- Keep the service independent of Jobwatch and Yellowkey. Inspect Yellowkey as an integration reference; do not change it as part of service work unless requested.

## Codex workflows

The adapted Yellowkey skills live in `.codex/skills/`, as requested. Read the applicable file before beginning the corresponding activity; do not rely on this directory being automatically discovered by Codex.

| Activity                                   | Required workflow                         |
| ------------------------------------------ | ----------------------------------------- |
| Understand architecture or trace data      | `.codex/skills/explore-codebase/SKILL.md` |
| Diagnose a defect or unexpected output     | `.codex/skills/debug-issue/SKILL.md`      |
| Rename, move, or restructure existing code | `.codex/skills/refactor-safely/SKILL.md`  |
| Review a change                            | `.codex/skills/review-changes/SKILL.md`   |

Use repository-scoped code-review-graph tools first when they are available and cover the current checkout. If they are unavailable, stale, or point to another repository, say so and fall back to targeted source reads, searches, and tests. Never treat a graph summary as proof of runtime behavior.

## Evidence contract

- Identify an asset by chain ID and contract address. A ticker or an external label is not sufficient identity.
- Preserve integer token amounts with `bigint` internally and decimal strings at JSON boundaries. Always state units and decimals explicitly.
- Associate observations with their block number and hash, chain ID, source, and collection time. Keep finality separate from successful execution and freshness.
- Distinguish provider observations, locally verified chain data, calculated metrics, and external attribution. Name the verification method and its limits; do not use an unexplained global `verified` flag.
- A light client does not establish the completeness of arbitrary historical event queries. Establish each method's guarantees and history coverage for the pinned Helios version before claiming verification.
- Never turn an unsupported contract, timeout, missing history, stale verifier, or failed proof into a zero value or a successful result. Preserve uncertainty and distinguish failure from an empty result.
- Treat minting, supply-reducing burns, transfers to designated addresses, scheduled unlocks, claimable amounts, and releases as different operations.
- Clients of a hosted instance trust that instance's verification report unless they independently verify the relevant evidence. Self-hosting and client-side proof verification are separate properties.

## Implementation and checks

- Use descriptive camelCase function and variable names, PascalCase types, strict TypeScript, and explicit units in identifiers when ambiguity is possible.
- Validate external inputs and responses at the boundary. Keep transport, chain reads, and token-specific interpretation separate where the current behavior needs it; avoid speculative abstractions.
- Use Bun for the runtime, package manager, and tests. Running TypeScript does not replace a separate type-checking step.
- Write focused behavior tests for non-trivial parsing, accounting, verification decisions, and failure paths. Use deterministic fixtures for ordinary tests, local-chain integration tests for contract behavior, and separately identified live smoke checks for Helios/provider compatibility.
- When a defect is reproduced, add a failing regression test before fixing it where practical. Do not claim mocked checks prove real upstream verification.
- Run `bun run check` after each slice: formatting, type checking, tests, and build. Report live smoke checks separately from the deterministic suite.
- Keep provider credentials out of source, fixtures, logs, responses, and commits. Validate locally before designing public hosting and deployment.

## Upstream reference

The workflows are adapted from `KaustubhPatange/yellowkey` at commit `fd28705839e628c62d41f3fd4876ef0c68ab6a44`. Their upstream license is retained in `.codex/skills/LICENSE.yellowkey`. Claude lifecycle hooks and the maintainer's machine-specific paths are not part of this adaptation.
