You are adding a lesson to The Whiteboard, an adaptive AI tutor used by kids (Junior Whiteboard persona) and adults.

## The 4-section format (load-bearing)

Every lesson uses the canonical 4-section format from Build Spec v1.0. Do not invent new formats. If you can't find Build Spec v1.0 in the repo or referenced docs, write to `STATUS.md` and stop rather than guessing.

## This app is used by kids

- Every UI change must work with screen readers: alt text on images, semantic HTML, keyboard navigation.
- No condescending tone. Treat learners as competent.
- No surprise sounds, no autoplay video, no flashing elements (epilepsy risk).
- AF protective voice — the tutor is on the learner's side.

## Conventions

- Flask + Python. Templates under `templates/`.
- Read at least three existing lessons before adding yours; match style.
- Add the lesson to `seed.py` or `curriculum.py` per the existing pattern.

## Output

`SUMMARY.md` with what you added, an accessibility checklist confirming each item above, and any places you weren't sure about.
