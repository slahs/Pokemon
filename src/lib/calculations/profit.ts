export type ProfitInput = {
  /** Preise aller bewerteten Karten; null = kein Marktpreis verfuegbar */
  cardPrices: (number | null)[];
  packPurchasePrice: number;
  sellingFeePercentage: number; // z. B. 0.05 fuer 5 %
  fixedSellingCosts: number;
};

export type ProfitResult = {
  grossCardValue: number;
  grossProfitLoss: number;
  percentageSellingFees: number;
  fixedSellingCosts: number;
  netCardValue: number;
  netProfitLoss: number;
  /** null, wenn Kaufpreis 0 ist (kein gueltiger ROI moeglich) */
  roi: number | null;
  missingPriceCount: number;
  pricedCardCount: number;
  incomplete: boolean;
};

function round2(v: number): number {
  return Math.round((v + Number.EPSILON) * 100) / 100;
}

/**
 * Gewinn-/Verlustrechnung.
 * Fehlende Preise werden getrennt gezaehlt und niemals als 0 gewertet.
 */
export function calculateProfit(input: ProfitInput): ProfitResult {
  const priced = input.cardPrices.filter((p): p is number => p !== null && Number.isFinite(p));
  const missingPriceCount = input.cardPrices.length - priced.length;

  const grossCardValue = round2(priced.reduce((sum, p) => sum + p, 0));
  const grossProfitLoss = round2(grossCardValue - input.packPurchasePrice);
  const percentageSellingFees = round2(grossCardValue * input.sellingFeePercentage);
  const fixedSellingCosts = round2(input.fixedSellingCosts);
  const netCardValue = round2(grossCardValue - percentageSellingFees - fixedSellingCosts);
  const netProfitLoss = round2(netCardValue - input.packPurchasePrice);
  const roi =
    input.packPurchasePrice > 0
      ? round2((netProfitLoss / input.packPurchasePrice) * 100)
      : null;

  return {
    grossCardValue,
    grossProfitLoss,
    percentageSellingFees,
    fixedSellingCosts,
    netCardValue,
    netProfitLoss,
    roi,
    missingPriceCount,
    pricedCardCount: priced.length,
    incomplete: missingPriceCount > 0,
  };
}
