import { describe, expect, it } from "vitest";
import { buildRevealCards, openBooster } from "@/lib/simulation/booster-service";
import { createSeededRng } from "@/lib/simulation/rng";
import { bigPool, makeCard, makePrices, simpleProfile } from "@/tests/fixtures";
import { drawBooster } from "@/lib/simulation/engine";

describe("Booster-Service (Preiszuordnung)", () => {
  it("ordnet jeder gezogenen Karte einen aufgeloesten Preis zu", () => {
    const cards = openBooster(simpleProfile, bigPool(), createSeededRng(1), {
      priceMode: "trend",
      bulkThreshold: 0.5,
    });
    expect(cards).toHaveLength(simpleProfile.packSize);
    for (const card of cards) {
      expect(card.price === null || typeof card.price === "number").toBe(true);
    }
  });

  it("markiert nur guenstige Common/Uncommon-Karten als Bulk", () => {
    const drawn = drawBooster(simpleProfile, bigPool(), createSeededRng(3));
    const reveal = buildRevealCards(drawn, "trend", 0.5);
    for (const card of reveal) {
      if (card.isBulk) {
        expect(card.price).not.toBeNull();
        expect(card.price ?? 99).toBeLessThan(0.5);
      }
    }
  });

  it("behandelt Karten ohne Preis niemals als Bulk", () => {
    const noPrice = makeCard({
      prices: { normal: null, reverse: null, holo: null },
      canonicalRarity: "common",
    });
    const reveal = buildRevealCards(
      [{ card: noPrice, finish: "normal", slotId: "c", slotLabel: "C", excludedFromValue: false }],
      "trend",
      0.5,
    );
    expect(reveal[0]?.isBulk).toBe(false);
    expect(reveal[0]?.price).toBeNull();
  });

  it("markiert seltene Karten trotz niedrigem Preis nicht als Bulk", () => {
    const cheapRare = makeCard({
      canonicalRarity: "ultraRare",
      prices: { normal: makePrices({ trend: 0.1 }), reverse: null, holo: null },
    });
    const reveal = buildRevealCards(
      [{ card: cheapRare, finish: "normal", slotId: "r", slotLabel: "R", excludedFromValue: false }],
      "trend",
      0.5,
    );
    expect(reveal[0]?.isBulk).toBe(false);
  });
});
