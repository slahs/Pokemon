/**
 * Zentrale App-Konfiguration.
 * Der Projektname ist hier zentral hinterlegt und kann spaeter
 * an genau einer Stelle ausgetauscht werden.
 */
export const APP_CONFIG = {
  name: "BoosterBilanz",
  tagline: "Pokémon-Booster virtuell öffnen und den Kartenwert berechnen",
  description:
    "Öffne simulierte Booster, prüfe aktuelle Marktwerte und vergleiche den Kartenwert mit deinem Kaufpreis.",
  freeNotice: "Kostenlose Simulation. Es werden keine echten Karten oder Gewinne ausgegeben.",
  legalFooter:
    "BoosterBilanz ist ein inoffizielles Fanprojekt und steht in keiner Verbindung zu The Pokémon Company, Nintendo, Game Freak oder Creatures. Alle Marken und Kartenabbildungen gehören ihren jeweiligen Rechteinhabern. Die Simulation dient ausschließlich der Unterhaltung. Angezeigte Marktwerte sind unverbindliche Schätzwerte.",
  valueDisclaimer:
    "Der Kartenwert ist ein theoretischer Marktwert. Zustand, Sprache, Nachfrage, Verkaufsgebühren und tatsächliche Verkaufspreise können abweichen.",
  tcgdexBaseUrl: process.env.TCGDEX_BASE_URL ?? "https://api.tcgdex.net/v2",
  referenceSetId: "sv04.5",
  cache: {
    /** Setliste und Setdetails: 24 Stunden */
    setsSeconds: 60 * 60 * 24,
    /** Kartenpool inkl. Preise: 6 Stunden */
    poolSeconds: 60 * 60 * 6,
  },
  api: {
    timeoutMs: 12_000,
    retries: 2,
    poolConcurrency: 8,
  },
} as const;
