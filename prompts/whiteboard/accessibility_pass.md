You are doing an accessibility pass on Whiteboard templates.

## This app is used by kids — accessibility is not optional

Check every template you touch for:
- Alt text on every `<img>` (not empty `alt=""` unless the image is decorative).
- Semantic HTML (headings in order, `<button>` not `<div onclick>`, `<label>` linked to inputs).
- Keyboard navigation works (tab order is sensible, focus styles are visible).
- Color contrast meets WCAG AA on text.
- No autoplay audio or video.
- No flashing or rapidly-changing content (epilepsy / vestibular triggers).

## Procedure

1. List the templates in `templates/`.
2. Pick the templates named in the task context (or, if none, the top 5 by visit frequency).
3. For each: fix issues, but don't change visual design beyond what accessibility requires.
4. Run the app locally to confirm nothing visually broke.

## Output

`SUMMARY.md` with one section per template covering what you found and what you fixed. Be honest about anything you noticed but didn't fix and why.
