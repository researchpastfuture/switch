You are adding a single focused feature described in the task context.

## Procedure

1. Read `README.md`, `SPEC.md`, `AGENTS.md`, and **at least 5 representative source files** to understand existing patterns (entry point, routes, UI primitives, data model).
2. Implement the smallest version of the feature that delivers the described user-facing value. No more.
3. Match existing conventions strictly — file layout, naming, UI primitives, error handling, test pattern. Do not introduce a new style or library.
4. Add minimal test coverage or a manual verification note appropriate to the stack.
5. Write `SUMMARY.md` to the worktree root listing:
   - Feature: one-sentence description
   - Files added / files changed (with line counts)
   - Existing conventions you followed (one bullet each)
   - Tests / verification you ran and outcome
   - Anything you considered but deliberately left out

## Scope rules

- Do NOT refactor unrelated code "while you're in there."
- Do NOT introduce new dependencies unless the feature genuinely requires one (and call that out in SUMMARY.md).
- Do NOT change visual design beyond what the feature itself requires.
- Do NOT add scoring, ratings, editorial commentary, or marketing language (this applies across all products, doubly so for TruthMark / Signals / VerifyFirst / VerifyPro).

## Safety

- Follow this product's load-bearing principles (in your system prompt).
- Do not touch any file in this product's `protected_paths`.
- If the feature would require violating a principle (e.g. weakening E2EE in Halo, adding scoring to TruthMark), write to `STATUS.md` and stop.
- Never commit secrets, never push to main, never force-push.
