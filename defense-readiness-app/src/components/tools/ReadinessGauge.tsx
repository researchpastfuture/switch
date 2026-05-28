import { ProgressBar, ToolShell, CopyButton } from './primitives';
import type { ToolProps } from './types';
import type { ReadinessGauge as Gauge } from '../../data/tools/readiness';

export default function ReadinessGauge({ data, title }: ToolProps) {
  const gauges = data as Gauge[];
  const summary = gauges
    .map((g) => `${g.label}: ${g.value}% (target ${g.target}%)`)
    .join('\n');

  return (
    <ToolShell title={title} actions={<CopyButton getText={() => summary} label="Copy summary" />}>
      <p className="mb-4 text-sm text-slate-600">
        A snapshot framing of national readiness as described by the document. Values are
        illustrative and editable in <code>src/data/tools/readiness.ts</code>.
      </p>
      <ul className="grid gap-4 sm:grid-cols-2">
        {gauges.map((g) => (
          <li key={g.id} className="rounded-lg border border-slate-200 bg-white p-3">
            <div className="mb-1 flex items-baseline justify-between text-sm">
              <span className="font-medium text-slate-800">{g.label}</span>
              <span className="text-slate-500">{g.value}% / {g.target}%</span>
            </div>
            <ProgressBar pct={g.value} color={g.value >= g.target ? '#16a34a' : '#d97706'} />
            {g.note && <p className="mt-1 text-xs text-slate-500">{g.note}</p>}
          </li>
        ))}
      </ul>
    </ToolShell>
  );
}
