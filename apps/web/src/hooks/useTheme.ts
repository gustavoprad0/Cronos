import { useEffect, useState } from 'react';

type Theme = 'light' | 'dark';
const key = 'cronos-theme';
function initialTheme(): Theme {
  let saved: string | null = null;
  try { saved = localStorage.getItem(key); } catch { /* Use the system preference. */ }
  return saved === 'light' || saved === 'dark'
    ? saved
    : window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export function initializeTheme() {
  document.documentElement.dataset.theme = initialTheme();
}

export function useTheme() {
  const [theme, setTheme] = useState<Theme>(initialTheme);
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    try { localStorage.setItem(key, theme); } catch { /* The selected theme still applies to this session. */ }
  }, [theme]);
  useEffect(() => {
    const onStorage = (event: StorageEvent) => {
      if (event.key === key && (event.newValue === 'light' || event.newValue === 'dark')) setTheme(event.newValue);
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);
  return { theme, toggleTheme: () => setTheme(current => current === 'light' ? 'dark' : 'light') };
}
