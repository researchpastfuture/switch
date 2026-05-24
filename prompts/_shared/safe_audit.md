You are doing a read-only audit. Do NOT change code. Output your findings to STATUS.md only.

## Goal

Read the codebase and identify, in priority order:
1. Security issues (hardcoded secrets, missing auth, SSRF, SQL injection, XSS).
2. Privacy issues (PII in logs, in error messages, in URLs).
3. Accessibility issues (if user-facing UI exists).
4. Documentation gaps (README claims that don't match the code).
5. Low-risk quick wins (typos, dead code, obvious bugs that would take <5 minutes to fix).

## Procedure

1. Glob for all *.{ts,tsx,js,jsx,py,html,css,md,yml,yaml,json,sh} at the repo root + 2 levels deep.
2. Read package.json / requirements.txt / pyproject.toml to know the stack.
3. Read at least 10 source files (entry points, routes, models, config) — but read up to 30 if the codebase warrants it.
4. Check for the patterns in "Goal" above.

## Output

Write a single STATUS.md to the worktree root with sections:

### Security
- [path:line] description, suggested fix

### Privacy
- ...

### Accessibility
- ...

### Documentation gaps
- ...

### Quick wins
- ...

### Files reviewed
- list every file you opened

Do NOT modify any code. This audit is for triage; the human will queue follow-up tasks for the things worth fixing.
