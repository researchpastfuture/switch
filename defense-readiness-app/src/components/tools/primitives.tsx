import { useState, type ReactNode } from 'react';
import { copyToClipboard } from '../../lib/clipboard';

export function ProgressBar({ pct, color = '#2563eb' }: { pct: number; color?: string }) {
  const clamped = Math.max(0, Math.min(100, Math.round(pct)));
  return (
    <div className="h-3 w-full overflow-hidden rounded-full bg-slate-200">
      <div
        className="h-full rounded-full transition-all"
        style={{ width: `${clamped}%`, backgroundColor: color }}
      />
    </div>
  );
}

export function Btn({
  children,
  onClick,
  variant = 'primary',
  type = 'button',
}: {
  children: ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'ghost';
  type?: 'button' | 'submit';
}) {
  const base =
    'inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors';
  const styles =
    variant === 'primary'
      ? 'bg-blue-600 text-white hover:bg-blue-700'
      : 'border border-slate-300 bg-white text-slate-700 hover:bg-slate-50';
  return (
    <button type={type} onClick={onClick} className={`${base} ${styles}`}>
      {children}
    </button>
  );
}

/** Button that copies text and briefly shows a confirmation. */
export function CopyButton({ getText, label = 'Copy' }: { getText: () => string; label?: string }) {
  const [done, setDone] = useState(false);
  return (
    <Btn
      variant="ghost"
      onClick={async () => {
        const ok = await copyToClipboard(getText());
        if (ok) {
          setDone(true);
          setTimeout(() => setDone(false), 1800);
        }
      }}
    >
      {done ? 'Copied!' : label}
    </Btn>
  );
}

/** Consistent wrapper for every interactive tool. */
export function ToolShell({
  title,
  children,
  actions,
}: {
  title?: string;
  children: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <section className="not-prose my-8 rounded-xl border border-slate-200 bg-slate-50 p-5 shadow-sm">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-lg font-semibold text-slate-800">{title ?? 'Interactive Tool'}</h3>
        {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
      </div>
      {children}
    </section>
  );
}
