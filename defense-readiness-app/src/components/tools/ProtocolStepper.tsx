import { useLocalStore } from '../../lib/store';
import { ProgressBar, ToolShell, Btn } from './primitives';
import type { ToolProps } from './types';
import type { ProtocolData } from '../../data/tools/rescueProtocol';

export default function ProtocolStepper({ data, title, slug }: ToolProps) {
  const { steps } = data as ProtocolData;
  const { value: done, setValue: setDone } = useLocalStore<Record<string, boolean>>(
    ['tool', slug, 'steps'],
    {},
  );

  const completed = steps.filter((s) => done[s.id]).length;
  const pct = (completed / steps.length) * 100;

  return (
    <ToolShell
      title={title}
      actions={<Btn variant="ghost" onClick={() => setDone({})}>Reset</Btn>}
    >
      <div className="mb-1 flex justify-between text-sm text-slate-600">
        <span>{completed} of {steps.length} steps complete</span>
        <span>{Math.round(pct)}%</span>
      </div>
      <ProgressBar pct={pct} color="#16a34a" />

      <ol className="mt-4 space-y-2">
        {steps.map((step, i) => (
          <li
            key={step.id}
            className={`rounded-lg border p-3 ${
              done[step.id] ? 'border-green-200 bg-green-50' : 'border-slate-200 bg-white'
            }`}
          >
            <label className="flex cursor-pointer items-start gap-3">
              <input
                type="checkbox"
                checked={!!done[step.id]}
                onChange={() => setDone({ ...done, [step.id]: !done[step.id] })}
                className="mt-1 h-4 w-4"
              />
              <span>
                <span className="font-medium text-slate-800">
                  {i + 1}. {step.title}
                </span>
                <span className="block text-sm text-slate-600">{step.detail}</span>
              </span>
            </label>
          </li>
        ))}
      </ol>
    </ToolShell>
  );
}
