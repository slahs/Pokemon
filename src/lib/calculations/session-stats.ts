import type { BoosterRecord } from "@/types";

export type SessionStats = {
  count: number;
  totalCost: number;
  totalValue: number;
  totalGross: number;
  totalNet: number;
  avgValue: number;
  avgRoi: number | null;
  best: BoosterRecord | null;
  worst: BoosterRecord | null;
  bestPull: BoosterRecord["bestCard"];
  breakEvenRate: number;
  missingPrices: number;
};

export function computeSessionStats(list: BoosterRecord[]): SessionStats | null {
  if (list.length === 0) return null;
  const totalCost = list.reduce((s, b) => s + b.packPurchasePrice, 0);
  const totalValue = list.reduce((s, b) => s + b.grossCardValue, 0);
  const totalGross = list.reduce((s, b) => s + b.grossProfitLoss, 0);
  const totalNet = list.reduce((s, b) => s + b.netProfitLoss, 0);
  const rois = list.map((b) => b.roi).filter((r): r is number => r !== null);
  const best = [...list].sort((a, b) => b.netProfitLoss - a.netProfitLoss)[0] ?? null;
  const worst = [...list].sort((a, b) => a.netProfitLoss - b.netProfitLoss)[0] ?? null;
  const bestPull =
    [...list]
      .map((b) => b.bestCard)
      .filter((c): c is NonNullable<typeof c> => c !== null && c.price !== null)
      .sort((a, b) => (b.price ?? 0) - (a.price ?? 0))[0] ?? null;
  return {
    count: list.length,
    totalCost,
    totalValue,
    totalGross,
    totalNet,
    avgValue: totalValue / list.length,
    avgRoi: rois.length > 0 ? rois.reduce((a, b) => a + b, 0) / rois.length : null,
    best,
    worst,
    bestPull,
    breakEvenRate: (list.filter((b) => b.netProfitLoss >= 0).length / list.length) * 100,
    missingPrices: list.reduce((s, b) => s + b.missingPriceCount, 0),
  };
}
