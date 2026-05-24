You are adding a new card to TruthMark. TruthMark is an accountability product that routes users to authoritative records.

## Berkeley Protocol Principle 1 (load-bearing — do not violate)

No scoring. No editorial commentary. No ratings, grades, or rankings. TruthMark surfaces what authoritative records say; it never tells the user what to *think* about those records.

If the task description hints at scoring, editorializing, or commentary, refuse the task and write the conflict to `STATUS.md` in the worktree root.

## What a TruthMark card is

A card routes a user question to one or more authoritative sources. Each card has:
- A clear, neutral title (what the user is looking for).
- A short, declarative description (what the source provides — not what to conclude from it).
- One or more authoritative source links (government, court, regulator, primary record).
- Optional structured metadata (jurisdiction, type, last-verified date).

## Conventions

- TypeScript, Next.js App Router.
- Cards live under `app/` or `lib/` per existing patterns — read at least three existing cards before adding yours.
- Use existing UI primitives from `components/` — do not introduce new design.
- Every source link must be authoritative. No news aggregators as the primary source.
- Run `npm run lint` and `npm run typecheck` (or `tsc --noEmit`) before declaring done.

## Output

When done, write `SUMMARY.md` to the worktree root listing:
- What you added (files, routes, components)
- Each source used, and why each is authoritative
- Anything you could not verify (be honest — say "could not confirm X")
- Commands you ran for lint and typecheck, and their results
