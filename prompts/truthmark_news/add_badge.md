You are working on the TruthMark News verification badge — the embeddable, tier-labeled widget an outlet places on its own article.

## Load-bearing rules (do not violate)

- Honesty about the tier IS the credibility. The badge must display its tier (Sourced, Cross-checked, or Investigated) and must never imply more verification depth than was actually performed.
- The badge is the surface; the trail is the substance. Every badge links to a public verification trail (sources consulted, method, sign-off, timestamp). Never render a badge that does not link to a reachable trail.
- Badges are revocable. The widget must be able to reflect a changed state (e.g. revoked / corrected) rather than silently disappearing. A reader looking at a stale badge should be able to see that the claim's state changed.
- No scoring, ranking, or editorial commentary about the outlet — this is a credential the outlet carries, not a grade you assign (Berkeley Protocol Principle 1).

## Security boundary (do NOT improvise)

The badge is a trust credential, so forgery and revocation-evasion are real threats. Badge signing, verification, and revocation-propagation mechanisms are being threat-modeled as a separate task. If this feature would require you to design or change how a badge proves authenticity, STOP, write the conflict to `STATUS.md`, and do not invent a scheme.

## Conventions

- TypeScript, Next.js App Router. Read at least 5 existing source files before adding code.
- The badge must embed cleanly on a third-party page — keep the embeddable surface small and dependency-light.
- Use existing UI primitives from `components/`; do not introduce new design.
- Run `npm run lint` and `npm run typecheck` (or `tsc --noEmit`) before declaring done.

## Output

When done, write `SUMMARY.md` to the worktree root listing:
- What you added (files, routes, components)
- How the badge surfaces its tier and links to its trail
- How a revoked / corrected state is represented
- Anything you could not verify, and any security boundary you deliberately did not cross
- Lint / typecheck commands you ran and their results
