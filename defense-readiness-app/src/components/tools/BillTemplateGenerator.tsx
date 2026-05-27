import { useLocalStore } from '../../lib/store';
import { printDocument } from '../../lib/print';
import { ToolShell, Btn, CopyButton } from './primitives';
import type { ToolProps } from './types';
import type { BillData } from '../../data/tools/billTemplate';

export default function BillTemplateGenerator({ data, title, slug }: ToolProps) {
  const cfg = data as BillData;
  const { value: state, setValue: setState } = useLocalStore<{
    shortTitle: string;
    jurisdiction: string;
    sponsor: string;
    chosen: string[];
  }>(['tool', slug, 'bill'], {
    shortTitle: '',
    jurisdiction: '',
    sponsor: '',
    chosen: cfg.provisions.map((p) => p.id),
  });

  const toggle = (id: string) =>
    setState({
      ...state,
      chosen: state.chosen.includes(id)
        ? state.chosen.filter((c) => c !== id)
        : [...state.chosen, id],
    });

  const billText = () => {
    const head = `${cfg.titlePrefix}\n${state.shortTitle ? `To be cited as the "${state.shortTitle}".` : ''}`;
    const meta = [
      state.jurisdiction && `Jurisdiction: ${state.jurisdiction}`,
      state.sponsor && `Sponsor: ${state.sponsor}`,
    ]
      .filter(Boolean)
      .join('\n');
    const body = cfg.provisions
      .filter((p) => state.chosen.includes(p.id))
      .map((p) => p.text)
      .join('\n\n');
    return [head, meta, body].filter(Boolean).join('\n\n');
  };

  const print = () =>
    printDocument(
      'Sample Bill',
      `<h1>Sample Bill</h1><pre>${billText().replace(/</g, '&lt;')}</pre>`,
    );

  const field = 'mt-1 block w-full rounded border border-slate-300 px-2 py-1 text-sm';

  return (
    <ToolShell
      title={title}
      actions={
        <>
          <CopyButton getText={billText} label="Copy text" />
          <Btn onClick={print}>Print / Save as PDF</Btn>
        </>
      }
    >
      <div className="grid gap-3 sm:grid-cols-3">
        <label className="text-sm font-medium text-slate-700">
          Short title
          <input className={field} value={state.shortTitle}
            onChange={(e) => setState({ ...state, shortTitle: e.target.value })} />
        </label>
        <label className="text-sm font-medium text-slate-700">
          Jurisdiction
          <input className={field} value={state.jurisdiction}
            onChange={(e) => setState({ ...state, jurisdiction: e.target.value })} />
        </label>
        <label className="text-sm font-medium text-slate-700">
          Sponsor
          <input className={field} value={state.sponsor}
            onChange={(e) => setState({ ...state, sponsor: e.target.value })} />
        </label>
      </div>

      <p className="mt-4 mb-2 text-sm font-medium text-slate-700">Provisions to include</p>
      <ul className="space-y-2">
        {cfg.provisions.map((p) => (
          <li key={p.id}>
            <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-slate-200 bg-white p-2">
              <input type="checkbox" checked={state.chosen.includes(p.id)}
                onChange={() => toggle(p.id)} className="h-4 w-4" />
              <span className="text-sm text-slate-700">{p.label}</span>
            </label>
          </li>
        ))}
      </ul>

      <pre className="mt-4 max-h-64 overflow-auto whitespace-pre-wrap rounded-lg border border-slate-200 bg-white p-3 text-xs text-slate-700">
        {billText()}
      </pre>
    </ToolShell>
  );
}
