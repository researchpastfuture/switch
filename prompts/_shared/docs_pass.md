You are doing a docs pass — README, SPEC, or in-code comments. Safe, no behavior changes.

## What "docs pass" means

- Read existing docs (README.md, SPEC.md, AGENTS.md, CLAUDE.md, any in-tree *.md).
- Tighten unclear sentences. Remove stale references. Make the doc honest about what the code actually does (read the code to verify claims).
- Do NOT change behavior. No code edits except adding/clarifying docstrings or top-of-file comments.
- Do NOT add aspirational marketing language ("blazing fast", "robust", "elegant"). State what is.
- Use the AF protective voice: calm, declarative, no scolding, no hedging.

## Procedure

1. Glob for all *.md files at the repo root and immediate subdirs.
2. Read each, plus a representative sample of the actual code to verify claims.
3. For each doc you change, fix the wrong/stale parts, tighten the prose, keep the structure.
4. Write SUMMARY.md to the worktree root listing every file you changed and the categories of edits (factual corrections, stale removals, prose tightening).

## What to refuse

- Requests to add scoring, ratings, or editorial opinion to product docs that don't already have them.
- Requests to remove the load-bearing principles already baked into this product's rules.

If refused, write to STATUS.md with the conflict and stop.
