import { describe, expect, it } from "vitest";
import { drawBooster, SimulationError, validateProfile } from "@/lib/simulation/engine";
import { createSeededRng } from "@/lib/simulation/rng";
import { svSpecialProfile } from "@/config/simulation-profiles/sv-special";
import { bigPool, makePool, simpleProfile } from "@/tests/fixtures";
import type { SimulationProfile } from "@/types";

describe("Simulations-Engine", () => {
  it("liefert exakt die im Profil definierte Kartenanzahl", () => {
    const result = drawBooster(simpleProfile, bigPool(), createSeededRng(42));
    expect(result).toHaveLength(simpleProfile.packSize);
  });

  it("belegt die Slots korrekt", () => {
    const result = drawBooster(simpleProfile, bigPool(), createSeededRng(7));
    expect(result.filter((c) => c.slotId === "c")).toHaveLength(3);
    expect(result.filter((c) => c.slotId === "u")).toHaveLength(1);
    expect(result.filter((c) => c.slotId === "r")).toHaveLength(1);
  });

  it("zieht nur erlaubte Raritaeten", () => {
    const rng = createSeededRng(123);
    for (let i = 0; i < 50; i++) {
      const result = drawBooster(simpleProfile, bigPool(), rng);
      for (const drawn of result) {
        if (drawn.slotId === "c") expect(drawn.card.canonicalRarity).toBe("common");
        if (drawn.slotId === "u") expect(drawn.card.canonicalRarity).toBe("uncommon");
        if (drawn.slotId === "r")
          expect(["rare", "ultraRare"]).toContain(drawn.card.canonicalRarity);
      }
    }
  });

  it("vergibt nur Varianten, die die Karte unterstuetzt", () => {
    const pool = makePool({ common: 20, uncommon: 10, rare: 5, ultraRare: 3 });
    const result = drawBooster(simpleProfile, pool, createSeededRng(9));
    for (const drawn of result) {
      expect(drawn.card.availableFinishes).toContain(drawn.finish);
    }
  });

  it("faengt leere Raritaetspools ueber Fallback ab", () => {
    // Kein einziger 'rare' im Pool -> Rare-Slot muss trotzdem eine Karte liefern.
    const pool = makePool({ common: 20, uncommon: 10 });
    const result = drawBooster(simpleProfile, pool, createSeededRng(5));
    expect(result).toHaveLength(simpleProfile.packSize);
  });

  it("wirft bei vollstaendig leerem Pool einen verstaendlichen Fehler", () => {
    expect(() => drawBooster(simpleProfile, [], createSeededRng(1))).toThrow(SimulationError);
  });

  it("ist mit festem Seed reproduzierbar", () => {
    const a = drawBooster(simpleProfile, bigPool(), createSeededRng(2026));
    const b = drawBooster(simpleProfile, bigPool(), createSeededRng(2026));
    expect(a.map((c) => `${c.card.canonicalRarity}:${c.finish}`)).toEqual(
      b.map((c) => `${c.card.canonicalRarity}:${c.finish}`),
    );
  });

  it("lehnt ungueltige Wahrscheinlichkeiten ab", () => {
    const broken: SimulationProfile = {
      ...simpleProfile,
      id: "broken",
      slots: [
        {
          id: "x",
          label: "X",
          count: 5,
          finish: "normal",
          rarityWeights: { common: 1 },
          upgradeTable: [
            { probability: 0.7, rarityWeights: { rare: 1 } },
            { probability: 0.6, rarityWeights: { ultraRare: 1 } },
          ],
        },
      ],
    };
    expect(() => validateProfile(broken)).toThrow(SimulationError);

    const negative: SimulationProfile = {
      ...simpleProfile,
      id: "negative",
      slots: [
        { id: "y", label: "Y", count: 5, finish: "normal", rarityWeights: { common: -1 } },
      ],
    };
    expect(() => validateProfile(negative)).toThrow(SimulationError);

    const wrongSize: SimulationProfile = { ...simpleProfile, id: "size", packSize: 99 };
    expect(() => validateProfile(wrongSize)).toThrow(SimulationError);
  });

  it("vermeidet identische Duplikate innerhalb eines Slots, solange moeglich", () => {
    const pool = makePool({ common: 10, uncommon: 5, rare: 3 });
    const rng = createSeededRng(77);
    for (let i = 0; i < 30; i++) {
      const result = drawBooster(simpleProfile, pool, rng);
      const commons = result.filter((c) => c.slotId === "c").map((c) => c.card.id);
      expect(new Set(commons).size).toBe(commons.length);
    }
  });

  it("simuliert 10.000 Booster mit dem Paldeas-Schicksale-Profil ohne Laufzeitfehler", () => {
    const pool = bigPool();
    const rng = createSeededRng(31337);
    for (let i = 0; i < 10_000; i++) {
      const result = drawBooster(svSpecialProfile, pool, rng);
      expect(result).toHaveLength(svSpecialProfile.packSize);
    }
  });
});
