import { describe, expect, it } from "vitest";
import { getRarityEffectTier } from "@/lib/presentation/rarity-effects";

describe("Seltenheitseffekte", () => {
  it("zeigt normale haeufige Karten ohne Spezialeffekt", () => {
    expect(getRarityEffectTier("Häufig", "normal")).toBe(0);
  });

  it("gibt Reverse- und Holo-Karten mindestens einen Glanzeffekt", () => {
    expect(getRarityEffectTier("Häufig", "reverse")).toBe(1);
    expect(getRarityEffectTier("Nicht so häufig", "holo")).toBe(1);
  });

  it("stuft Illustration, Ultra und Special Illustration unterschiedlich ein", () => {
    expect(getRarityEffectTier("Illustration Rare", "normal")).toBe(2);
    expect(getRarityEffectTier("Ultra Rare", "normal")).toBe(3);
    expect(getRarityEffectTier("Special Illustration Rare", "normal")).toBe(4);
  });

  it("verwendet fuer Hyper und Secret Rare die staerkste Stufe", () => {
    expect(getRarityEffectTier("Hyper Rare", "holo")).toBe(4);
    expect(getRarityEffectTier("Secret Rare", "normal")).toBe(4);
  });
});
