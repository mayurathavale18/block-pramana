---
name: explore-codebase
description: Understand this service or its Yellowkey integration by tracing architecture, data ownership, dependencies, and execution paths before implementation.
---

# Explore codebase

Adapted from Yellowkey's `.claude/skills/explore-codebase/skill.md` at `fd28705839e628c62d41f3fd4876ef0c68ab6a44`. See `../LICENSE.yellowkey`.

## Navigate with the graph when available

Confirm that the code-review-graph tools cover the intended repository and revision. Start graph work with `get_minimal_context(task="<current question>")` and request minimal detail. Use architecture summaries or communities for the broad structure, then semantic search and `query_graph` patterns such as `callers_of`, `callees_of`, and `imports_of` for the specific path. Use flow queries when the execution sequence is unclear.

If the tools are unavailable or do not cover this checkout, state that limitation and use targeted source searches and reads. Do not install graph tooling, copy machine-specific hooks, or change unrelated configuration just to perform a read-only exploration.

## Establish the actual path

Trace the external input through transport, domain interpretation, chain access, verification, persistence, and response. Identify which component owns each value and which components trust it. Inspect the relevant source and adjacent tests rather than relying exclusively on architecture prose.

For Yellowkey, trace the module and data hook into the renderer client, IPC, data-process subscriptions and cache, provider routing, and upstream adapter. Keep its canonical display models separate from this service's exact values and evidence metadata.

## Explain the result

Present a concrete request walkthrough, the important ownership boundaries, the relevant files, and any unresolved behavior. Distinguish source inspection from tests and live observations. Provide enough detail for the learner to explain the path; there is no fixed tool-call or output-token cap.
