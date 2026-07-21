# Architektur

## Überblick

BoosterBilanz ist eine Next.js-App (App Router, TypeScript strict), die virtuelle Pokémon-Booster simuliert und mit echten Marktdaten der TCGdex-API bewertet. Es gibt kein Benutzerkonto; sämtlicher Zustand (Session, Einstellungen) liegt versioniert im LocalStorage des Browsers.

```
Browser (Client Components)
  │  fetch /api/sets, /api/sets/{setId}/pool
  ▼
Next.js Server (Route Handlers, server-only)
  │  fetchJsonWithRetry (Timeout, Retry, Zod-Validierung)
  ▼
TCGdex API (de, Fallback en)
```

## Schichten

| Schicht | Ort | Aufgabe |
|---|---|---|
| API-Zugriff | `src/lib/api/` | HTTP mit Timeout/Retry, Zod-Validierung, DE→EN-Fallback, Normalisierung |
| Preislogik | `src/lib/pricing/` | `resolveCardPrice` mit Fallback-Kette und Varianten-Fallback |
| Simulation | `src/lib/simulation/` | Profil-Validierung, Ziehungslogik, RNG-Abstraktion, Booster-Service |
| Berechnung | `src/lib/calculations/` | Gewinn/Verlust, ROI, deutsche Formatierung |
| Persistenz | `src/lib/storage/` | Versionierte LocalStorage-Schemata mit Migration, CSV/JSON-Export |
| UI | `src/app/`, `src/components/` | Seiten, Simulator, Session-Dashboard, Einstellungen |
| Konfiguration | `src/config/` | App-Konfiguration (Name zentral änderbar), Simulationsprofile |

## Serverseitige API-Proxy-Routen

Alle TCGdex-Zugriffe laufen ausschließlich über Route Handler:

- `GET /api/sets` — deutsche Setliste, EN-Fallback, 24 h Cache-Header, ergänzt Profil-Verfügbarkeit.
- `GET /api/sets/{setId}/pool` — vollständiger Kartenpool eines Sets. Der TCGdex-Set-Endpoint liefert nur Karten-Briefs ohne Rarität/Preise, daher lädt die Route alle Kartendetails parallel (Concurrency 8) und hält das Ergebnis 6 h in einem In-Memory-Cache.

**Hinweis Serverless:** Der In-Memory-Cache lebt pro Server-Instanz. Auf Serverless-Plattformen mit kurzlebigen Instanzen (z. B. Vercel Functions) greift er nur eingeschränkt; für Produktionslast empfiehlt sich ein externer Cache (Redis o. Ä.) oder ISR.

## Datenfluss beim Booster-Öffnen

1. Client lädt `/api/sets/{setId}/pool` → `NormalizedCard[]`.
2. `openBooster` validiert das Profil und zieht mit `crypto.getRandomValues`-RNG (`createCryptoRng`) exakt `packSize` Karten. Für Tests existiert `createSeededRng` (mulberry32).
3. `buildRevealCards` löst je Karte den Preis über `resolveCardPrice` auf und markiert Bulk-Karten.
4. Beim Abschluss erzeugt `buildBoosterRecord` einen `BoosterRecord` inkl. G&V (`calculateProfit`) und bester Karte; `appendBooster` persistiert ihn in der Session.

## Zustands-Versionierung

- Session: Key `boosterbilanz.session`, Schema `{ version: 1, boosters: [...] }`. `migrateSession` verwirft defekte Einträge einzeln und rettet gültige Booster; unbekannte Versionen führen zu leerer Session, nie zu Laufzeitfehlern.
- Einstellungen: Key `boosterbilanz.settings`. `migrateSettings` merged unbekannte/fehlende Felder mit Defaults.

## Barrierefreiheit & Performance

- Vollständige Tastaturbedienung (Enter/Space zum Aufdecken, Escape schließt Dialoge), ARIA-Labels, `aria-live` für Kartenaufdeckungen, sichtbarer Fokus.
- `prefers-reduced-motion` und die App-Einstellung „reduzierte Animationen" deaktivieren Flip-/Partikeleffekte.
- Bilder als WebP (`low.webp` in Listen, `high.webp` im Simulator), Preload der jeweils nächsten Karte, Skeleton-Loader, keine Layout-Shifts durch feste Kartenmaße.

## Fehlerbehandlung

- `fetchJsonWithRetry`: 12 s Timeout (AbortController), 2 Retries mit Backoff, 404 → `null`.
- API-Routen antworten bei Upstream-Fehlern mit 502 und deutscher Fehlermeldung; die UI zeigt eine Meldung mit „Erneut laden".
- Fehlende Preise werden nie als 0,00 € dargestellt, sondern als „Kein Marktpreis verfügbar" und in der Auswertung separat gezählt („unvollständige Bewertung").
