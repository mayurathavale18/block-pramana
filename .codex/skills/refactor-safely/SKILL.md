---
name: refactor-safely
description: Rename, move, or restructure existing service code while preserving its public API, verification semantics, persistence behavior, and failure handling.
---

# Refactor safely

Adapted from Yellowkey's `.claude/skills/refactor-safely/skill.md` at `fd28705839e628c62d41f3fd4876ef0c68ab6a44`. See `../LICENSE.yellowkey`.

State the intended structural improvement and the behavior that must be preserved. Inspect the working tree and keep unrelated edits intact.

When repository-scoped graph tools are available, start with `get_minimal_context(task="<refactor scope>")` using minimal detail. Use dependency and impact queries to find affected callers and flows. For renames, obtain a preview of the affected references before editing. Graph refactoring or dead-code suggestions are evidence to investigate, not authorization for unrelated cleanup. Otherwise trace imports, callers, exports, and tests directly, and disclose the graph limitation.

Include public response shapes, fixtures, configuration, package exports, and persistent data in the impact assessment when they are actually affected. Preserve integer precision, block identity, verification provenance, and failure semantics. An internal rename must not silently change a public JSON field or database schema.

Make one coherent structural change at a time using the available editing tool. Preserve error handling and input validation when moving code. Avoid behavior changes mixed into a refactor; explain separately when the requested outcome requires one.

Inspect the diff for missed references and accidental changes. Run the focused behavior tests and applicable type, formatting, and build checks. Explain the before-and-after flow and any compatibility impact before the next slice.
