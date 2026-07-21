import { describe, expect, it } from "vitest";
import { computeSessionStats } from "@/lib/calculations/session-stats";
import type { BoosterRecord } from "@/types";

function rec(net: number, gross: number, value: number, cost: number, roi: number | null): BoosterRecord {
  return {
    id: `r-${Math.random()}`,
    openedAt: new Date().toISOString(),
    setId: "sv04.5",
    setName: "Paldeas Schicksale",
    profileId: "sv-special",
    packPurchasePrice: cost,
    priceMode: "trend",
    grossCardValue: value,
    grossProfitLoss: gross,
    netCardValue: value,
    netProfitLoss: net,
    roi,
    missingPriceCount: 1,
    bestCard: null,
    cards: [],
  };
}

describe("Session-Summen", () => {
  it("liefert null fuer leere Sessions", () => {
    expect(computeSessionStats([])).toBeNull();
  });

  it("summiert und mittelt korrekt", () => {
    const stats = computeSessionStats([
      rec(2, 3, 7, 4, 50),
      rec(-1, -0.5, 3.5, 4, -25),
    ]);
    expect(stats).not.toBeNull();
    expect(stats?.count).toBe(2);
    expect(stats?.totalCost).toBe(8);
    expect(stats?.totalValue).toBe(10.5);
    expect(stats?.totalNet).toBe(1);
    expect(stats?.avgValue).toBe(5.25);
    expect(stats?.avgRoi).toBe(12.5);
    expect(stats?.breakEvenRate).toBe(50);
    expect(stats?.missingPrices).toBe(2);
    expect(stats?.best?.netProfitLoss).toBe(2);
    expect(stats?.worst?.netProfitLoss).toBe(-1);
  });
});
