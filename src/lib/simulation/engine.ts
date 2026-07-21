import type {
  CardFinish,
  DrawnCard,
  NormalizedCard,
  SimulationProfile,
} from "@/types";
import type { Rng } from "@/lib/simulation/rng";

export class SimulationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SimulationError";
  }
}

/** Bewertbare Kartenkategorien; Energie/Trainer-Codekarten sind Zusatzkarten. */
function isValueCard(card: NormalizedCard): boolean {
  const cat = card.category.toLowerCase();
  return cat !== "energy" && cat !== "energie";
}

export function groupByRarity(cards: NormalizedCard[]): Map<string, NormalizedCard[]> {
  const map = new Map<string, NormalizedCard[]>();
  for (const card of cards) {
    const key = card.canonicalRarity;
    const bucket = map.get(key);
    if (bucket) bucket.push(card);
    else map.set(key, [card]);
  }
  return map;
}

export function validateProfile(profile: SimulationProfile): void {
  if (profile.packSize <= 0) {
    throw new SimulationError(`Profil ${profile.id}: packSize muss > 0 sein.`);
  }
  const totalCount = profile.slots.reduce((sum, s) => sum + s.count, 0);
  if (totalCount !== profile.packSize) {
    throw new SimulationError(
      `Profil ${profile.id}: Slot-Summe (${totalCount}) entspricht nicht packSize (${profile.packSize}).`,
    );
  }
  for (const slot of profile.slots) {
    const weightSum = Object.values(slot.rarityWeights).reduce((a, b) => a + b, 0);
    if (!(weightSum > 0) || Object.values(slot.rarityWeights).some((w) => w < 0)) {
      throw new SimulationError(
        `Profil ${profile.id}, Slot ${slot.id}: ungueltige Raritaetsgewichte.`,
      );
    }
    if (slot.upgradeTable) {
      let cumulative = 0;
      for (const upgrade of slot.upgradeTable) {
        if (upgrade.probability < 0 || upgrade.probability > 1) {
          throw new SimulationError(
            `Profil ${profile.id}, Slot ${slot.id}: Upgrade-Wahrscheinlichkeit ausserhalb [0,1].`,
          );
        }
        cumulative += upgrade.probability;
        const uSum = Object.values(upgrade.rarityWeights).reduce((a, b) => a + b, 0);
        if (!(uSum > 0)) {
          throw new SimulationError(
            `Profil ${profile.id}, Slot ${slot.id}: Upgrade ohne gueltige Gewichte.`,
          );
        }
      }
      if (cumulative > 1 + 1e-9) {
        throw new SimulationError(
          `Profil ${profile.id}, Slot ${slot.id}: Upgrade-Wahrscheinlichkeiten summieren sich auf > 1.`,
        );
      }
    }
  }
}

/**
 * Waehlt eine Raritaet anhand der Gewichte.
 * Raritaeten ohne verfuegbare Karten im Pool werden entfernt,
 * die restlichen Gewichte werden renormalisiert.
 */
function pickRarity(
  weights: Record<string, number>,
  pool: Map<string, NormalizedCard[]>,
  rng: Rng,
): string | null {
  const entries = Object.entries(weights).filter(([rarity, weight]) => {
    const bucket = pool.get(rarity);
    return weight > 0 && bucket !== undefined && bucket.length > 0;
  });
  if (entries.length === 0) return null;
  const total = entries.reduce((sum, [, w]) => sum + w, 0);
  let roll = rng() * total;
  for (const [rarity, weight] of entries) {
    roll -= weight;
    if (roll <= 0) return rarity;
  }
  return entries[entries.length - 1]?.[0] ?? null;
}

function pickCard(
  bucket: NormalizedCard[],
  usedIds: Set<string>,
  rng: Rng,
): NormalizedCard {
  // Duplikate innerhalb desselben Slots vermeiden, solange moeglich.
  const fresh = bucket.filter((c) => !usedIds.has(c.id));
  const source = fresh.length > 0 ? fresh : bucket;
  const index = Math.floor(rng() * source.length);
  const card = source[Math.min(index, source.length - 1)];
  if (!card) throw new SimulationError("Leerer Kartenpool beim Ziehen.");
  return card;
}

/**
 * Simuliert einen Booster.
 * Liefert exakt profile.packSize bewertbare Karten.
 */
export function drawBooster(
  profile: SimulationProfile,
  poolCards: NormalizedCard[],
  rng: Rng,
): DrawnCard[] {
  validateProfile(profile);

  const valueCards = poolCards.filter(isValueCard);
  if (valueCards.length === 0) {
    throw new SimulationError("Der Kartenpool dieses Sets ist leer.");
  }
  const pool = groupByRarity(valueCards);

  // Globale Fallback-Reihenfolge, falls ein Slot keine passende Raritaet findet.
  const fallbackOrder = [
    "common",
    "uncommon",
    "rare",
    "holoRare",
    "doubleRare",
    "illustrationRare",
    "ultraRare",
    "shinyRare",
    "specialIllustrationRare",
    "shinyUltraRare",
    "hyperRare",
    "secret",
    "promo",
    "other",
  ];

  const result: DrawnCard[] = [];

  for (const slot of profile.slots) {
    const usedInSlot = new Set<string>();
    for (let i = 0; i < slot.count; i++) {
      let finish: CardFinish = slot.finish;
      let weights = slot.rarityWeights;

      // Upgrade-Tabelle: kumulative Wahrscheinlichkeiten pruefen.
      if (slot.upgradeTable && slot.upgradeTable.length > 0) {
        const roll = rng();
        let cumulative = 0;
        for (const upgrade of slot.upgradeTable) {
          cumulative += upgrade.probability;
          if (roll < cumulative) {
            weights = upgrade.rarityWeights;
            if (upgrade.finish) finish = upgrade.finish;
            break;
          }
        }
      }

      let rarity = pickRarity(weights, pool, rng);
      if (!rarity) {
        // Fallback: naechste verfuegbare Raritaet aus globaler Reihenfolge.
        rarity =
          fallbackOrder.find((r) => (pool.get(r)?.length ?? 0) > 0) ??
          [...pool.keys()].find((r) => (pool.get(r)?.length ?? 0) > 0) ??
          null;
      }
      if (!rarity) {
        throw new SimulationError("Keine ziehbare Raritaet im Kartenpool gefunden.");
      }

      const bucket = pool.get(rarity);
      if (!bucket || bucket.length === 0) {
        throw new SimulationError(`Leerer Pool fuer Raritaet ${rarity}.`);
      }

      const card = pickCard(bucket, usedInSlot, rng);
      usedInSlot.add(card.id);

      // Variante nur ziehen, wenn die Karte sie tatsaechlich unterstuetzt.
      const finalFinish: CardFinish = card.availableFinishes.includes(finish)
        ? finish
        : (card.availableFinishes[0] ?? "normal");

      result.push({
        card,
        finish: finalFinish,
        slotId: slot.id,
        slotLabel: slot.label,
        excludedFromValue: false,
      });
    }
  }

  if (result.length !== profile.packSize) {
    throw new SimulationError(
      `Engine lieferte ${result.length} Karten, erwartet waren ${profile.packSize}.`,
    );
  }
  return result;
}
