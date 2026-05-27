import { useLocalStore } from '../../lib/store';
import { printDocument } from '../../lib/print';
import { ToolShell, Btn } from './primitives';
import type { ToolProps } from './types';
import type { CovenantData } from '../../data/tools/covenant';
import { SITE } from '../../data/site';

export default function CovenantBuilder({ data, title, slug }: ToolProps) {
  const cfg = data as CovenantData;
  const { value: chosen, setValue: setChosen } = useLocalStore<string[]>(
    ['tool', slug, 'covenant'],
    cfg.principles.map((p) => p.id),
  );

  const toggle = (id: string) =>
    setChosen(chosen.includes(id) ? chosen.filter((c) => c !== id) : [...chosen, id]);

  const selected = cfg.principles.filter((p) => chosen.includes(p.id));

  const print = () =>
    printDocument(
      'A New Covenant',
      `<h1>A New Covenant for a Protected Republic</h1><p class="meta">${SITE.title}</p>` +
        `<p>${cfg.preamble}</p><ul>${selected.map((p) => `<li>${p.text}</li>`).join('')}</ul>` +
        `<p class="meta">${new Date().toLocaleDateString()}</p>`,
    );

  return (
    <ToolShell title={title} actions={<Btn onClick={print}>Print / Save as PDF</Btn>}>
      <p className="mb-3 text-sm text-slate-600">{cfg.preamble}</p>
      <ul className="space-y-2">
        {cfg.principles.map((p) => (
          <li key={p.id}>
            <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-slate-200 bg-white p-3">
              <input type="checkbox" checked={chosen.includes(p.id)}
                onChange={() => toggle(p.id)} className="h-4 w-4" />
              <span className="text-sm text-slate-700">{p.text}</span>
            </label>
          </li>
        ))}
      </ul>
    </ToolShell>
  );
}
