import { useMemo, useState } from 'react';
import { ToolShell } from './primitives';
import type { ToolProps } from './types';
import type { AppendixData } from '../../data/tools/glossary';

export default function AppendixExplorer({ data, title }: ToolProps) {
  const cfg = data as AppendixData;
  const [tab, setTab] = useState<'assets' | 'glossary'>('assets');
  const [q, setQ] = useState('');

  const terms = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return cfg.glossary;
    return cfg.glossary.filter(
      (t) => t.term.toLowerCase().includes(needle) || t.definition.toLowerCase().includes(needle),
    );
  }, [q, cfg.glossary]);

  return (
    <ToolShell title={title}>
      <div className="mb-4 flex gap-2">
        {(['assets', 'glossary'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`rounded-md px-3 py-1.5 text-sm font-medium ${
              tab === t ? 'bg-blue-600 text-white' : 'bg-white text-slate-600 border border-slate-300'
            }`}
          >
            {t === 'assets' ? 'Reference Assets' : 'Glossary'}
          </button>
        ))}
      </div>

      {tab === 'assets' ? (
        <ul className="space-y-2">
          {cfg.assets.map((a) => (
            <li key={a.id} className="rounded-lg border border-slate-200 bg-white p-3">
              <a href={a.href} className="font-medium text-blue-700 hover:underline">{a.label}</a>
              <p className="text-sm text-slate-600">{a.description}</p>
            </li>
          ))}
        </ul>
      ) : (
        <div>
          <input
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search glossary…"
            className="mb-3 w-full rounded border border-slate-300 px-3 py-1.5 text-sm"
          />
          <dl className="space-y-2">
            {terms.map((t) => (
              <div key={t.term} className="rounded-lg border border-slate-200 bg-white p-3">
                <dt className="font-medium text-slate-800">{t.term}</dt>
                <dd className="text-sm text-slate-600">{t.definition}</dd>
              </div>
            ))}
            {terms.length === 0 && <p className="text-sm text-slate-500">No matching terms.</p>}
          </dl>
        </div>
      )}
    </ToolShell>
  );
}
