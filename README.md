# BoosterBilanz

Virtueller Pokémon-Booster-Simulator mit Kartenwert-Berechnung, Gewinn-/Verlust-Auswertung und Session-Statistik. Deutsche Oberfläche, echte Marktdaten über die [TCGdex-API](https://tcgdex.dev), kein Benutzerkonto — alles läuft lokal im Browser.

> **BoosterBilanz ist ein inoffizielles Fanprojekt** und steht in keiner Verbindung zu The Pokémon Company, Nintendo, Creatures Inc. oder GAME FREAK. Alle Kartendaten und Bilder stammen von TCGdex; Preise basieren auf Cardmarket-Daten und stellen einen theoretischen Marktwert dar.

## Features

- **Setauswahl** mit Suche, Serien-/Jahresfilter und Sortierung; nur Sets mit Simulationsprofil sind öffenbar.
- **Booster-Simulator:** Aufreißanimation, 3D-Kartenflip (Klick, Tastatur, Swipe), Bulk-Überspringen mit einstellbarer Schwelle, Live-Statistikleiste (Kaufpreis, Kartenwert, Brutto-/Netto-G&V, Session).
- **Preislogik:** wählbare Preisbasis (Trend, Ø, 1/7/30 Tage, Low) mit dokumentierter Fallback-Kette; Holo-/Reverse-Preise mit Varianten-Fallback; fehlende Preise werden nie als 0,00 € angezeigt.
- **Auswertung:** Brutto/Netto, Verkaufsgebühren, Fixkosten, ROI, wertvollste Karte, unvollständige Bewertungen.
- **Session:** jede Packung wird gespeichert (versioniertes LocalStorage mit Migration), Dashboard mit 12 Kennzahlen, Setfilter, Sortierung, Booster-Detailansicht, CSV-/JSON-Export.
- **Einstellungen:** Preisbasis, Gebühren, Fixkosten, Bulk-Schwelle, Standard-Boosterpreis (pro Set speicherbar), Animationen/Sound/Auto-Aufdeckung u. a.
- **Barrierefreiheit:** vollständige Tastaturbedienung, ARIA/`aria-live`, sichtbarer Fokus, `prefers-reduced-motion`.
- **Responsive** von Smartphone (feste untere Bedienleiste, Touch-Ziele ≥ 44 px) bis Desktop.

## Tech-Stack

Next.js (App Router) · TypeScript (strict) · React · Tailwind CSS v4 · Framer Motion · Zod · Vitest · Playwright · ESLint + Prettier

## Schnellstart

```bash
npm install
npm run dev          # http://localhost:3000
```

Es werden keine API-Keys benötigt (siehe `.env.example`). Die TCGdex-API wird ausschließlich serverseitig über `/api/sets` und `/api/sets/{setId}/pool` angesprochen.

## Skripte

| Befehl | Zweck |
|---|---|
| `npm run dev` | Entwicklungsserver |
| `npm run build` | Produktions-Build |
| `npm start` | Produktionsserver |
| `npm run lint` | ESLint |
| `npm run typecheck` | TypeScript ohne Emit |
| `npm test` | Vitest-Unit-Tests |
| `npm run test:e2e` | Playwright-E2E (benötigt `npx playwright install chromium`) |

## Projektstruktur

```
src/
  app/                  Seiten + API-Routen (sets, pool)
  components/           UI (Simulator, Session, Einstellungen, Sets)
  config/               App-Konfiguration (Name zentral), Simulationsprofile
  lib/
    api/                TCGdex-Client, Normalisierung, Zod-Schemata
    pricing/            resolveCardPrice (Fallback-Kette)
    simulation/         Engine, RNG, Booster-Service
    calculations/       G&V, deutsche Formatierung
    storage/            Session/Einstellungen (versioniert), Export
  tests/                Vitest-Unit-Tests
e2e/                    Playwright-Flow (API gemockt)
docs/                   architecture.md, simulation-sources.md, pricing.md
```

## Wichtige Hinweise

- **Geschätzte Pull Rates:** Alle Simulationsprofile sind geschätzte Modelle (`confidence: "estimated"`), keine offiziellen Wahrscheinlichkeiten — Details in [`docs/simulation-sources.md`](docs/simulation-sources.md).
- **Preislogik:** Fallback-Ketten und Formeln in [`docs/pricing.md`](docs/pricing.md).
- **Architektur & Caching:** [`docs/architecture.md`](docs/architecture.md). Der Kartenpool-Cache ist in-memory (6 h) — auf Serverless-Plattformen ggf. durch externen Cache ersetzen.
- **Referenzset:** Paldeas Schicksale (`sv04.5`).

## Tests

- **Unit (Vitest):** Preis-Fallbacks/Varianten, G&V/Gebühren/ROI, Engine (Packgröße, Slots, Upgrades über 10.000 Booster, leere Pools, Seed-Reproduzierbarkeit), Session-Summen, Storage-Migration.
- **E2E (Playwright):** Startseite → sv04.5 → Kaufpreis → Booster öffnen → alle aufdecken → Auswertung → Session. Die internen API-Routen werden gemockt, der Test läuft ohne Internetzugriff.

## Lizenz / Rechtliches

Inoffizielles Fanprojekt für Bildungs- und Unterhaltungszwecke. Pokémon und alle zugehörigen Marken sind Eigentum ihrer jeweiligen Rechteinhaber. Datenquelle: TCGdex (Community-API). Preisdaten: Cardmarket via TCGdex.
