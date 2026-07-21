import type { SimulationProfile } from "@/types";
import { svStandardProfile } from "@/config/simulation-profiles/sv-standard";
import { svSpecialProfile } from "@/config/simulation-profiles/sv-special";
import { swshStandardProfile } from "@/config/simulation-profiles/swsh-standard";
import { vintageProfile } from "@/config/simulation-profiles/vintage";
import { genericProfile } from "@/config/simulation-profiles/generic";

export const SIMULATION_PROFILES: SimulationProfile[] = [
  svSpecialProfile,
  svStandardProfile,
  swshStandardProfile,
  vintageProfile,
  genericProfile,
];

function matches(entry: string, setId: string): { exact: boolean; match: boolean } {
  if (entry.endsWith("*")) {
    return { exact: false, match: setId.startsWith(entry.slice(0, -1)) };
  }
  return { exact: true, match: entry === setId };
}

/**
 * Findet das passendste Profil fuer ein Set.
 * Exakte Treffer haben Vorrang vor Praefix-Treffern.
 */
export function findProfileForSet(setId: string): SimulationProfile | null {
  let prefixMatch: SimulationProfile | null = null;
  for (const profile of SIMULATION_PROFILES) {
    for (const entry of profile.applicableSetIds) {
      const { exact, match } = matches(entry, setId);
      if (!match) continue;
      if (exact) return profile;
      prefixMatch ??= profile;
    }
  }
  return prefixMatch;
}
