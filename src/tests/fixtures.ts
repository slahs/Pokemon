import type {
  CanonicalRarity,
  CardFinish,
  NormalizedCard,
  PriceVariants,
  SimulationProfile,
} from "@/types";

export function makePrices(partial: Partial<PriceVariants>): PriceVariants {
  return { low: null, average: null, trend: null, avg1: null, avg7: null, avg30: null, ...partial };
}

let counter = 0;

export function makeCard(overrides: Partial<NormalizedCard> = {}): NormalizedCard {
  counter++;
  return {
    id: `test-${counter}`,
    localId: String(counter),
    name: `Testkarte ${counter}`,
    setId: "test-set",
    setName: "Testset",
    imageLow: null,
    imageHigh: null,
    rarity: "Häufig",
    canonicalRarity: "common",
    category: "Pokemon",
    availableFinishes: ["normal", "reverse"] as CardFinish[],
    prices: {
      normal: makePrices({ trend: 0.1, low: 0.02 }),
      reverse: null,
      holo: null,
    },
    pricingUpdatedAt: "2026-07-01",
    language: "de",
    ...overrides,
  };
}

export function makePool(counts: Partial<Record<CanonicalRarity, number>>): NormalizedCard[] {
  const rarityNames: Partial<Record<CanonicalRarity, string>> = {
    common: "Häufig",
    uncommon: "Nicht so häufig",
    rare: "Selten",
    holoRare: "Selten Holo",
    doubleRare: "Doppelselten",
    ultraRare: "Ultra Selten",
    illustrationRare: "Illustration Selten",
    specialIllustrationRare: "Spezielle Illustration Selten",
    hyperRare: "Hyper Selten",
    shinyRare: "Schimmerndes Selten",
    shinyUltraRare: "Schimmerndes Ultra-Selten",
    secret: "Geheim Selten",
  };
  const cards: NormalizedCard[] = [];
  for (const [rarity, count] of Object.entries(counts) as [CanonicalRarity, number][]) {
    for (let i = 0; i < count; i++) {
      cards.push(
        makeCard({
          canonicalRarity: rarity,
          rarity: rarityNames[rarity] ?? rarity,
          availableFinishes:
            rarity === "common" || rarity === "uncommon"
              ? ["normal", "reverse"]
              : ["normal", "reverse", "holo"],
        }),
      );
    }
  }
  return cards;
}

export const bigPool = () =>
  makePool({
    common: 60,
    uncommon: 40,
    rare: 25,
    holoRare: 12,
    doubleRare: 10,
    ultraRare: 8,
    illustrationRare: 8,
    specialIllustrationRare: 5,
    hyperRare: 4,
    shinyRare: 10,
    shinyUltraRare: 4,
    secret: 3,
  });

export const simpleProfile: SimulationProfile = {
  id: "test-profile",
  name: "Testprofil",
  applicableSetIds: ["test-set"],
  packSize: 5,
  confidence: "estimated",
  sourceDescription: "Test",
  slots: [
    { id: "c", label: "Common", count: 3, finish: "normal", rarityWeights: { common: 1 } },
    { id: "u", label: "Uncommon", count: 1, finish: "normal", rarityWeights: { uncommon: 1 } },
    {
      id: "r",
      label: "Rare",
      count: 1,
      finish: "holo",
      rarityWeights: { rare: 1 },
      upgradeTable: [{ probability: 0.2, rarityWeights: { ultraRare: 1 } }],
    },
  ],
};
