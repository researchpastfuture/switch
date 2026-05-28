import { useUrlState } from '../../lib/urlState';
import { ToolShell, CopyButton } from './primitives';
import type { ToolProps } from './types';
import type { FundData } from '../../data/tools/fundBuckets';

export default function FundAllocationSimulator({ data, title }: ToolProps) {
  const cfg = data as FundData;
  const defaults = Object.fromEntries(cfg.buckets.map((b) => [b.id, b.defaultPct]));
  const { value: alloc, setValue: setAlloc, shareUrl } = useUrlState<Record<string, number>>(
    defaults,
  );

  const total = cfg.buckets.reduce((s, b) => s + (alloc[b.id] ?? 0), 0);

  return (
    <ToolShell title={title} actions={<CopyButton getText={() => shareUrl()} label="Copy share link" />}>
      <p className={`mb-3 text-sm font-medium ${total === 100 ? 'text-green-700' : 'text-amber-700'}`}>
        Total allocated: {total}% {total === 100 ? '✓' : '(aim for 100%)'}
      </p>

      {/* Stacked bar */}
      <div className="mb-4 flex h-6 w-full overflow-hidden rounded-full bg-slate-200">
        {cfg.buckets.map((b) => (
          <div
            key={b.id}
            title={`${b.label}: ${alloc[b.id] ?? 0}%`}
            style={{ width: `${alloc[b.id] ?? 0}%`, backgroundColor: b.color }}
          />
        ))}
      </div>

      <ul className="space-y-3">
        {cfg.buckets.map((b) => (
          <li key={b.id}>
            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-2 font-medium text-slate-800">
                <span className="inline-block h-3 w-3 rounded-sm" style={{ backgroundColor: b.color }} />
                {b.label}
              </span>
              <span className="text-slate-500">{alloc[b.id] ?? 0}%</span>
            </div>
            <input
              type="range"
              min={0}
              max={100}
              value={alloc[b.id] ?? 0}
              onChange={(e) => setAlloc({ ...alloc, [b.id]: Number(e.target.value) })}
              className="w-full"
            />
          </li>
        ))}
      </ul>
    </ToolShell>
  );
}
