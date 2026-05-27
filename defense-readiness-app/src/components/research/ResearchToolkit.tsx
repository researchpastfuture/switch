import { useEffect, useState } from 'react';
import { useLocalStore } from '../../lib/store';
import { copyToClipboard } from '../../lib/clipboard';
import { formatCitation } from '../../lib/cite';
import { Btn } from '../tools/primitives';

interface Props {
  slug: string;
  title: string;
  sectionNumber: number;
}

/** Wrap the first matching occurrence of `text` inside a single text node of `root`. */
function reHighlight(root: HTMLElement, text: string) {
  if (!text || text.length < 4) return;
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  let node: Node | null;
  while ((node = walker.nextNode())) {
    const idx = node.nodeValue?.indexOf(text) ?? -1;
    if (idx >= 0 && node.parentElement?.tagName !== 'MARK') {
      const range = document.createRange();
      range.setStart(node, idx);
      range.setEnd(node, idx + text.length);
      const mark = document.createElement('mark');
      mark.className = 'adr-highlight';
      try {
        range.surroundContents(mark);
      } catch {
        /* spans nodes — skip inline mark */
      }
      return;
    }
  }
}

export default function ResearchToolkit({ slug, title, sectionNumber }: Props) {
  const { value: bookmarked, setValue: setBookmarked } = useLocalStore<boolean>(
    ['bookmark', slug],
    false,
  );
  const { value: note, setValue: setNote } = useLocalStore<string>(['note', slug], '');
  const { value: highlights, setValue: setHighlights } = useLocalStore<string[]>(
    ['highlights', slug],
    [],
  );
  const [pending, setPending] = useState('');
  const [cited, setCited] = useState(false);

  // Re-apply saved highlights to the prose once on mount.
  useEffect(() => {
    const root = document.getElementById('section-prose');
    if (root) highlights.forEach((h) => reHighlight(root, h));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Track selections inside the prose so the user can save a highlight.
  useEffect(() => {
    const onSelect = () => {
      const sel = window.getSelection();
      const text = sel?.toString().trim() ?? '';
      const root = document.getElementById('section-prose');
      const anchor = sel?.anchorNode;
      const inProse = anchor && root?.contains(anchor);
      setPending(inProse && text.length >= 4 ? text : '');
    };
    document.addEventListener('selectionchange', onSelect);
    return () => document.removeEventListener('selectionchange', onSelect);
  }, []);

  const saveHighlight = () => {
    if (!pending || highlights.includes(pending)) return;
    const root = document.getElementById('section-prose');
    if (root) reHighlight(root, pending);
    setHighlights([...highlights, pending]);
    setPending('');
    window.getSelection()?.removeAllRanges();
  };

  const cite = async () => {
    const ok = await copyToClipboard(formatCitation(title, sectionNumber));
    if (ok) {
      setCited(true);
      setTimeout(() => setCited(false), 1800);
    }
  };

  return (
    <div className="not-prose my-6 rounded-xl border border-slate-200 bg-white p-4">
      <div className="flex flex-wrap items-center gap-2">
        <Btn variant={bookmarked ? 'primary' : 'ghost'} onClick={() => setBookmarked(!bookmarked)}>
          {bookmarked ? '★ Bookmarked' : '☆ Bookmark'}
        </Btn>
        <Btn variant="ghost" onClick={cite}>{cited ? 'Citation copied!' : 'Cite this section'}</Btn>
        {pending && <Btn onClick={saveHighlight}>Save highlight</Btn>}
        <a href="/dossier" className="ml-auto text-sm text-blue-700 hover:underline">
          My Dossier →
        </a>
      </div>

      <label className="mt-3 block text-sm font-medium text-slate-700">
        Your notes on this section
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={3}
          placeholder="Type research notes here — saved automatically in your browser."
          className="mt-1 w-full rounded border border-slate-300 px-2 py-1 text-sm"
        />
      </label>

      {highlights.length > 0 && (
        <div className="mt-3">
          <p className="text-sm font-medium text-slate-700">Saved highlights</p>
          <ul className="mt-1 space-y-1">
            {highlights.map((h, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-slate-600">
                <span className="flex-1 border-l-2 border-amber-300 pl-2 italic">“{h}”</span>
                <button
                  onClick={() => setHighlights(highlights.filter((_, j) => j !== i))}
                  className="text-slate-400 hover:text-red-600"
                  aria-label="Remove highlight"
                >
                  ✕
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
