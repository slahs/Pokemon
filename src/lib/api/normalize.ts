import type {
  CardFinish,
  NormalizedBoosterArtwork,
  NormalizedCard,
  NormalizedPrices,
  NormalizedSetSummary,
  PriceVariants,
} from "@/types";
import { canonicalizeRarity } from "@/lib/api/rarity";
import type {
  TcgdexCardDetail,
  TcgdexSetBrief,
  TcgdexSetDetail,
} from "@/lib/validation/tcgdex-schemas";

/** Baut aus einer TCGdex-Bild-Basis-URL die konkrete WebP-Variante. */
export function buildImageUrl(
  base: string | null | undefined,
  quality: "low" | "high",
): string | null {
  if (!base) return null;
  const clean = base.trim().replace(/\/$/, "");

  // TCGdex liefert normalerweise eine Basis-URL ohne Dateiendung. Die
  // Abfrage bleibt aber auch stabil, falls bereits eine fertige Asset-URL
  // geliefert oder in Tests/Mocks hinterlegt wird.
  if (/\/(?:low|high)\.(?:webp|png|jpe?g)(?:\?.*)?$/i.test(clean)) {
    return clean.replace(/\/(?:low|high)\.(?:webp|png|jpe?g)(\?.*)?$/i, `/${quality}.webp$1`);
  }

  return `${clean}/${quality}.webp`;
}

/** Baut eine WebP-URL fuer Setlogos und Setsymbole. */
export function buildSetAssetUrl(base: string | null | undefined): string | null {
  if (!base) return null;
  const clean = base.trim();
  return /\.(?:webp|png|jpe?g)(?:\?.*)?$/i.test(clean) ? clean : `${clean}.webp`;
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
  fallbackImage?: string | null,
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
    imageLow: buildImageUrl(card.image ?? fallbackImage, "low"),
    imageHigh: buildImageUrl(card.image ?? fallbackImage, "high"),
    rarity: card.rarity ?? null,
    canonicalRarity: canonicalizeRarity(card.rarity),
    category: card.category ?? "Unbekannt",
    availableFinishes: finishes,
    prices,
    pricingUpdatedAt: updatedAt,
    language,
  };
}

function normalizeBoosterArtwork(
  booster: TcgdexSetDetail["boosters"][number],
): NormalizedBoosterArtwork {
  return {
    id: booster.id,
    name: booster.name,
    logo: buildSetAssetUrl(booster.logo),
    artworkFront: buildSetAssetUrl(booster.artwork_front),
    artworkBack: buildSetAssetUrl(booster.artwork_back),
  };
}

export function normalizeSetSummary(
  set: TcgdexSetBrief | TcgdexSetDetail,
  language: "de" | "en",
  fallback?: Partial<TcgdexSetDetail> | null,
  releaseOrder: number | null = null,
): NormalizedSetSummary {
  const primaryBoosters = "boosters" in set ? set.boosters : [];
  const boosters = primaryBoosters.length > 0 ? primaryBoosters : (fallback?.boosters ?? []);
  const serie = set.serie ?? fallback?.serie;
  const cardCount = set.cardCount ?? fallback?.cardCount;

  return {
    id: set.id,
    name: set.name,
    serie: serie?.name ?? "Unbekannte Serie",
    releaseDate: set.releaseDate ?? fallback?.releaseDate ?? null,
    cardCountOfficial: cardCount?.official ?? null,
    cardCountTotal: cardCount?.total ?? null,
    logo: buildSetAssetUrl(set.logo ?? fallback?.logo),
    symbol: buildSetAssetUrl(set.symbol ?? fallback?.symbol),
    language,
    releaseOrder,
    boosters: boosters.map(normalizeBoosterArtwork),
  };
}
