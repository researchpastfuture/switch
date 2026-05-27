import { useLocalStore } from '../../lib/store';
import { printDocument } from '../../lib/print';
import { ToolShell, Btn } from './primitives';
import type { ToolProps } from './types';
import type { PledgeData } from '../../data/tools/pledge';
import { SITE } from '../../data/site';

export default function PledgeTracker({ data, title, slug }: ToolProps) {
  const cfg = data as PledgeData;
  const { value: state, setValue: setState } = useLocalStore<{ name: string; chosen: string[] }>(
    ['tool', slug, 'pledge'],
    { name: '', chosen: [] },
  );

  const toggle = (id: string) =>
    setState({
      ...state,
      chosen: state.chosen.includes(id)
        ? state.chosen.filter((c) => c !== id)
        : [...state.chosen, id],
    });

  const selected = cfg.commitments.filter((c) => state.chosen.includes(c.id));

  const print = () => {
    const items = selected.map((c) => `<li>${c.text}</li>`).join('');
    printDocument(
      'Renewal Pledge',
      `<h1>Renewal Pledge</h1><p class="meta">${SITE.title}</p><p>${cfg.intro}</p>` +
        `<ul>${items}</ul>` +
        (state.name ? `<p style="margin-top:2rem">Signed: <strong>${state.name}</strong></p>` : '') +
        `<p class="meta">${new Date().toLocaleDateString()}</p>`,
    );
  };

  return (
    <ToolShell
      title={title}
      actions={<Btn onClick={print}>Print / Save as PDF</Btn>}
    >
      <p className="mb-3 text-sm text-slate-600">{cfg.intro}</p>
      <ul className="space-y-2">
        {cfg.commitments.map((c) => (
          <li key={c.id}>
            <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-slate-200 bg-white p-3">
              <input
                type="checkbox"
                checked={state.chosen.includes(c.id)}
                onChange={() => toggle(c.id)}
                className="h-4 w-4"
              />
              <span className="text-sm text-slate-700">{c.text}</span>
            </label>
          </li>
        ))}
      </ul>
      <label className="mt-4 block text-sm font-medium text-slate-700">
        Your name (optional)
        <input
          type="text"
          value={state.name}
          onChange={(e) => setState({ ...state, name: e.target.value })}
          className="mt-1 block w-full max-w-sm rounded border border-slate-300 px-2 py-1"
        />
      </label>
    </ToolShell>
  );
}
