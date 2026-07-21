import "server-only";
import { APP_CONFIG } from "@/config/app-config";
import { fetchJsonWithRetry } from "@/lib/api/http";
import { normalizeCard, normalizeSetSummary } from "@/lib/api/normalize";
import {
  tcgdexCardDetailSchema,
  tcgdexSetDetailSchema,
  tcgdexSetListSchema,
} from "@/lib/validation/tcgdex-schemas";
import type { NormalizedCard, NormalizedSetSummary, SetPoolResponse } from "@/types";

const BASE = APP_CONFIG.tcgdexBaseUrl;

/** Laedt die deutsche Setliste, faellt bei Bedarf auf Englisch zurueck. */
export async function fetchSets(): Promise<NormalizedSetSummary[]> {
  const revalidateSeconds = APP_CONFIG.cache.setsSeconds;
  const deRaw = await fetchJsonWithRetry(`${BASE}/de/sets`, { revalidateSeconds }).catch(
    () => null,
  );
  if (deRaw) {
    const parsed = tcgdexSetListSchema.safeParse(deRaw);
    if (parsed.success && parsed.data.length > 0) {
      return parsed.data.map((s) => normalizeSetSummary(s, "de"));
    }
  }
  const enRaw = await fetchJsonWithRetry(`${BASE}/en/sets`, { revalidateSeconds });
  const parsedEn = tcgdexSetListSchema.parse(enRaw ?? []);
  return parsedEn.map((s) => normalizeSetSummary(s, "en"));
}

async function fetchSetDetail(setId: string, lang: "de" | "en") {
  const raw = await fetchJsonWithRetry(`${BASE}/${lang}/sets/${encodeURIComponent(setId)}`, {
    revalidateSeconds: APP_CONFIG.cache.setsSeconds,
  });
  if (raw === null) return null;
  const parsed = tcgdexSetDetailSchema.safeParse(raw);
  return parsed.success ? parsed.data : null;
}

async function fetchCardDetail(cardId: string, lang: "de" | "en") {
  const raw = await fetchJsonWithRetry(`${BASE}/${lang}/cards/${encodeURIComponent(cardId)}`, {
    revalidateSeconds: APP_CONFIG.cache.poolSeconds,
  });
  if (raw === null) return null;
  const parsed = tcgdexCardDetailSchema.safeParse(raw);
  return parsed.success ? parsed.data : null;
}

/** Einfache Concurrency-Begrenzung ohne Zusatz-Dependency. */
async function mapWithConcurrency<T, R>(
  items: T[],
  limit: number,
  fn: (item: T) => Promise<R>,
): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let next = 0;
  async function worker() {
    while (next < items.length) {
      const index = next++;
      const item = items[index];
      if (item === undefined) continue;
      results[index] = await fn(item);
    }
  }
  const workers = Array.from({ length: Math.min(limit, items.length) }, () => worker());
  await Promise.all(workers);
  return results;
}

type PoolCacheEntry = { data: SetPoolResponse; expiresAt: number };
const poolCache = new Map<string, PoolCacheEntry>();

/**
 * Laedt den vollstaendigen Kartenpool eines Sets inklusive Preisen.
 * Deutsche Daten werden bevorzugt, fehlende Karten englisch nachgeladen.
 * Ergebnis wird im Prozess-Speicher gecacht (Serverless-Hinweis in docs/).
 */
export async function fetchSetPool(setId: string): Promise<SetPoolResponse> {
  const cached = poolCache.get(setId);
  if (cached && cached.expiresAt > Date.now()) return cached.data;

  let language: "de" | "en" = "de";
  let detail = await fetchSetDetail(setId, "de");
  if (!detail || detail.cards.length === 0) {
    language = "en";
    detail = await fetchSetDetail(setId, "en");
  }
  if (!detail) {
    throw new Error(`Set ${setId} wurde bei TCGdex nicht gefunden.`);
  }

  const setSummary = normalizeSetSummary(detail, language);
  let englishFallbackCount = 0;

  const cards = await mapWithConcurrency(
    detail.cards,
    APP_CONFIG.api.poolConcurrency,
    async (brief): Promise<NormalizedCard | null> => {
      let card = language === "de" ? await fetchCardDetail(brief.id, "de") : null;
      let cardLang: "de" | "en" = "de";
      if (!card) {
        card = await fetchCardDetail(brief.id, "en");
        cardLang = "en";
        if (card && language === "de") englishFallbackCount++;
      }
      if (!card) return null;
      return normalizeCard(card, setSummary.id, setSummary.name, language === "en" ? "en" : cardLang);
    },
  );

  const data: SetPoolResponse = {
    set: setSummary,
    cards: cards.filter((c): c is NormalizedCard => c !== null),
    loadedAt: new Date().toISOString(),
    englishFallbackCount,
  };

  poolCache.set(setId, { data, expiresAt: Date.now() + APP_CONFIG.cache.poolSeconds * 1000 });
  return data;
}
