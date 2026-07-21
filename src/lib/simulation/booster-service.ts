import type {
  BoosterRecord,
  BoosterResultCard,
  DrawnCard,
  NormalizedCard,
  PriceMode,
  SimulationProfile,
} from "@/types";
import { drawBooster } from "@/lib/simulation/engine";
import type { Rng } from "@/lib/simulation/rng";
import { resolveCardPrice } from "@/lib/pricing/resolve-card-price";
import { calculateProfit } from "@/lib/calculations/profit";

export type RevealCard = BoosterResultCard & {
  slotLabel: string;
  isBulk: boolean;
  usedFieldLabelFallback: boolean;
};

export function buildRevealCards(
  drawn: DrawnCard[],
  priceMode: PriceMode,
  bulkThreshold: number,
): RevealCard[] {
  return drawn.map(({ card, finish, slotLabel, excludedFromValue }) => {
    const resolved = resolveCardPrice(card, finish, priceMode);
    const price = excludedFromValue ? null : resolved.price;
    return {
      cardId: card.id,
      localId: card.localId,
      name: card.name,
      imageLow: card.imageLow,
      imageHigh: card.imageHigh,
      rarity: card.rarity,
      finish,
      price,
      usedField: resolved.usedField,
      usedFallbackFinish: resolved.usedFallbackFinish,
      updatedAt: resolved.updatedAt,
      language: card.language,
      excludedFromValue,
      slotLabel,
      usedFieldLabelFallback: resolved.usedFallbackField,
      // Bulk nur bei vorhandenem Preis unterhalb der Schwelle.
      // Fehlende Preise und seltene Karten gelten nie automatisch als Bulk.
      isBulk:
        resolved.price !== null &&
        resolved.price < bulkThreshold &&
        isBulkEligibleRarity(card),
    };
  });
}

function isBulkEligibleRarity(card: NormalizedCard): boolean {
  return card.canonicalRarity === "common" || card.canonicalRarity === "uncommon";
}

export function openBooster(
  profile: SimulationProfile,
  pool: NormalizedCard[],
  rng: Rng,
  options: {
    priceMode: PriceMode;
    bulkThreshold: number;
  },
): RevealCard[] {
  const drawn = drawBooster(profile, pool, rng);
  return buildRevealCards(drawn, options.priceMode, options.bulkThreshold);
}

export function buildBoosterRecord(args: {
  cards: RevealCard[];
  setId: string;
  setName: string;
  profileId: string;
  packPurchasePrice: number;
  priceMode: PriceMode;
  sellingFeePercent: number;
  fixedSellingCosts: number;
}): BoosterRecord {
  const valued = args.cards.filter((c) => !c.excludedFromValue);
  const profit = calculateProfit({
    cardPrices: valued.map((c) => c.price),
    packPurchasePrice: args.packPurchasePrice,
    sellingFeePercentage: args.sellingFeePercent / 100,
    fixedSellingCosts: args.fixedSellingCosts,
  });

  const bestCard =
    valued
      .filter((c) => c.price !== null)
      .sort((a, b) => (b.price ?? 0) - (a.price ?? 0))[0] ?? null;

  return {
    id: crypto.randomUUID(),
    openedAt: new Date().toISOString(),
    setId: args.setId,
    setName: args.setName,
    profileId: args.profileId,
    packPurchasePrice: args.packPurchasePrice,
    priceMode: args.priceMode,
    grossCardValue: profit.grossCardValue,
    grossProfitLoss: profit.grossProfitLoss,
    netCardValue: profit.netCardValue,
    netProfitLoss: profit.netProfitLoss,
    roi: profit.roi,
    missingPriceCount: profit.missingPriceCount,
    bestCard,
    cards: args.cards.map((c) => ({
      cardId: c.cardId,
      localId: c.localId,
      name: c.name,
      imageLow: c.imageLow,
      imageHigh: c.imageHigh,
      rarity: c.rarity,
      finish: c.finish,
      price: c.price,
      usedField: c.usedField,
      usedFallbackFinish: c.usedFallbackFinish,
      updatedAt: c.updatedAt,
      language: c.language,
      excludedFromValue: c.excludedFromValue,
    })),
  };
}
