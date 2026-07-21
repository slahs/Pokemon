import type {
  CardFinish,
  NormalizedCard,
  PriceMode,
  PriceVariants,
  ResolvedPrice,
} from "@/types";

export const PRICE_MODE_LABELS: Record<PriceMode, string> = {
  trend: "Cardmarket-Trendpreis",
  average: "Durchschnittspreis",
  avg1: "Durchschnitt (24 Stunden)",
  avg7: "Durchschnitt (7 Tage)",
  avg30: "Durchschnitt (30 Tage)",
  low: "Niedrigster Preis",
};

export const PRICE_FIELD_LABELS: Record<keyof PriceVariants, string> = {
  trend: "Trend",
  average: "Durchschnitt",
  avg1: "24-h-Durchschnitt",
  avg7: "7-Tage-Durchschnitt",
  avg30: "30-Tage-Durchschnitt",
  low: "Niedrigster Preis",
};

const MODE_TO_FIELD: Record<PriceMode, keyof PriceVariants> = {
  trend: "trend",
  average: "average",
  avg1: "avg1",
  avg7: "avg7",
  avg30: "avg30",
  low: "low",
};

/**
 * Fallback-Reihenfolge laut Anforderung:
 * gewuenschtes Feld -> avg7 -> avg30 -> average -> low -> kein Preis.
 */
function fallbackChain(primary: keyof PriceVariants): (keyof PriceVariants)[] {
  const chain: (keyof PriceVariants)[] = [primary, "avg7", "avg30", "average", "low"];
  return chain.filter((field, i) => chain.indexOf(field) === i);
}

function resolveFromVariants(
  variants: PriceVariants,
  mode: PriceMode,
): { price: number; field: keyof PriceVariants; fallback: boolean } | null {
  const primary = MODE_TO_FIELD[mode];
  for (const field of fallbackChain(primary)) {
    const value = variants[field];
    if (value !== null && value !== undefined) {
      return { price: value, field, fallback: field !== primary };
    }
  }
  return null;
}

/**
 * Zentrale Preisaufloesung fuer eine Karte in einer bestimmten Variante.
 * Holo/Reverse nutzen die Holo-Felder; fehlt dort ein Marktpreis,
 * wird auf die Standardvariante zurueckgefallen (usedFallbackFinish = true).
 */
export function resolveCardPrice(
  card: NormalizedCard,
  finish: CardFinish,
  selectedPriceMode: PriceMode,
): ResolvedPrice {
  const finishOrder: CardFinish[] =
    finish === "normal" ? ["normal"] : [finish, "normal"];

  for (const tryFinish of finishOrder) {
    const variants = card.prices[tryFinish];
    if (!variants) continue;
    const result = resolveFromVariants(variants, selectedPriceMode);
    if (result) {
      return {
        price: result.price,
        usedField: result.field,
        usedFinish: tryFinish,
        usedFallbackField: result.fallback,
        usedFallbackFinish: tryFinish !== finish,
        updatedAt: card.pricingUpdatedAt,
        missing: false,
      };
    }
  }

  return {
    price: null,
    usedField: null,
    usedFinish: null,
    usedFallbackField: false,
    usedFallbackFinish: false,
    updatedAt: card.pricingUpdatedAt,
    missing: true,
  };
}
