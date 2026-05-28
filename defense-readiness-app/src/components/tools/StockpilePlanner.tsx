import { useUrlState } from '../../lib/urlState';
import { ToolShell, CopyButton } from './primitives';
import type { ToolProps } from './types';
import type { StockpileData } from '../../data/tools/stockpile';

export default function StockpilePlanner({ data, title }: ToolProps) {
  const cfg = data as StockpileData;
  const { value: population, setValue: setPopulation, shareUrl } = useUrlState<number>(
    cfg.defaultPopulation,
  );

  const rows = cfg.items.map((it) => ({
    ...it,
    qty: Math.round((population * it.perThousand) / 1000),
  }));

  return (
    <ToolShell title={title} actions={<CopyButton getText={() => shareUrl()} label="Copy share link" />}>
      <label className="block text-sm font-medium text-slate-700">
        Population served
        <input
          type="number"
          min={0}
          value={population}
          onChange={(e) => setPopulation(Math.max(0, Number(e.target.value) || 0))}
          className="mt-1 block w-48 rounded border border-slate-300 px-2 py-1"
        />
      </label>

      <table className="mt-4 w-full text-sm">
        <thead>
          <tr className="border-b border-slate-200 text-left text-slate-500">
            <th className="py-2">Item</th>
            <th className="py-2 text-right">Recommended</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id} className="border-b border-slate-100">
              <td className="py-2 text-slate-700">{r.label}</td>
              <td className="py-2 text-right font-medium text-slate-800">
                {r.qty.toLocaleString()} {r.unit}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </ToolShell>
  );
}
