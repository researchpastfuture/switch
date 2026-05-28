import { useEffect, useState } from 'react';
import { readAll, importAll, clearAll } from '../../lib/store';
import { printDocument } from '../../lib/print';
import { Btn } from '../tools/primitives';
import { SITE } from '../../data/site';

interface TocLite {
  number: number;
  slug: string;
  title: string;
}

interface SectionEntry {
  slug: string;
  number: number;
  title: string;
  bookmarked: boolean;
  note: string;
  highlights: string[];
  tools: { sub: string; value: unknown }[];
}

function summarize(value: unknown): string {
  if (value === null || value === undefined) return '';
  if (Array.isArray(value)) return value.map((v) => summarize(v)).filter(Boolean).join('; ');
  if (typeof value === 'object') {
    const obj = value as Record<string, unknown>;
    const parts: string[] = [];
    for (const [k, v] of Object.entries(obj)) {
      if (v === true) parts.push(k);
      else if (typeof v === 'number') parts.push(`${k}: ${v}`);
      else if (typeof v === 'string' && v.trim()) parts.push(`${k}: ${v}`);
    }
    return parts.join(', ');
  }
  return String(value);
}

export default function Dossier({ toc }: { toc: TocLite[] }) {
  const [snapshot, setSnapshot] = useState<Record<string, unknown>>({});

  const refresh = () => setSnapshot(readAll());
  useEffect(() => {
    refresh();
    const onChange = () => refresh();
    window.addEventListener('adr-store-change', onChange);
    window.addEventListener('storage', onChange);
    return () => {
      window.removeEventListener('adr-store-change', onChange);
      window.removeEventListener('storage', onChange);
    };
  }, []);

  const bySlug = new Map(toc.map((t) => [t.slug, t]));
  const entries: Record<string, SectionEntry> = {};
  const ensure = (slug: string): SectionEntry => {
    const t = bySlug.get(slug);
    if (!entries[slug]) {
      entries[slug] = {
        slug,
        number: t?.number ?? 99,
        title: t?.title ?? slug,
        bookmarked: false,
        note: '',
        highlights: [],
        tools: [],
      };
    }
    return entries[slug];
  };

  for (const [key, value] of Object.entries(snapshot)) {
    const parts = key.split(':'); // adr2030 : kind : slug : ...
    const kind = parts[1];
    const slug = parts[2];
    if (!slug) continue;
    if (kind === 'bookmark') ensure(slug).bookmarked = !!value;
    else if (kind === 'note' && typeof value === 'string' && value.trim()) ensure(slug).note = value;
    else if (kind === 'highlights' && Array.isArray(value) && value.length) ensure(slug).highlights = value as string[];
    else if (kind === 'tool') {
      const sum = summarize(value);
      if (sum) ensure(slug).tools.push({ sub: parts[3] ?? '', value });
    }
  }

  const list = Object.values(entries).sort((a, b) => a.number - b.number);
  const hasData = list.length > 0;

  const buildHtml = () => {
    const blocks = list
      .map((e) => {
        const bits: string[] = [`<h2>${e.number}. ${e.title}${e.bookmarked ? ' ★' : ''}</h2>`];
        if (e.note) bits.push(`<p><strong>Note:</strong> ${e.note}</p>`);
        if (e.highlights.length)
          bits.push(`<p><strong>Highlights:</strong></p><ul>${e.highlights.map((h) => `<li>“${h}”</li>`).join('')}</ul>`);
        if (e.tools.length)
          bits.push(
            `<p><strong>Tool results:</strong></p><ul>${e.tools
              .map((t) => `<li>${t.sub}: ${summarize(t.value)}</li>`)
              .join('')}</ul>`,
          );
        return bits.join('');
      })
      .join('');
    return `<h1>My Research Dossier</h1><p class="meta">${SITE.title} — ${new Date().toLocaleString()}</p>${blocks}`;
  };

  const exportJson = () => {
    const blob = new Blob([JSON.stringify(snapshot, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'adr2030-research.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const importJson = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        importAll(JSON.parse(String(reader.result)));
        refresh();
      } catch {
        alert('Could not read that file.');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div>
      <div className="mb-6 flex flex-wrap gap-2">
        <Btn onClick={() => printDocument('My Research Dossier', buildHtml())}>Print / Save as PDF</Btn>
        <Btn variant="ghost" onClick={exportJson}>Export (JSON)</Btn>
        <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50">
          Import
          <input type="file" accept="application/json" onChange={importJson} className="hidden" />
        </label>
        <Btn
          variant="ghost"
          onClick={() => {
            if (confirm('Clear all saved research from this browser?')) {
              clearAll();
              refresh();
            }
          }}
        >
          Clear all
        </Btn>
      </div>

      {!hasData ? (
        <p className="rounded-lg border border-slate-200 bg-slate-50 p-6 text-center text-slate-500">
          Nothing saved yet. Bookmark sections, add notes, save highlights, or use the
          interactive tools — your work will collect here automatically.
        </p>
      ) : (
        <div className="space-y-6">
          {list.map((e) => (
            <section key={e.slug} className="rounded-xl border border-slate-200 bg-white p-5">
              <h2 className="text-lg font-semibold text-slate-800">
                <a href={`/sections/${e.slug}`} className="hover:underline">
                  {e.number}. {e.title}
                </a>{' '}
                {e.bookmarked && <span className="text-amber-500">★</span>}
              </h2>
              {e.note && <p className="mt-2 text-sm text-slate-700"><strong>Note:</strong> {e.note}</p>}
              {e.highlights.length > 0 && (
                <ul className="mt-2 space-y-1">
                  {e.highlights.map((h, i) => (
                    <li key={i} className="border-l-2 border-amber-300 pl-2 text-sm italic text-slate-600">
                      “{h}”
                    </li>
                  ))}
                </ul>
              )}
              {e.tools.length > 0 && (
                <ul className="mt-2 space-y-1 text-sm text-slate-600">
                  {e.tools.map((t, i) => (
                    <li key={i}><span className="font-medium text-slate-700">{t.sub}:</span> {summarize(t.value)}</li>
                  ))}
                </ul>
              )}
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
