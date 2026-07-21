"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import {
  type AppSettings,
  DEFAULT_SETTINGS,
  loadSettings,
  saveSettings,
} from "@/lib/storage/settings-storage";

type SettingsContextValue = {
  settings: AppSettings;
  updateSettings: (patch: Partial<AppSettings>) => void;
  setPackPriceForSet: (setId: string, price: number) => void;
  hydrated: boolean;
};

const SettingsContext = createContext<SettingsContextValue | null>(null);

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setSettings(loadSettings());
    setHydrated(true);
  }, []);

  const updateSettings = useCallback((patch: Partial<AppSettings>) => {
    setSettings((prev) => {
      const next = { ...prev, ...patch };
      saveSettings(next);
      return next;
    });
  }, []);

  const setPackPriceForSet = useCallback((setId: string, price: number) => {
    setSettings((prev) => {
      const next = {
        ...prev,
        packPricesBySet: { ...prev.packPricesBySet, [setId]: price },
      };
      saveSettings(next);
      return next;
    });
  }, []);

  const value = useMemo(
    () => ({ settings, updateSettings, setPackPriceForSet, hydrated }),
    [settings, updateSettings, setPackPriceForSet, hydrated],
  );

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

export function useSettings(): SettingsContextValue {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error("useSettings muss innerhalb von SettingsProvider verwendet werden.");
  return ctx;
}
