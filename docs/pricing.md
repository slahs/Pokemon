# Preislogik

## Datenquelle

Preise stammen aus dem `pricing.cardmarket`-Block der TCGdex-Kartendetails (EUR, Cardmarket-Daten). Jede Karte trägt den Preisstand (`pricingUpdatedAt`), der in der UI angezeigt wird.

## Preisvarianten

`normalizePrices` bildet die Rohfelder auf drei Varianten ab:

| Variante | Quelle |
|---|---|
| `normal` | Standardfelder (`trend`, `avg`, `avg1`, `avg7`, `avg30`, `low`) |
| `reverse` | Holo-Felder (`trend-holo`, `avg-holo`, …) — Cardmarket führt Reverse unter den Holo-Preisen |
| `holo` | Holo-Felder |

## Preismodi und Fallback-Kette

Der Nutzer wählt in den Einstellungen einen Modus: `trend` (Standard), `average`, `avg1`, `avg7`, `avg30`, `low`.

`resolveCardPrice(card, finish, mode)` löst den Preis so auf:

1. **Variante wählen:** Für `holo`/`reverse` die jeweilige Varianten-Preistabelle; existiert sie nicht, Fallback auf die Standardvariante — das Ergebnis trägt dann `usedFallbackFinish: true` und die UI zeigt „Preis der Standardvariante".
2. **Feld-Fallback-Kette:** Wunschfeld → `avg7` → `avg30` → `average` → `low`. Erst wenn alle Felder leer sind, gilt der Preis als fehlend.
3. **Rückgabe:** `{ price, usedField, usedVariant, usedFallbackFinish, usedFallbackField, updatedAt, missing }`.

## Fehlende Preise

- Fehlende Preise werden **nie als 0,00 €** dargestellt, sondern als „Kein Marktpreis verfügbar".
- In G&V-Berechnungen zählen sie mit 0 in die Summe, werden aber separat als `missingPriceCount` ausgewiesen; die Auswertung markiert die Bewertung als **unvollständig**.
- Karten ohne Preis werden nie automatisch als Bulk übersprungen.

## Gewinn/Verlust-Formeln

```
grossCardValue    = Σ Kartenpreise (fehlende = 0, separat gezählt)
grossProfitLoss   = grossCardValue − Kaufpreis
netCardValue      = grossCardValue × (1 − Gebühr%) − Fixkosten
netProfitLoss     = netCardValue − Kaufpreis
roi               = netProfitLoss / Kaufpreis   (bei Kaufpreis 0: null → UI zeigt „–")
```

Alle Beträge werden auf 2 Nachkommastellen gerundet und mit `Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR" })` formatiert.

## Disclaimer

Die App zeigt dauerhaft: Der berechnete Kartenwert ist ein **theoretischer Marktwert** auf Basis von Cardmarket-Daten. Tatsächliche Verkaufserlöse können deutlich abweichen (Zustand, Nachfrage, Verkaufsgebühren, Versand).
