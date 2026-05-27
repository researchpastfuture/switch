import { useState } from 'react';
import { ToolShell, Btn } from './primitives';
import type { ToolProps } from './types';
import type { PathwayData } from '../../data/tools/deprogramming';

export default function DeprogrammingPathway({ data, title }: ToolProps) {
  const cfg = data as PathwayData;
  const [path, setPath] = useState<string[]>([cfg.start]);
  const currentId = path[path.length - 1];
  const node = cfg.nodes[currentId];

  return (
    <ToolShell
      title={title}
      actions={
        path.length > 1 ? (
          <Btn variant="ghost" onClick={() => setPath(path.slice(0, -1))}>Back</Btn>
        ) : undefined
      }
    >
      <p className="mb-3 rounded border border-amber-200 bg-amber-50 p-2 text-xs text-amber-800">
        {cfg.disclaimer}
      </p>

      {node.outcome ? (
        <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
          <p className="font-medium text-slate-800">Suggested next step</p>
          <p className="mt-1 text-sm text-slate-700">{node.outcome}</p>
          <Btn variant="ghost" onClick={() => setPath([cfg.start])}>Start over</Btn>
        </div>
      ) : (
        <div>
          <p className="mb-3 font-medium text-slate-800">{node.prompt}</p>
          <div className="flex flex-wrap gap-2">
            {node.options?.map((opt) => (
              <Btn key={opt.next} onClick={() => setPath([...path, opt.next])}>
                {opt.label}
              </Btn>
            ))}
          </div>
        </div>
      )}
    </ToolShell>
  );
}
