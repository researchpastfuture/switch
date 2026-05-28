import { useLocalStore } from '../../lib/store';
import { ProgressBar, ToolShell, Btn } from './primitives';
import type { ToolProps } from './types';
import type { ScoredChecklist } from '../../data/tools/deterrenceChecklist';

export default function RiskChecklist({ data, title, slug }: ToolProps) {
  const list = data as ScoredChecklist;
  const { value: checked, setValue: setChecked } = useLocalStore<Record<string, boolean>>(
    ['tool', slug, 'checked'],
    {},
  );

  const score = list.items.reduce((sum, it) => (checked[it.id] ? sum + it.weight : sum), 0);
  const band = [...list.bands].reverse().find((b) => score >= b.min) ?? list.bands[0];

  return (
    <ToolShell title={title} actions={<Btn variant="ghost" onClick={() => setChecked({})}>Reset</Btn>}>
      <div className="mb-1 flex justify-between text-sm">
        <span className="font-medium text-slate-800">Preparedness score: {score}</span>
        <span className="text-slate-600">{band.label}</span>
      </div>
      <ProgressBar pct={score} />
      <p className="mt-1 text-sm text-slate-500">{band.note}</p>

      <ul className="mt-4 space-y-2">
        {list.items.map((it) => (
          <li key={it.id}>
            <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-slate-200 bg-white p-3">
              <input
                type="checkbox"
                checked={!!checked[it.id]}
                onChange={() => setChecked({ ...checked, [it.id]: !checked[it.id] })}
                className="h-4 w-4"
              />
              <span className="text-sm text-slate-700">{it.label}</span>
            </label>
          </li>
        ))}
      </ul>
    </ToolShell>
  );
}
