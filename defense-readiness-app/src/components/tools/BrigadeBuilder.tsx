import { useUrlState } from '../../lib/urlState';
import { ProgressBar, ToolShell, CopyButton } from './primitives';
import type { ToolProps } from './types';
import type { BrigadeData } from '../../data/tools/brigade';

export default function BrigadeBuilder({ data, title }: ToolProps) {
  const cfg = data as BrigadeData;
  const { value: state, setValue: setState, shareUrl } = useUrlState<{
    students: number;
    roster: Record<string, number>;
  }>({ students: cfg.defaultStudents, roster: {} });

  const recommendedFor = (per: number) =>
    Math.ceil((state.students / cfg.studentsPer) * per);

  const totalRec = cfg.roles.reduce((s, r) => s + recommendedFor(r.recommendedPer), 0);
  const totalHave = cfg.roles.reduce((s, r) => s + (state.roster[r.id] ?? 0), 0);
  const readiness = totalRec === 0 ? 100 : Math.min(100, (totalHave / totalRec) * 100);

  return (
    <ToolShell title={title} actions={<CopyButton getText={() => shareUrl()} label="Copy share link" />}>
      <label className="block text-sm font-medium text-slate-700">
        Students
        <input
          type="number"
          min={0}
          value={state.students}
          onChange={(e) =>
            setState({ ...state, students: Math.max(0, Number(e.target.value) || 0) })
          }
          className="mt-1 block w-40 rounded border border-slate-300 px-2 py-1"
        />
      </label>

      <div className="mt-3 mb-1 flex justify-between text-sm text-slate-600">
        <span>Roster readiness</span>
        <span>{Math.round(readiness)}%</span>
      </div>
      <ProgressBar pct={readiness} color="#16a34a" />

      <ul className="mt-4 space-y-3">
        {cfg.roles.map((role) => {
          const rec = recommendedFor(role.recommendedPer);
          const have = state.roster[role.id] ?? 0;
          return (
            <li key={role.id}>
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium text-slate-800">{role.label}</span>
                <span className="text-slate-500">{have} / {rec} recommended</span>
              </div>
              <input
                type="range"
                min={0}
                max={role.max}
                value={have}
                onChange={(e) =>
                  setState({
                    ...state,
                    roster: { ...state.roster, [role.id]: Number(e.target.value) },
                  })
                }
                className="w-full"
              />
            </li>
          );
        })}
      </ul>
    </ToolShell>
  );
}
