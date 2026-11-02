import { useCallback, useState } from 'react';
import type { SetStateAction } from 'react';
import { useAuth } from '../contexts/AuthContext';

/** UI preferences are kept on this browser and separated by account. */
export function usePreference<T>(name: string, fallback: T, validate?: (value: unknown) => value is T) {
  const { user } = useAuth();
  const key = `cronos:preferences:v1:${user?.id ?? 'guest'}:${name}`;
  const [value, setValue] = useState<T>(() => {
    try {
      const raw = localStorage.getItem(key);
      if (raw === null) return fallback;
      const stored: unknown = JSON.parse(raw);
      return (validate ? validate(stored) : typeof stored === typeof fallback) ? stored as T : fallback;
    } catch {
      return fallback;
    }
  });
  const update = useCallback((action: SetStateAction<T>) => {
    setValue(current => {
      const next = typeof action === 'function' ? (action as (previous: T) => T)(current) : action;
      try { localStorage.setItem(key, JSON.stringify(next)); } catch { /* Keep the UI usable when storage is unavailable. */ }
      return next;
    });
  }, [key]);
  return [value, update] as const;
}
