import { describe, expect, it } from "vitest";
import { findProfileForSet, SIMULATION_PROFILES } from "@/config/simulation-profiles";
import { validateProfile } from "@/lib/simulation/engine";

describe("Simulationsprofile", () => {
  it("alle registrierten Profile sind gueltig", () => {
    for (const profile of SIMULATION_PROFILES) {
      expect(() => validateProfile(profile)).not.toThrow();
    }
  });

  it("Paldeas Schicksale (sv04.5) erhaelt das Spezialprofil (exakter Treffer vor Praefix)", () => {
    expect(findProfileForSet("sv04.5")?.id).toBe("sv-special");
  });

  it("regulaere SV-Sets erhalten das Standardprofil", () => {
    expect(findProfileForSet("sv06")?.id).toBe("sv-standard");
  });

  it("Schwert-&-Schild-Sets erhalten das SWSH-Profil", () => {
    expect(findProfileForSet("swsh09")?.id).toBe("swsh-standard");
  });

  it("Vintage-Sets erhalten das Vintage-Profil", () => {
    expect(findProfileForSet("base1")?.id).toBe("vintage");
  });

  it("unbekannte Sets erhalten das generische Fallback-Profil", () => {
    expect(findProfileForSet("xy12")?.id).toBe("generic-estimated");
  });
});
