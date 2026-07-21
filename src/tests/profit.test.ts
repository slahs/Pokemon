import { describe, expect, it } from "vitest";
import { calculateProfit } from "@/lib/calculations/profit";

describe("calculateProfit", () => {
  it("berechnet Brutto, Netto und ROI korrekt", () => {
    const r = calculateProfit({
      cardPrices: [1, 2, 3],
      packPurchasePrice: 4,
      sellingFeePercentage: 0.1,
      fixedSellingCosts: 0.5,
    });
    expect(r.grossCardValue).toBe(6);
    expect(r.grossProfitLoss).toBe(2);
    expect(r.percentageSellingFees).toBe(0.6);
    expect(r.netCardValue).toBe(4.9);
    expect(r.netProfitLoss).toBeCloseTo(0.9, 2);
    expect(r.roi).toBeCloseTo(22.5, 2);
  });

  it("zaehlt fehlende Preise getrennt und wertet sie nicht als 0", () => {
    const r = calculateProfit({
      cardPrices: [2, null, null, 1],
      packPurchasePrice: 1,
      sellingFeePercentage: 0,
      fixedSellingCosts: 0,
    });
    expect(r.grossCardValue).toBe(3);
    expect(r.missingPriceCount).toBe(2);
    expect(r.pricedCardCount).toBe(2);
    expect(r.incomplete).toBe(true);
  });

  it("liefert bei Kaufpreis 0 keinen ungueltigen ROI", () => {
    const r = calculateProfit({
      cardPrices: [5],
      packPurchasePrice: 0,
      sellingFeePercentage: 0,
      fixedSellingCosts: 0,
    });
    expect(r.roi).toBeNull();
    expect(Number.isFinite(r.netProfitLoss)).toBe(true);
  });

  it("berechnet reine Gebuehrenfaelle korrekt", () => {
    const r = calculateProfit({
      cardPrices: [10],
      packPurchasePrice: 4,
      sellingFeePercentage: 0.05,
      fixedSellingCosts: 1,
    });
    expect(r.percentageSellingFees).toBe(0.5);
    expect(r.netCardValue).toBe(8.5);
    expect(r.netProfitLoss).toBe(4.5);
  });
});
