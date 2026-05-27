import { useEffect, useMemo, useRef, useState } from 'react';
import Fuse from 'fuse.js';
import type { SearchRecord } from '../../lib/search-index';

export default function SearchBox() {
  const [records, setRecords] = useState<SearchRecord[]>([]);
  const [q, setQ] = useState('');
  const [open, setOpen] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch('/search-index.json')
      .then((r) => r.json())
      .then(setRecords)
      .catch(() => setRecords([]));
  }, []);

  const fuse = useMemo(
    () =>
      new Fuse(records, {
        keys: [
          { name: 'title', weight: 0.5 },
          { name: 'summary', weight: 0.25 },
          { name: 'headings', weight: 0.15 },
          { name: 'body', weight: 0.1 },
        ],
        threshold: 0.4,
        ignoreLocation: true,
        minMatchCharLength: 2,
      }),
    [records],
  );

  const results = useMemo(() => {
    if (q.trim().length < 2) return [];
    return fuse.search(q.trim()).slice(0, 8);
  }, [q, fuse]);

  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, []);

  return (
    <div ref={boxRef} className="relative w-full max-w-md">
      <input
        type="search"
        value={q}
        onChange={(e) => {
          setQ(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        placeholder="Search the document…"
        aria-label="Search the document"
        className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 shadow-sm focus:border-blue-500 focus:outline-none"
      />
      {open && results.length > 0 && (
        <ul className="absolute z-50 mt-1 max-h-96 w-full overflow-auto rounded-md border border-slate-200 bg-white shadow-lg">
          {results.map(({ item }) => (
            <li key={`${item.kind}-${item.title}`}>
              <a
                href={item.url}
                className="block border-b border-slate-100 px-3 py-2 text-sm hover:bg-slate-50"
              >
                <span className="font-medium text-slate-800">{item.title}</span>
                {item.kind === 'glossary' && (
                  <span className="ml-2 rounded bg-slate-100 px-1 text-xs text-slate-500">glossary</span>
                )}
                <span className="block truncate text-xs text-slate-500">{item.summary}</span>
              </a>
            </li>
          ))}
        </ul>
      )}
      {open && q.trim().length >= 2 && results.length === 0 && (
        <div className="absolute z-50 mt-1 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-500 shadow-lg">
          No results for “{q}”.
        </div>
      )}
    </div>
  );
}
