import type { SimulationProfile } from "@/types";

/**
 * Profil fuer spezielle Karmesin-&-Purpur-Sets
 * (z. B. Paldeas Schicksale sv04.5 mit Shiny-Pokémon).
 * GESCHAETZTE Wahrscheinlichkeiten – keine offiziellen Pull Rates.
 */
export const svSpecialProfile: SimulationProfile = {
  id: "sv-special",
  name: "Karmesin & Purpur (Spezialset)",
  applicableSetIds: ["sv04.5", "sv03.5", "sv06.5", "sv08.5"],
  packSize: 10,
  confidence: "estimated",
  sourceDescription:
    "Geschätzte Verteilung für Karmesin-&-Purpur-Spezialsets mit Shiny-Slot, angelehnt an Community-Beobachtungen.",
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
      id: "reverse",
      label: "Reverse-Holo-Slot",
      count: 1,
      finish: "reverse",
      rarityWeights: { common: 50, uncommon: 32, rare: 18 },
    },
    {
      id: "shiny-chance",
      label: "Shiny-Chance-Slot",
      count: 1,
      finish: "reverse",
      rarityWeights: { common: 45, uncommon: 30, rare: 25 },
      upgradeTable: [
        { probability: 0.12, finish: "holo", rarityWeights: { shinyRare: 1 } },
        { probability: 0.03, finish: "holo", rarityWeights: { shinyUltraRare: 1 } },
        { probability: 0.05, finish: "holo", rarityWeights: { illustrationRare: 1 } },
      ],
    },
    {
      id: "rare",
      label: "Seltene Karte",
      count: 1,
      finish: "holo",
      rarityWeights: { rare: 1, holoRare: 1 },
      upgradeTable: [
        { probability: 0.14, rarityWeights: { doubleRare: 1 } },
        { probability: 0.07, rarityWeights: { ultraRare: 1 } },
        { probability: 0.02, rarityWeights: { specialIllustrationRare: 1 } },
        { probability: 0.01, rarityWeights: { hyperRare: 1, secret: 1 } },
      ],
    },
  ],
};
