import type { CanonicalRarity } from "@/types";

/**
 * Normalisiert deutsche und englische TCGdex-Raritaetsnamen
 * auf kanonische Schluessel, damit Simulationsprofile
 * sprachunabhaengig funktionieren.
 */
const RARITY_MAP: Record<string, CanonicalRarity> = {
  // Englisch
  common: "common",
  uncommon: "uncommon",
  rare: "rare",
  "rare holo": "holoRare",
  "holo rare": "holoRare",
  "double rare": "doubleRare",
  "ultra rare": "ultraRare",
  "illustration rare": "illustrationRare",
  "special illustration rare": "specialIllustrationRare",
  "hyper rare": "hyperRare",
  "shiny rare": "shinyRare",
  "shiny ultra rare": "shinyUltraRare",
  "radiant rare": "radiant",
  "amazing rare": "amazing",
  "secret rare": "secret",
  "rare secret": "secret",
  promo: "promo",
  // Deutsch
  "häufig": "common",
  "nicht so häufig": "uncommon",
  "selten": "rare",
  "selten holo": "holoRare",
  "holo selten": "holoRare",
  "doppelselten": "doubleRare",
  "ultra selten": "ultraRare",
  "illustration selten": "illustrationRare",
  "spezielle illustration selten": "specialIllustrationRare",
  "hyper selten": "hyperRare",
  "hyperselten": "hyperRare",
  "schimmerndes selten": "shinyRare",
  "schimmernd selten": "shinyRare",
  "schimmerndes ultra-selten": "shinyUltraRare",
  "schimmerndes ultra selten": "shinyUltraRare",
  "strahlend selten": "radiant",
  "fantastisch selten": "amazing",
  "geheim selten": "secret",
};

export function canonicalizeRarity(rarity: string | null | undefined): CanonicalRarity {
  if (!rarity) return "other";
  const key = rarity.trim().toLowerCase();
  return RARITY_MAP[key] ?? "other";
}
