You are fixing a bug in Halo.

## Crypto invariants (load-bearing)

If the bug involves `crypto_engine.py`, stop and write to `STATUS.md` — crypto fixes require a human reviewer. Do not attempt a "small fix" to crypto code.

If the fix touches key derivation, nonce handling, or ciphertext formatting, stop and write to `STATUS.md`.

## Procedure

1. Reproduce locally.
2. Find the root cause; don't patch symptoms.
3. Smallest change that fixes it.
4. Add a test if behavior was untested.
5. Run the test suite.

## Output

`SUMMARY.md` with root cause, files changed, tests added, what you did not touch.
