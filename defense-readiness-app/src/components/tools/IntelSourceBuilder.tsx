import { useUrlState } from '../../lib/urlState';
import { ToolShell, CopyButton, ProgressBar } from './primitives';
import type { ToolProps } from './types';
import type { IntelSourceSet } from '../../data/tools/intelSources';

export default function IntelSourceBuilder({ data, title }: ToolProps) {
  const set = data as IntelSourceSet;
  const { value: selected, setValue: setSelected, shareUrl } = useUrlState<string[]>([]);

  const toggle = (id: string) =>
    setSelected(selected.includes(id) ? selected.filter((s) => s !== id) : [...selected, id]);

  const covered = new Set(
    set.sources.filter((s) => selected.includes(s.id)).map((s) => s.category),
  );
  const coveragePct = (covered.size / set.categories.length) * 100;
  const gaps = set.categories.filter((c) => !covered.has(c));

  return (
    <ToolShell title={title} actions={<CopyButton getText={() => shareUrl()} label="Copy share link" />}>
      <p className="mb-1 text-sm text-slate-600">
        Coverage: {covered.size} of {set.categories.length} categories
      </p>
      <ProgressBar pct={coveragePct} color="#9333ea" />
      {gaps.length > 0 && (
        <p className="mt-1 text-sm text-amber-700">Gaps: {gaps.join(', ')}</p>
      )}

      <ul className="mt-4 grid gap-2 sm:grid-cols-2">
        {set.sources.map((s) => {
          const on = selected.includes(s.id);
          return (
            <li key={s.id}>
              <button
                onClick={() => toggle(s.id)}
                className={`w-full rounded-lg border p-3 text-left ${
                  on ? 'border-purple-500 bg-purple-50' : 'border-slate-200 bg-white'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium text-slate-800">{s.name}</span>
                  <span className="rounded bg-slate-100 px-1.5 py-0.5 text-xs text-slate-600">
                    {s.kind}
                  </span>
                </div>
                <p className="text-xs text-slate-500">{s.category} — {s.description}</p>
              </button>
            </li>
          );
        })}
      </ul>
    </ToolShell>
  );
}
