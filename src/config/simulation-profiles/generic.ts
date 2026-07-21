import type { SimulationProfile } from "@/types";

/**
 * Robustes Fallback-Profil für Sets, die keinem generationsspezifischen Profil
 * zugeordnet sind. Dadurch bleibt jedes Set mit Kartenpool grundsätzlich
 * simulierbar. Die Engine renormalisiert Gewichte automatisch auf die im Set
 * tatsächlich vorhandenen Seltenheiten.
 */
export const genericProfile: SimulationProfile = {
  id: "generic-estimated",
  name: "Allgemeines Boosterprofil",
  applicableSetIds: ["*"],
  packSize: 10,
  confidence: "estimated",
  sourceDescription:
    "Generisches Zehn-Karten-Modell für Sets ohne eigenes Profil. Verfügbare Seltenheiten werden automatisch berücksichtigt.",
  disclaimer:
    "Allgemeines Schätzmodell für dieses Set – Packgröße und Verteilung können vom Originalprodukt abweichen.",
  slots: [
    {
      id: "bulk",
      label: "Basiskarten",
      count: 8,
      finish: "normal",
      rarityWeights: { common: 65, uncommon: 30, other: 4, promo: 1 },
    },
    {
      id: "reverse",
      label: "Reverse-/Sonderslot",
      count: 1,
      finish: "reverse",
      rarityWeights: { common: 45, uncommon: 30, rare: 15, other: 10 },
    },
    {
      id: "rare",
      label: "Seltene Karte",
      count: 1,
      finish: "holo",
      rarityWeights: {
        rare: 45,
        holoRare: 25,
        doubleRare: 10,
        ultraRare: 7,
        illustrationRare: 5,
        specialIllustrationRare: 2,
        hyperRare: 1,
        secret: 1,
        shinyRare: 1,
        shinyUltraRare: 1,
        radiant: 1,
        amazing: 1,
        other: 1,
        promo: 1,
      },
    },
  ],
};
