import type { SimulationProfile } from "@/types";

/**
 * Allgemeines Schwert-&-Schild-Profil.
 * GESCHAETZTE Wahrscheinlichkeiten – keine offiziellen Pull Rates.
 */
export const swshStandardProfile: SimulationProfile = {
  id: "swsh-standard",
  name: "Schwert & Schild (Standard)",
  applicableSetIds: ["swsh*"],
  packSize: 10,
  confidence: "estimated",
  sourceDescription:
    "Geschätzte Verteilung für Schwert-&-Schild-Booster auf Basis von Community-Beobachtungen.",
  disclaimer: "Geschätztes Simulationsmodell – keine offiziellen Pull Rates.",
  slots: [
    {
      id: "commons",
      label: "Häufige Karten",
      count: 5,
      finish: "normal",
      rarityWeights: { common: 1 },
    },
    {
      id: "uncommons",
      label: "Nicht so häufige Karten",
      count: 3,
      finish: "normal",
      rarityWeights: { uncommon: 1 },
    },
    {
      id: "reverse",
      label: "Reverse-Holo-Slot",
      count: 1,
      finish: "reverse",
      rarityWeights: { common: 55, uncommon: 30, rare: 15 },
      upgradeTable: [
        { probability: 0.04, finish: "holo", rarityWeights: { amazing: 1, radiant: 1 } },
      ],
    },
    {
      id: "rare",
      label: "Seltene Karte",
      count: 1,
      finish: "holo",
      rarityWeights: { rare: 2, holoRare: 1 },
      upgradeTable: [
        { probability: 0.12, rarityWeights: { ultraRare: 1 } },
        { probability: 0.02, rarityWeights: { secret: 1, hyperRare: 1 } },
      ],
    },
  ],
};
