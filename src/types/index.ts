export type CardFinish = "normal" | "reverse" | "holo";

export type PriceVariants = {
  low: number | null;
  average: number | null;
  trend: number | null;
  avg1: number | null;
  avg7: number | null;
  avg30: number | null;
};

export type NormalizedPrices = {
  normal: PriceVariants | null;
  reverse: PriceVariants | null;
  holo: PriceVariants | null;
};

/** Kanonische Raritaeten, unabhaengig von API-Sprache. */
export type CanonicalRarity =
  | "common"
  | "uncommon"
  | "rare"
  | "holoRare"
  | "doubleRare"
  | "ultraRare"
  | "illustrationRare"
  | "specialIllustrationRare"
  | "hyperRare"
  | "shinyRare"
  | "shinyUltraRare"
  | "radiant"
  | "amazing"
  | "secret"
  | "promo"
  | "other";

export type NormalizedCard = {
  id: string;
  localId: string;
  name: string;
  setId: string;
  setName: string;
  imageLow: string | null;
  imageHigh: string | null;
  rarity: string | null;
  canonicalRarity: CanonicalRarity;
  category: string;
  availableFinishes: CardFinish[];
  prices: NormalizedPrices;
  pricingUpdatedAt: string | null;
  language: "de" | "en";
};

export type NormalizedBoosterArtwork = {
  id: string;
  name: string;
  logo: string | null;
  artworkFront: string | null;
  artworkBack: string | null;
};

export type NormalizedSetSummary = {
  id: string;
  name: string;
  serie: string;
  releaseDate: string | null;
  cardCountOfficial: number | null;
  cardCountTotal: number | null;
  logo: string | null;
  symbol: string | null;
  language: "de" | "en";
  /** Reihenfolge der TCGdex-Setliste, 0 = neuestes Release. */
  releaseOrder: number | null;
  boosters: NormalizedBoosterArtwork[];
};

export type SetPoolResponse = {
  set: NormalizedSetSummary;
  cards: NormalizedCard[];
  loadedAt: string;
  /** Anzahl Karten, die nur auf Englisch verfuegbar waren */
  englishFallbackCount: number;
};

export type PriceMode = "trend" | "average" | "avg1" | "avg7" | "avg30" | "low";

export type ResolvedPrice = {
  price: number | null;
  usedField: keyof PriceVariants | null;
  usedFinish: CardFinish | null;
  usedFallbackField: boolean;
  usedFallbackFinish: boolean;
  updatedAt: string | null;
  missing: boolean;
};

export type DrawnCard = {
  card: NormalizedCard;
  finish: CardFinish;
  slotId: string;
  slotLabel: string;
  /** Zusatzkarten (Energie/Code) fliessen nicht in die Bewertung ein */
  excludedFromValue: boolean;
};

export type SlotUpgrade = {
  probability: number;
  finish?: CardFinish;
  rarityWeights: Record<string, number>;
};

export type PackSlot = {
  id: string;
  label: string;
  count: number;
  finish: CardFinish;
  rarityWeights: Record<string, number>;
  upgradeTable?: SlotUpgrade[];
};

export type SimulationProfile = {
  id: string;
  name: string;
  applicableSetIds: string[];
  packSize: number;
  slots: PackSlot[];
  sourceDescription: string;
  sourceUrl?: string;
  confidence: "official" | "community" | "estimated";
  disclaimer?: string;
};

export type BoosterResultCard = {
  cardId: string;
  localId: string;
  name: string;
  imageLow: string | null;
  imageHigh: string | null;
  rarity: string | null;
  finish: CardFinish;
  price: number | null;
  usedField: string | null;
  usedFallbackFinish: boolean;
  updatedAt: string | null;
  language: "de" | "en";
  excludedFromValue: boolean;
};

export type BoosterRecord = {
  id: string;
  openedAt: string;
  setId: string;
  setName: string;
  profileId: string;
  packPurchasePrice: number;
  priceMode: PriceMode;
  grossCardValue: number;
  grossProfitLoss: number;
  netCardValue: number;
  netProfitLoss: number;
  roi: number | null;
  missingPriceCount: number;
  bestCard: BoosterResultCard | null;
  cards: BoosterResultCard[];
};

export type SessionStateV1 = {
  version: 1;
  boosters: BoosterRecord[];
};
