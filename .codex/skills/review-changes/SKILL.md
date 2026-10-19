---
name: review-changes
description: Review a service change for correctness, evidence integrity, integration compatibility, and meaningful test coverage, reporting actionable findings with source locations.
---

# Review changes

Adapted from Yellowkey's `.claude/skills/review-changes/skill.md` at `fd28705839e628c62d41f3fd4876ef0c68ab6a44`. See `../LICENSE.yellowkey`.

Establish the diff and intended behavior, then inspect connected callers, dependencies, and tests. When repository-scoped graph tools are available, start with `get_minimal_context(task="<review scope>")` using minimal detail. Use change detection, affected-flow and impact queries, and `query_graph` with `tests_for` to prioritize investigation. Otherwise use the diff and targeted source reads, and state the graph limitation.

Follow the real data path. Check chain/contract identity, block consistency, integer precision, response validation, missing and stale data, verification claims, and persistence/recovery behavior when the change touches them. For historical data, distinguish verified inclusion from evidence of complete coverage. For a hosted API, distinguish a service assertion from proof independently checked by its caller.

Confirm that tests exercise observable behavior and relevant failure paths. Fixture success is not evidence that a provider or Helios version works live. Do not invent missing requirements or request unrelated rewrites.

Report actionable findings first, ordered by severity, with a precise source location, trigger, user-visible consequence, and the correction needed. Say when no actionable findings were found, identify the checks actually performed, and distinguish remaining verification gaps from confirmed defects. Give a merge recommendation only when requested or useful to the review.
