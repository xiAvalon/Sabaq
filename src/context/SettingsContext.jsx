import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { loadProfile, loadSettings, saveProfile, saveSettings } from '../services/storage.js';
import { sound } from '../services/sound.js';

const SettingsContext = createContext(null);

export function SettingsProvider({ children }) {
  const [settings, setSettings] = useState(loadSettings);
  const [profile, setProfile] = useState(loadProfile);

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

  const value = useMemo(() => ({ settings, update, profile, updateProfile }), [settings, update, profile, updateProfile]);
  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

export const useSettings = () => useContext(SettingsContext);
