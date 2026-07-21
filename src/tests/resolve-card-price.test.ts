import { describe, expect, it } from "vitest";
import { resolveCardPrice } from "@/lib/pricing/resolve-card-price";
import { makeCard, makePrices } from "@/tests/fixtures";

describe("resolveCardPrice", () => {
  it("verwendet den Trendpreis als Standard", () => {
    const card = makeCard({ prices: { normal: makePrices({ trend: 2.5 }), reverse: null, holo: null } });
    const result = resolveCardPrice(card, "normal", "trend");
    expect(result.price).toBe(2.5);
    expect(result.usedField).toBe("trend");
    expect(result.usedFallbackField).toBe(false);
    expect(result.missing).toBe(false);
  });

  it("faellt bei fehlendem Trend auf avg7 -> avg30 -> average -> low zurueck", () => {
    const base = { reverse: null, holo: null };
    const c1 = makeCard({ prices: { ...base, normal: makePrices({ avg7: 1.1 }) } });
    expect(resolveCardPrice(c1, "normal", "trend")).toMatchObject({
      price: 1.1,
      usedField: "avg7",
      usedFallbackField: true,
    });

    const c2 = makeCard({ prices: { ...base, normal: makePrices({ avg30: 1.2 }) } });
    expect(resolveCardPrice(c2, "normal", "trend").usedField).toBe("avg30");

    const c3 = makeCard({ prices: { ...base, normal: makePrices({ average: 1.3 }) } });
    expect(resolveCardPrice(c3, "normal", "trend").usedField).toBe("average");

    const c4 = makeCard({ prices: { ...base, normal: makePrices({ low: 0.9 }) } });
    expect(resolveCardPrice(c4, "normal", "trend").usedField).toBe("low");
  });

  it("meldet fehlende Preise explizit (niemals 0)", () => {
    const card = makeCard({ prices: { normal: null, reverse: null, holo: null } });
    const result = resolveCardPrice(card, "normal", "trend");
    expect(result.missing).toBe(true);
    expect(result.price).toBeNull();
    expect(result.usedField).toBeNull();
  });

  it("nutzt fuer Holo-Karten die Holo-Preisfelder", () => {
    const card = makeCard({
      prices: {
        normal: makePrices({ trend: 0.5 }),
        reverse: makePrices({ trend: 3 }),
        holo: makePrices({ trend: 3 }),
      },
    });
    const result = resolveCardPrice(card, "holo", "trend");
    expect(result.price).toBe(3);
    expect(result.usedFinish).toBe("holo");
    expect(result.usedFallbackFinish).toBe(false);
  });

  it("faellt fuer Holo ohne eigenen Preis auf die Standardvariante zurueck und markiert das", () => {
    const card = makeCard({
      prices: { normal: makePrices({ trend: 0.75 }), reverse: null, holo: null },
    });
    const result = resolveCardPrice(card, "reverse", "trend");
    expect(result.price).toBe(0.75);
    expect(result.usedFinish).toBe("normal");
    expect(result.usedFallbackFinish).toBe(true);
  });

  it("respektiert den gewaehlten Preismodus", () => {
    const card = makeCard({
      prices: {
        normal: makePrices({ trend: 2, average: 3, avg1: 4, avg7: 5, avg30: 6, low: 1 }),
        reverse: null,
        holo: null,
      },
    });
    expect(resolveCardPrice(card, "normal", "low").price).toBe(1);
    expect(resolveCardPrice(card, "normal", "avg1").price).toBe(4);
    expect(resolveCardPrice(card, "normal", "avg30").price).toBe(6);
    expect(resolveCardPrice(card, "normal", "average").price).toBe(3);
  });

  it("liefert das Aktualisierungsdatum mit", () => {
    const card = makeCard({ pricingUpdatedAt: "2026-07-15" });
    expect(resolveCardPrice(card, "normal", "trend").updatedAt).toBe("2026-07-15");
  });
});
