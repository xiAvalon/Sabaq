import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { loadProfile, loadSettings, saveProfile, saveSettings } from '../services/storage.js';
import { sound } from '../services/sound.js';
import { applyTheme, readTheme } from '../services/theme.js';

const SettingsContext = createContext(null);

export function SettingsProvider({ children }) {
  const [settings, setSettings] = useState(loadSettings);
  const [profile, setProfile] = useState(loadProfile);
  const [theme, setThemeState] = useState(readTheme);

  const setTheme = useCallback((next) => setThemeState(applyTheme(next)), []);
  const toggleTheme = useCallback(() => setThemeState((t) => applyTheme(t === 'dark' ? 'light' : 'dark')), []);

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

  const updateProfile = useCallback((patch) => {
    setProfile((prev) => {
      const next = { ...prev, ...patch };
      saveProfile(next);
      return next;
    });
  }, []);

  const value = useMemo(
    () => ({ settings, update, profile, updateProfile, theme, setTheme, toggleTheme }),
    [settings, update, profile, updateProfile, theme, setTheme, toggleTheme],
  );
  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

export const useSettings = () => useContext(SettingsContext);
