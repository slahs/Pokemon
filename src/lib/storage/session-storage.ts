import { z } from "zod";
import type { BoosterRecord, SessionStateV1 } from "@/types";

export const SESSION_STORAGE_KEY = "boosterbilanz.session";

const resultCardSchema = z.object({
  cardId: z.string(),
  localId: z.string(),
  name: z.string(),
  imageLow: z.string().nullable(),
  imageHigh: z.string().nullable(),
  rarity: z.string().nullable(),
  finish: z.enum(["normal", "reverse", "holo"]),
  price: z.number().nullable(),
  usedField: z.string().nullable(),
  usedFallbackFinish: z.boolean(),
  updatedAt: z.string().nullable(),
  language: z.enum(["de", "en"]),
  excludedFromValue: z.boolean(),
});

const boosterRecordSchema = z.object({
  id: z.string(),
  openedAt: z.string(),
  setId: z.string(),
  setName: z.string(),
  profileId: z.string(),
  packPurchasePrice: z.number(),
  priceMode: z.enum(["trend", "average", "avg1", "avg7", "avg30", "low"]),
  grossCardValue: z.number(),
  grossProfitLoss: z.number(),
  netCardValue: z.number(),
  netProfitLoss: z.number(),
  roi: z.number().nullable(),
  missingPriceCount: z.number(),
  bestCard: resultCardSchema.nullable(),
  cards: z.array(resultCardSchema),
});

const sessionV1Schema = z.object({
  version: z.literal(1),
  boosters: z.array(boosterRecordSchema),
});

export function emptySession(): SessionStateV1 {
  return { version: 1, boosters: [] };
}

/**
 * Versionierte Migration.
 * Unbekannte oder defekte Daten fuehren zu einer leeren Session,
 * niemals zu einem Laufzeitfehler.
 */
export function migrateSession(raw: unknown): SessionStateV1 {
  if (raw === null || raw === undefined) return emptySession();
  if (typeof raw !== "object") return emptySession();
  const version = (raw as { version?: unknown }).version;
  if (version === 1) {
    const parsed = sessionV1Schema.safeParse(raw);
    if (parsed.success) return parsed.data;
    // Teilweise defekte Daten: gueltige Booster retten.
    const boosters = (raw as { boosters?: unknown }).boosters;
    if (Array.isArray(boosters)) {
      const valid = boosters
        .map((b) => boosterRecordSchema.safeParse(b))
        .filter((r) => r.success)
        .map((r) => r.data);
      return { version: 1, boosters: valid };
    }
  }
  return emptySession();
}

export function loadSession(): SessionStateV1 {
  if (typeof window === "undefined") return emptySession();
  try {
    const raw = window.localStorage.getItem(SESSION_STORAGE_KEY);
    if (!raw) return emptySession();
    return migrateSession(JSON.parse(raw));
  } catch {
    return emptySession();
  }
}

export function saveSession(state: SessionStateV1): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Speicher voll oder blockiert: Anwendung laeuft ohne Persistenz weiter.
  }
}

export function appendBooster(record: BoosterRecord): SessionStateV1 {
  const current = loadSession();
  const next: SessionStateV1 = { version: 1, boosters: [...current.boosters, record] };
  saveSession(next);
  return next;
}

export function clearSession(): SessionStateV1 {
  const next = emptySession();
  saveSession(next);
  return next;
}
