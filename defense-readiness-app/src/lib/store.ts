// Shared client-side persistence used by every interactive tool and the research toolkit.
// One namespace, JSON-serializable values, so the Dossier page can read everything back.
import { useCallback, useEffect, useState } from 'react';

const NS = 'adr2030';

export function storeKey(parts: string[]): string {
  return [NS, ...parts].join(':');
}

function read<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    return raw === null ? fallback : (JSON.parse(raw) as T);
  } catch {
    return fallback;
  }
}

/** Persisted React state. `parts` namespaces the key (e.g. ['tool', slug]). */
export function useLocalStore<T>(parts: string[], initial: T) {
  const key = storeKey(parts);
  const [value, setValue] = useState<T>(initial);
  const [hydrated, setHydrated] = useState(false);

  // Read after mount to avoid SSR / hydration mismatch.
  useEffect(() => {
    setValue(read<T>(key, initial));
    setHydrated(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  useEffect(() => {
    if (!hydrated || typeof window === 'undefined') return;
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
      window.dispatchEvent(new CustomEvent('adr-store-change', { detail: { key } }));
    } catch {
      /* ignore quota errors */
    }
  }, [key, value, hydrated]);

  const reset = useCallback(() => setValue(initial), [initial]);
  return { value, setValue, reset, hydrated } as const;
}

/** Snapshot of every stored key — used by the Dossier and export/import. */
export function readAll(): Record<string, unknown> {
  if (typeof window === 'undefined') return {};
  const out: Record<string, unknown> = {};
  for (let i = 0; i < window.localStorage.length; i++) {
    const k = window.localStorage.key(i);
    if (!k || !k.startsWith(NS + ':')) continue;
    try {
      out[k] = JSON.parse(window.localStorage.getItem(k) as string);
    } catch {
      /* skip */
    }
  }
  return out;
}

export function importAll(data: Record<string, unknown>): void {
  if (typeof window === 'undefined') return;
  for (const [k, v] of Object.entries(data)) {
    if (!k.startsWith(NS + ':')) continue;
    window.localStorage.setItem(k, JSON.stringify(v));
  }
  window.dispatchEvent(new CustomEvent('adr-store-change', { detail: { key: '*' } }));
}

export function clearAll(): void {
  if (typeof window === 'undefined') return;
  const keys: string[] = [];
  for (let i = 0; i < window.localStorage.length; i++) {
    const k = window.localStorage.key(i);
    if (k && k.startsWith(NS + ':')) keys.push(k);
  }
  keys.forEach((k) => window.localStorage.removeItem(k));
  window.dispatchEvent(new CustomEvent('adr-store-change', { detail: { key: '*' } }));
}
