import { describe, expect, it } from "vitest";
import { emptySession, migrateSession } from "@/lib/storage/session-storage";
import type { BoosterRecord } from "@/types";

function makeRecord(overrides: Partial<BoosterRecord> = {}): BoosterRecord {
  return {
    id: "b1",
    openedAt: "2026-07-20T10:00:00.000Z",
    setId: "sv04.5",
    setName: "Paldeas Schicksale",
    profileId: "sv-special",
    packPurchasePrice: 4.29,
    priceMode: "trend",
    grossCardValue: 5.5,
    grossProfitLoss: 1.21,
    netCardValue: 5.5,
    netProfitLoss: 1.21,
    roi: 28.2,
    missingPriceCount: 0,
    bestCard: null,
    cards: [],
    ...overrides,
  };
}

describe("Local-Storage-Migration", () => {
  it("liefert bei null/ungueltigen Daten eine leere Session", () => {
    expect(migrateSession(null)).toEqual(emptySession());
    expect(migrateSession("kaputt")).toEqual(emptySession());
    expect(migrateSession(42)).toEqual(emptySession());
    expect(migrateSession({ version: 99, foo: true })).toEqual(emptySession());
  });

  it("akzeptiert gueltige v1-Daten unveraendert", () => {
    const state = { version: 1 as const, boosters: [makeRecord()] };
    expect(migrateSession(state)).toEqual(state);
  });

  it("rettet gueltige Booster aus teilweise defekten v1-Daten", () => {
    const state = {
      version: 1,
      boosters: [makeRecord(), { totally: "broken" }, makeRecord({ id: "b2" })],
    };
    const migrated = migrateSession(state);
    expect(migrated.boosters.map((b) => b.id)).toEqual(["b1", "b2"]);
  });
});
