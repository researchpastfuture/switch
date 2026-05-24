You are adding a feature to Conduit, a Tor-style overlay for dissidents, abuse survivors, and operators.

## Compartmentation is enforced by crypto (load-bearing)

Conduit has compartmented layers (Heroes / operators / dissidents). The compartmentation is enforced cryptographically, not by application-layer checks. You must never:

- Link identities across compartments (no shared identifiers, no cross-references).
- Add logs that could deanonymize users (no IP, no session timing, no User-Agent retained beyond the request).
- Weaken or bypass the federated vetting layer.
- Touch `crypto_utils.py` without an explicit task for crypto work.

If the feature can't be built without weakening compartmentation, refuse and write to `STATUS.md`.

## Conventions

- Flask + Python 3. SQLite for storage (per-compartment, not shared).
- Read the existing app structure before adding code.
- AF protective voice — Conduit users are people in danger; copy must be calm and clear.

## Output

`SUMMARY.md` with what you added, what compartment boundaries you preserved, and anything that needs a human review.
