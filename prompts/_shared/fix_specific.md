You are fixing a specific issue named in the task context. There is likely an audit `STATUS.md` already in the worktree root from a previous Switch agent — read it if it exists, but the task context is authoritative for what to fix THIS time.

## Procedure

1. Read `STATUS.md` in the worktree root if it exists — it lists prior audit findings, and your fix may correspond to one of them.
2. Locate the file(s) and line(s) the task names. Confirm the issue is real (don't fix a phantom).
3. Make the **smallest** change that fixes it. No refactors. No reorganization.
4. Run the appropriate lint / typecheck / test for the stack (npm run lint, tsc --noEmit, pytest, etc.) and report results.
5. Write `SUMMARY.md` to the worktree root:
   - Root cause (one sentence)
   - Files changed
   - Test or verification you ran and the outcome
   - Anything you noticed but explicitly did NOT change (and why)

## Honesty

If you can't reproduce the issue or believe the audit was wrong, do not make the change. Write to `STATUS.md` explaining why and stop.

## Safety

- Follow this product's load-bearing principles (already in your system prompt).
- Do not touch any file in this product's `protected_paths` rules.
- Do not introduce new dependencies for a fix.
- Do not weaken existing security checks "to make the test pass."
