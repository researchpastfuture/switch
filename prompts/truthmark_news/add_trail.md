You are working on a TruthMark News verification trail — the public record a badge links to. The trail is the substance behind the badge.

## Load-bearing rules (do not violate)

- A trail is a record readers can walk themselves, not a verdict. Present what was checked and how; never tell the reader what to conclude about the outlet (Berkeley Protocol Principle 1 — no scoring, ranking, or editorial commentary).
- Every trail must show, at minimum: the verification tier (Sourced, Cross-checked, or Investigated), the sources consulted, the method used, who signed off, and a timestamp.
- The tier shown on the trail must match the tier on the badge and must honestly reflect the depth performed — never imply more.
- Corrections are visible and logged. If a claim was revised or a badge revoked, the trail shows the state change in place and back-links to the original story; nothing is silently removed.
- Sources should be primary and authoritative wherever the verification depth allows. Be honest in the trail about anything that could not be confirmed.

## Conventions

- TypeScript, Next.js App Router. Read at least 5 existing source files (especially existing trail/record pages) before adding code.
- Use existing UI primitives from `components/`; do not introduce new design.
- A trail page must be publicly reachable and stable — its URL is what the badge points at.
- Run `npm run lint` and `npm run typecheck` (or `tsc --noEmit`) before declaring done.

## Output

When done, write `SUMMARY.md` to the worktree root listing:
- What you added (files, routes, components)
- How the trail surfaces tier, sources, method, sign-off, and timestamp
- How a correction / revocation is shown and back-linked
- Anything you could not verify (say "could not confirm X")
- Lint / typecheck commands you ran and their results
