import type { CardFinish, CanonicalRarity } from "@/types";
import { canonicalizeRarity } from "@/lib/api/rarity";

export type RarityEffectTier = 0 | 1 | 2 | 3 | 4;

const RARITY_TIERS: Record<CanonicalRarity, RarityEffectTier> = {
  common: 0,
  uncommon: 0,
  rare: 1,
  holoRare: 1,
  doubleRare: 2,
  illustrationRare: 2,
  shinyRare: 2,
  ultraRare: 3,
  radiant: 3,
  amazing: 3,
  specialIllustrationRare: 4,
  hyperRare: 4,
  shinyUltraRare: 4,
  secret: 4,
  promo: 1,
  other: 0,
};

/**
 * Ordnet Karten einer visuellen Effektstufe zu. Holo- und Reverse-Varianten
 * erhalten mindestens einen dezenten Glanzeffekt, auch wenn die API-Raritaet
 * unvollstaendig ist.
 */
export function getRarityEffectTier(
  rarity: string | null | undefined,
  finish: CardFinish,
): RarityEffectTier {
  const canonical = canonicalizeRarity(rarity);
  const rarityTier = RARITY_TIERS[canonical];
  const finishTier: RarityEffectTier = finish === "normal" ? 0 : 1;
  return Math.max(rarityTier, finishTier) as RarityEffectTier;
}
