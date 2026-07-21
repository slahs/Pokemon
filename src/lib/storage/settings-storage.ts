import { z } from "zod";
import type { PriceMode } from "@/types";

export const SETTINGS_STORAGE_KEY = "boosterbilanz.settings";

export const settingsSchema = z.object({
  version: z.literal(1),
  priceMode: z.enum(["trend", "average", "avg1", "avg7", "avg30", "low"]),
  sellingFeePercent: z.number().min(0).max(100),
  fixedSellingCosts: z.number().min(0),
  bulkThreshold: z.number().min(0),
  defaultPackPrice: z.number().min(0),
  packPricesBySet: z.record(z.string(), z.number().min(0)),
  animationsEnabled: z.boolean(),
  reducedAnimations: z.boolean(),
  soundEnabled: z.boolean(),
  autoReveal: z.boolean(),
  darkMode: z.boolean(),
  autoSaveSession: z.boolean(),
});

export type AppSettings = z.infer<typeof settingsSchema>;

export const DEFAULT_SETTINGS: AppSettings = {
  version: 1,
  priceMode: "trend" satisfies PriceMode,
  sellingFeePercent: 0,
  fixedSellingCosts: 0,
  bulkThreshold: 0.5,
  defaultPackPrice: 4.29,
  packPricesBySet: {},
  animationsEnabled: true,
  reducedAnimations: false,
  soundEnabled: false,
  autoReveal: false,
  darkMode: true,
  autoSaveSession: true,
};

export function migrateSettings(raw: unknown): AppSettings {
  if (raw && typeof raw === "object") {
    const merged = { ...DEFAULT_SETTINGS, ...(raw as Record<string, unknown>), version: 1 };
    const parsed = settingsSchema.safeParse(merged);
    if (parsed.success) return parsed.data;
  }
  return DEFAULT_SETTINGS;
}

export function loadSettings(): AppSettings {
  if (typeof window === "undefined") return DEFAULT_SETTINGS;
  try {
    const raw = window.localStorage.getItem(SETTINGS_STORAGE_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    return migrateSettings(JSON.parse(raw));
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function saveSettings(settings: AppSettings): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
  } catch {
    // ignorieren
  }
}
