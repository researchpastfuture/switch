import { useLocalStore } from '../../lib/store';
import { ProgressBar, ToolShell, Btn } from './primitives';
import type { ToolProps } from './types';
import type { DetoxData } from '../../data/tools/detoxChecklist';

export default function SurveillanceDetoxChecklist({ data, title, slug }: ToolProps) {
  const cfg = data as DetoxData;
  const { value: checked, setValue: setChecked } = useLocalStore<Record<string, boolean>>(
    ['tool', slug, 'detox'],
    {},
  );

  const all = cfg.categories.flatMap((c) => c.items);
  const doneCount = all.filter((i) => checked[i.id]).length;
  const pct = all.length ? (doneCount / all.length) * 100 : 0;

  return (
    <ToolShell title={title} actions={<Btn variant="ghost" onClick={() => setChecked({})}>Reset</Btn>}>
      <div className="mb-1 flex justify-between text-sm text-slate-600">
        <span>{doneCount} of {all.length} complete</span>
        <span>{Math.round(pct)}%</span>
      </div>
      <ProgressBar pct={pct} color="#0891b2" />

      <div className="mt-4 space-y-4">
        {cfg.categories.map((cat) => (
          <div key={cat.id}>
            <h4 className="mb-2 text-sm font-semibold text-slate-700">{cat.label}</h4>
            <ul className="space-y-2">
              {cat.items.map((it) => (
                <li key={it.id}>
                  <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-slate-200 bg-white p-2">
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
          </div>
        ))}
      </div>
    </ToolShell>
  );
}
