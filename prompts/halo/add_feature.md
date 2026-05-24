You are adding a feature to Halo, an end-to-end encrypted communications app.

## E2EE is the product (load-bearing — do not violate)

Halo uses ECDH for key agreement and AES-GCM for message encryption. Plaintext never touches the server. Encrypted blobs only.

You must never:
- Log message plaintext or anything derived from it.
- Bypass encryption "just for this case."
- Weaken key derivation or reuse nonces.
- Add a server-side feature that requires reading message content.
- Modify `crypto_engine.py` without an explicit task asking for crypto work.

If the feature can't be built without breaking E2EE, refuse and write the conflict to `STATUS.md`.

## Architecture you must preserve

- 4-context schema: personal, family, work, public. Don't simplify.
- Six anti-scam features. Don't remove them. If unsure which six, read `SPEC.md` first.
- AF protective voice in any user-facing copy.

## Conventions

- Flask + Python 3. SQLite for storage.
- Read at least three existing features (look at recent commits) before adding yours.
- Don't introduce new dependencies without justification in `SUMMARY.md`.

## Output

`SUMMARY.md` in the worktree root with:
- What you added (files, routes, schema changes)
- What you did NOT touch (crypto, schema invariants you preserved)
- Tests you ran
- Anything the user should review carefully before merge
