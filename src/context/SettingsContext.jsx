import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { loadSettings, saveSettings } from '../services/storage.js';
import { sound } from '../services/sound.js';

const SettingsContext = createContext(null);

export function SettingsProvider({ children }) {
  const [settings, setSettings] = useState(loadSettings);

  useEffect(() => {
    sound.configure(settings);
    document.documentElement.dataset.motion = settings.reduceMotion ? 'reduced' : 'full';
  }, [settings]);

  const update = useCallback((patch) => {
    setSettings((prev) => {
      const next = { ...prev, ...patch };
      saveSettings(next);
      return next;
    });
  }, []);

  const value = useMemo(() => ({ settings, update }), [settings, update]);
  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

export const useSettings = () => useContext(SettingsContext);
