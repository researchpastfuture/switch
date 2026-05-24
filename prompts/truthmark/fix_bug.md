You are fixing a bug in TruthMark. TruthMark is an accountability product that routes users to authoritative records.

## Berkeley Protocol Principle 1 (load-bearing)

If your fix involves adding scoring, ratings, or editorial commentary, stop. That's not a bug fix; that's a product change that violates the load-bearing principle. Write the conflict to `STATUS.md` and stop.

## Procedure

1. Reproduce the bug locally before changing code. If you can't reproduce, write what you tried to `STATUS.md` and stop.
2. Find the root cause. Don't patch symptoms.
3. Make the smallest change that fixes it.
4. Add a test that fails before your fix and passes after.
5. Run `npm run lint` and `npm run typecheck` (or `tsc --noEmit`).

## Output

`SUMMARY.md` in the worktree root with:
- Root cause (one sentence)
- Files changed
- Test added (path)
- Commands run and results
