import { useUrlState } from '../../lib/urlState';
import { ToolShell, CopyButton } from './primitives';
import type { ToolProps } from './types';
import type { ThreatMapData, ThreatMarker } from '../../data/tools/threats';

const SEV_COLOR: Record<number, string> = { 1: '#16a34a', 2: '#d97706', 3: '#dc2626' };

export default function ThreatMap({ data, title }: ToolProps) {
  const map = data as ThreatMapData;
  // Shareable filter state: which categories are active + selected marker.
  const { value: state, setValue: setState, shareUrl } = useUrlState<{
    active: string[];
    selected: string | null;
  }>({ active: [...map.categories], selected: null });

  const toggle = (cat: string) =>
    setState({
      ...state,
      active: state.active.includes(cat)
        ? state.active.filter((c) => c !== cat)
        : [...state.active, cat],
    });

  const visible = map.markers.filter((m) => state.active.includes(m.category));
  const selected = map.markers.find((m) => m.id === state.selected) ?? null;

  return (
    <ToolShell
      title={title}
      actions={<CopyButton getText={() => shareUrl()} label="Copy share link" />}
    >
      <div className="mb-3 flex flex-wrap gap-2">
        {map.categories.map((cat) => (
          <button
            key={cat}
            onClick={() => toggle(cat)}
            className={`rounded-full border px-3 py-1 text-sm ${
              state.active.includes(cat)
                ? 'border-blue-600 bg-blue-600 text-white'
                : 'border-slate-300 bg-white text-slate-600'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      <div className="relative w-full overflow-hidden rounded-lg border border-slate-300 bg-slate-100"
        style={{ aspectRatio: '16 / 10' }}>
        {/* Simplified US silhouette placeholder. Replace with an SVG/image in /public if desired. */}
        <svg viewBox="0 0 160 100" className="h-full w-full text-slate-300" preserveAspectRatio="none">
          <path
            fill="currentColor"
            d="M10 35 L40 28 L70 25 L120 24 L150 30 L150 45 L140 60 L120 72 L95 80 L70 78 L55 70 L40 72 L25 60 L14 50 Z"
          />
        </svg>
        {visible.map((m: ThreatMarker) => (
          <button
            key={m.id}
            onClick={() => setState({ ...state, selected: m.id })}
            title={m.label}
            aria-label={m.label}
            className="absolute -translate-x-1/2 -translate-y-1/2 rounded-full ring-2 ring-white"
            style={{
              left: `${m.x}%`,
              top: `${m.y}%`,
              width: 10 + m.severity * 4,
              height: 10 + m.severity * 4,
              backgroundColor: SEV_COLOR[m.severity],
            }}
          />
        ))}
      </div>

      {selected ? (
        <div className="mt-3 rounded-lg border border-slate-200 bg-white p-3 text-sm">
          <div className="font-semibold text-slate-800">{selected.label}</div>
          <div className="text-slate-500">
            {selected.category} · severity {selected.severity}
          </div>
          <p className="mt-1 text-slate-700">{selected.detail}</p>
        </div>
      ) : (
        <p className="mt-3 text-sm text-slate-500">Select a marker for details. Toggle categories above to filter.</p>
      )}
    </ToolShell>
  );
}
