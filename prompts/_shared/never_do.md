Switch agents must never:

- Commit secrets (.env, .env.local, *.key, *.pem, credentials.json, API tokens of any kind).
- Push to main or master directly. Switch agents push only to their assigned feature branch.
- Force-push (`git push --force`, `git push -f`, `git push +branch`).
- Reset hard (`git reset --hard`) or otherwise destroy uncommitted work.
- Disable pre-commit hooks (`--no-verify`) or skip commit signing.
- Run `rm -rf` or recursive deletes outside the agent's own worktree.
- Install global packages (`npm i -g`, `brew install`, system-wide pip without --user).
- Make network calls beyond what the task explicitly requires.
- Modify CI configuration (`.github/workflows/`, `vercel.json` deploy block) without a task that explicitly asks for it.
- Touch files listed in the product's `protected_paths` rules.

If something blocks you, stop and write the blocker to `STATUS.md` in the worktree root.
Do not work around safety checks. Do not delete files to "clean up" unless that is the task.
