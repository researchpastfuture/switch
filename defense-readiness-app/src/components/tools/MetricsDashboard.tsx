import { useLocalStore } from '../../lib/store';
import { ProgressBar, ToolShell, CopyButton } from './primitives';
import type { ToolProps } from './types';
import type { Metric } from '../../data/tools/metrics';

function pct(m: Metric): number {
  const span = m.target - m.baseline;
  if (span === 0) return 100;
  return ((m.current - m.baseline) / span) * 100;
}

export default function MetricsDashboard({ data, title, slug }: ToolProps) {
  const metrics = data as Metric[];
  // Visitor notes per metric, saved locally and surfaced in the Dossier.
  const { value: notes, setValue: setNotes } = useLocalStore<Record<string, string>>(
    ['tool', slug, 'notes'],
    {},
  );

  const summary = metrics
    .map((m) => `${m.label}: ${m.current.toLocaleString()} / ${m.target.toLocaleString()} ${m.unit} (${Math.round(pct(m))}%)`)
    .join('\n');

  return (
    <ToolShell
      title={title}
      actions={<CopyButton getText={() => summary} label="Copy summary" />}
    >
      <ul className="space-y-5">
        {metrics.map((m) => (
          <li key={m.id}>
            <div className="mb-1 flex items-baseline justify-between text-sm">
              <span className="font-medium text-slate-800">{m.label}</span>
              <span className="text-slate-500">
                {m.current.toLocaleString()} / {m.target.toLocaleString()} {m.unit}
              </span>
            </div>
            <ProgressBar pct={pct(m)} />
            <input
              type="text"
              value={notes[m.id] ?? ''}
              onChange={(e) => setNotes({ ...notes, [m.id]: e.target.value })}
              placeholder="Add a note…"
              className="mt-2 w-full rounded border border-slate-200 px-2 py-1 text-sm"
            />
          </li>
        ))}
      </ul>
    </ToolShell>
  );
}
