# Simulationsmodelle und Quellenlage

**Wichtig:** Alle Profile in dieser App tragen `confidence: "estimated"`. Es handelt sich um **geschätzte Simulationsmodelle, keine offiziellen Pull Rates.** The Pokémon Company veröffentlicht keine offiziellen Ziehungswahrscheinlichkeiten. Die UI zeigt diesen Hinweis im Simulator dauerhaft an.

## Vorgehen bei der Modellbildung

Die Slot-Strukturen (Anzahl Commons/Uncommons, Reverse-Slots, Rare-Slot) orientieren sich an der allgemein bekannten, physisch beobachtbaren Zusammensetzung von Booster-Packungen der jeweiligen Ära. Die Upgrade-Wahrscheinlichkeiten (z. B. Chance auf Ultra Rare im Rare-Slot) sind **konservative Schätzungen** in der Größenordnung community-üblicher Erfahrungswerte. Sie wurden bewusst nicht als exakte Community-Zahlen übernommen, da diese je nach Stichprobe stark schwanken und keine belastbare Quelle darstellen.

## Profile

### `sv-standard` — Scarlet & Violet Standard (10 Karten)

- 4 × Common, 3 × Uncommon (normal)
- 2 × Reverse-Slot; einer davon mit Upgrade-Chance: Illustration Rare 8 %, Special Illustration Rare 1,5 %
- 1 × Rare-Slot; Upgrades: Double Rare 13 %, Ultra Rare 6 %, Hyper/Secret 1 %

### `sv-special` — SV-Spezialsets (sv03.5, sv04.5, sv06.5, sv08.5)

Wie SV-Standard, zusätzlich Shiny-Chance-Slot (nur Paldeas Schicksale u. ä. enthalten Shinies): Shiny Rare 12 %, Shiny Ultra Rare 3 %, Illustration Rare 5 %. Referenzset der App: **Paldeas Schicksale (sv04.5)**.

### `swsh-standard` — Sword & Shield Standard (10 Karten)

Klassische SWSH-Struktur mit Reverse-Slot und Rare-Slot; Amazing-/Radiant-Upgrade 4 %.

### `vintage` — ältere Sets (11 Karten)

7 × Common, 3 × Uncommon, 1 × Rare mit Holo-Chance 33 % (klassisches „1:3"-Erfahrungsmodell).

## Bekannte Vereinfachungen

- Energiekarten werden nicht simuliert (aus dem Wert-Pool gefiltert), da sie den Kartenwert praktisch nicht beeinflussen.
- „God Packs" und regionale Sonderfälle sind nicht modelliert.
- Fehlt eine Zielrarität im realen Kartenpool eines Sets, fällt die Engine deterministisch auf die nächste verfügbare Rarität zurück, damit immer exakt `packSize` Karten entstehen.

## Eigene Profile ergänzen

Neue Profile werden in `src/config/simulation-profiles/` angelegt und in `index.ts` registriert. `applicableSetIds` unterstützt exakte IDs (`"sv04.5"`) und Präfixe (`"sv*"`); exakte Treffer haben Vorrang. `validateProfile` erzwingt: Slot-Summe = `packSize`, Gewichte > 0, Upgrade-Wahrscheinlichkeiten kumulativ ≤ 1.
