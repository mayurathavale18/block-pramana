---
name: debug-issue
description: Diagnose an incorrect result, verification failure, or runtime error in this service by reproducing the problem and tracing its inputs, dependencies, and evidence.
---

# Debug issue

Adapted from Yellowkey's `.claude/skills/debug-issue/skill.md` at `fd28705839e628c62d41f3fd4876ef0c68ab6a44`. See `../LICENSE.yellowkey`.

Capture the failing input, expected result, actual result, and environment before forming a cause. For chain problems, include the chain ID, contract address, relevant block identity, method, and verifier/provider versions without exposing credentials.

If repository-scoped graph tools are available, start with `get_minimal_context(task="<failing behavior>")` using minimal detail. Locate related symbols, follow callers and callees, inspect execution flows, and examine recent changes and affected code. Otherwise use targeted source searches, reads, and Git history. State when the graph is unavailable or does not cover the checkout.

Trace the failure across transport, decoding, contract interpretation, verifier state, and persistence. Separate invalid input, RPC errors, unavailable historical data, unsupported contracts, failed verification, stale state, and legitimate empty results. Compare hypotheses against evidence; do not pick a cause from a plausible error message alone.

Reproduce deterministically where possible and add a failing regression test before the focused fix. Test the corrected behavior and nearby failure paths. Use a live check only when the unresolved question concerns actual upstream compatibility; label it separately from fixtures and local-chain tests.

Explain the root cause, why the change addresses it, which checks passed, and what remains unverified. Keep enough context for a walkthrough rather than enforcing a fixed tool or output budget.
