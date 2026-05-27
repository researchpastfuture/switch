import { useState } from 'react';
import { ToolShell } from './primitives';
import type { ToolProps } from './types';
import type { Concept } from '../../data/tools/concepts';

export default function ConceptExplorer({ data, title }: ToolProps) {
  const concepts = data as Concept[];
  const [open, setOpen] = useState<string | null>(concepts[0]?.id ?? null);

  return (
    <ToolShell title={title}>
      <ul className="space-y-2">
        {concepts.map((c) => {
          const expanded = open === c.id;
          return (
            <li key={c.id} className="overflow-hidden rounded-lg border border-slate-200 bg-white">
              <button
                onClick={() => setOpen(expanded ? null : c.id)}
                aria-expanded={expanded}
                className="flex w-full items-center justify-between px-4 py-3 text-left font-medium text-slate-800 hover:bg-slate-50"
              >
                {c.term}
                <span className="text-slate-400">{expanded ? '–' : '+'}</span>
              </button>
              {expanded && (
                <div className="border-t border-slate-100 px-4 py-3 text-sm">
                  <p className="text-slate-700">{c.definition}</p>
                  <p className="mt-2 font-medium text-slate-600">Described indicators:</p>
                  <ul className="mt-1 list-disc pl-5 text-slate-600">
                    {c.indicators.map((ind) => (
                      <li key={ind}>{ind}</li>
                    ))}
                  </ul>
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </ToolShell>
  );
}
