import { useState } from 'react';
import { ToolShell } from './primitives';
import type { ToolProps } from './types';
import type { TimelineData, Milestone } from '../../data/tools/timeline';

export default function DeploymentTimeline({ data, title }: ToolProps) {
  const cfg = data as TimelineData;
  const [region, setRegion] = useState<string>('All');
  const [open, setOpen] = useState<string | null>(null);

  const regions = ['All', ...cfg.regions];
  const visible = cfg.milestones.filter((m) => region === 'All' || m.region === region);

  return (
    <ToolShell title={title}>
      <div className="mb-4 flex flex-wrap gap-2">
        {regions.map((r) => (
          <button
            key={r}
            onClick={() => setRegion(r)}
            className={`rounded-full border px-3 py-1 text-sm ${
              region === r ? 'border-blue-600 bg-blue-600 text-white' : 'border-slate-300 bg-white text-slate-600'
            }`}
          >
            {r}
          </button>
        ))}
      </div>

      <ol className="relative border-l-2 border-slate-200 pl-5">
        {visible.map((m: Milestone) => (
          <li key={m.id} className="mb-4">
            <span className="absolute -left-[7px] mt-1.5 h-3 w-3 rounded-full bg-blue-600" />
            <button onClick={() => setOpen(open === m.id ? null : m.id)} className="text-left">
              <div className="text-xs font-medium uppercase text-slate-400">
                {m.phase} · {m.period} · {m.region}
              </div>
              <div className="font-medium text-slate-800">{m.title}</div>
            </button>
            {open === m.id && <p className="mt-1 text-sm text-slate-600">{m.detail}</p>}
          </li>
        ))}
      </ol>
      {visible.length === 0 && <p className="text-sm text-slate-500">No milestones for this region.</p>}
    </ToolShell>
  );
}
