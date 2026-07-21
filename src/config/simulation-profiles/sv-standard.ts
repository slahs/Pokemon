import type { SimulationProfile } from "@/types";

/**
 * Allgemeines Profil fuer regulaere Karmesin-&-Purpur-Sets.
 * GESCHAETZTE Wahrscheinlichkeiten – keine offiziellen Pull Rates.
 * Annahmen dokumentiert in docs/simulation-sources.md.
 */
export const svStandardProfile: SimulationProfile = {
  id: "sv-standard",
  name: "Karmesin & Purpur (Standard)",
  applicableSetIds: ["sv*"],
  packSize: 10,
  confidence: "estimated",
  sourceDescription:
    "Geschätzte Verteilung auf Basis öffentlich diskutierter Community-Beobachtungen zu Karmesin-&-Purpur-Boostern.",
  disclaimer: "Geschätztes Simulationsmodell – keine offiziellen Pull Rates.",
  slots: [
    {
      id: "commons",
      label: "Häufige Karten",
      count: 4,
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
      id: "reverse-1",
      label: "Reverse-Holo-Slot",
      count: 1,
      finish: "reverse",
      rarityWeights: { common: 55, uncommon: 30, rare: 15 },
    },
    {
      id: "reverse-2",
      label: "Reverse-Holo-Slot mit Upgrade-Chance",
      count: 1,
      finish: "reverse",
      rarityWeights: { common: 50, uncommon: 32, rare: 18 },
      upgradeTable: [
        { probability: 0.08, finish: "holo", rarityWeights: { illustrationRare: 1 } },
        { probability: 0.015, finish: "holo", rarityWeights: { specialIllustrationRare: 1 } },
      ],
    },
    {
      id: "rare",
      label: "Seltene Karte",
      count: 1,
      finish: "holo",
      rarityWeights: { rare: 1, holoRare: 1 },
      upgradeTable: [
        { probability: 0.13, rarityWeights: { doubleRare: 1 } },
        { probability: 0.06, rarityWeights: { ultraRare: 1 } },
        { probability: 0.01, rarityWeights: { hyperRare: 1, secret: 1 } },
      ],
    },
  ],
};
