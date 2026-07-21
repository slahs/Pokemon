import type { SimulationProfile } from "@/types";

/**
 * Einfaches Vintage-Profil (klassische 11-Karten-Booster).
 * GESCHAETZTE Wahrscheinlichkeiten – keine offiziellen Pull Rates.
 */
export const vintageProfile: SimulationProfile = {
  id: "vintage",
  name: "Vintage (klassisch)",
  applicableSetIds: ["base*", "gym*", "neo*", "ecard*", "ex*"],
  packSize: 11,
  confidence: "estimated",
  sourceDescription:
    "Vereinfachtes klassisches Boostermodell: 7 häufige, 3 nicht so häufige, 1 seltene Karte mit Holo-Chance von etwa 1:3.",
  disclaimer: "Geschätztes Simulationsmodell – keine offiziellen Pull Rates.",
  slots: [
    {
      id: "commons",
      label: "Häufige Karten",
      count: 7,
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
      id: "rare",
      label: "Seltene Karte",
      count: 1,
      finish: "normal",
      rarityWeights: { rare: 1 },
      upgradeTable: [{ probability: 0.33, finish: "holo", rarityWeights: { holoRare: 1, rare: 1 } }],
    },
  ],
};
