import type {
  CardFinish,
  NormalizedCard,
  NormalizedPrices,
  NormalizedSetSummary,
  PriceVariants,
} from "@/types";
import { canonicalizeRarity } from "@/lib/api/rarity";
import type { TcgdexCardDetail, TcgdexSetBrief } from "@/lib/validation/tcgdex-schemas";

/** Baut aus einer TCGdex-Bild-Basis-URL die konkrete WebP-Variante. */
export function buildImageUrl(
  base: string | null | undefined,
  quality: "low" | "high",
): string | null {
  if (!base) return null;
  return `${base}/${quality}.webp`;
}

function num(v: number | null | undefined): number | null {
  return typeof v === "number" && Number.isFinite(v) ? v : null;
}

export function normalizePrices(card: TcgdexCardDetail): {
  prices: NormalizedPrices;
  updatedAt: string | null;
} {
  const cm = card.pricing?.cardmarket ?? null;
  if (!cm) {
    return { prices: { normal: null, reverse: null, holo: null }, updatedAt: null };
  }

  const normal: PriceVariants = {
    low: num(cm.low),
    average: num(cm.avg),
    trend: num(cm.trend),
    avg1: num(cm.avg1),
    avg7: num(cm.avg7),
    avg30: num(cm.avg30),
  };
  const holoVariant: PriceVariants = {
    low: num(cm["low-holo"]),
    average: num(cm["avg-holo"]),
    trend: num(cm["trend-holo"]),
    avg1: num(cm["avg1-holo"]),
    avg7: num(cm["avg7-holo"]),
    avg30: num(cm["avg30-holo"]),
  };

  const hasNormal = Object.values(normal).some((v) => v !== null);
  const hasHolo = Object.values(holoVariant).some((v) => v !== null);

  return {
    prices: {
      normal: hasNormal ? normal : null,
      // Cardmarket liefert bei TCGdex nur Normal- und Holo-Felder.
      // Reverse Holo wird dem Holo-Feld zugeordnet, sofern vorhanden.
      reverse: hasHolo ? holoVariant : null,
      holo: hasHolo ? holoVariant : null,
    },
    updatedAt: cm.updated ?? null,
  };
}

export function normalizeCard(
  card: TcgdexCardDetail,
  setId: string,
  setName: string,
  language: "de" | "en",
): NormalizedCard {
  const finishes: CardFinish[] = [];
  const v = card.variants ?? {};
  if (v.normal) finishes.push("normal");
  if (v.reverse) finishes.push("reverse");
  if (v.holo) finishes.push("holo");
  if (finishes.length === 0) finishes.push("normal");

  const { prices, updatedAt } = normalizePrices(card);

  return {
    id: card.id,
    localId: card.localId,
    name: card.name,
    setId,
    setName,
    imageLow: buildImageUrl(card.image, "low"),
    imageHigh: buildImageUrl(card.image, "high"),
    rarity: card.rarity ?? null,
    canonicalRarity: canonicalizeRarity(card.rarity),
    category: card.category ?? "Unbekannt",
    availableFinishes: finishes,
    prices,
    pricingUpdatedAt: updatedAt,
    language,
  };
}

export function normalizeSetSummary(
  set: TcgdexSetBrief,
  language: "de" | "en",
): NormalizedSetSummary {
  return {
    id: set.id,
    name: set.name,
    serie: set.serie?.name ?? "Unbekannte Serie",
    releaseDate: set.releaseDate ?? null,
    cardCountOfficial: set.cardCount?.official ?? null,
    cardCountTotal: set.cardCount?.total ?? null,
    logo: set.logo ? `${set.logo}.webp` : null,
    symbol: set.symbol ? `${set.symbol}.webp` : null,
    language,
  };
}
