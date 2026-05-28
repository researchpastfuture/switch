// Shareable tool state: serialize a tool's config into the `?s=` query param so a
// configured view can be shared by URL. Falls back to defaults when absent.
import { useCallback, useEffect, useState } from 'react';

function encode(value: unknown): string {
  try {
    return encodeURIComponent(btoa(unescape(encodeURIComponent(JSON.stringify(value)))));
  } catch {
    return '';
  }
}

function decode<T>(raw: string): T | null {
  try {
    return JSON.parse(decodeURIComponent(escape(atob(decodeURIComponent(raw))))) as T;
  } catch {
    return null;
  }
}

export function useUrlState<T>(initial: T) {
  const [value, setValue] = useState<T>(initial);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const raw = new URLSearchParams(window.location.search).get('s');
    if (raw) {
      const parsed = decode<T>(raw);
      if (parsed !== null) setValue(parsed);
    }
    setHydrated(true);
  }, []);

  /** Build a shareable absolute URL capturing the given (or current) state. */
  const shareUrl = useCallback(
    (state?: T) => {
      if (typeof window === 'undefined') return '';
      const url = new URL(window.location.href);
      url.searchParams.set('s', encode(state ?? value));
      return url.toString();
    },
    [value],
  );

  return { value, setValue, shareUrl, hydrated } as const;
}
