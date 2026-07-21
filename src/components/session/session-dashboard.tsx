"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { clearSession, loadSession } from "@/lib/storage/session-storage";
import { exportSessionCsv, exportSessionJson } from "@/lib/storage/export";
import { formatDateTime, formatEur, formatPercent } from "@/lib/calculations/format";
import { computeSessionStats } from "@/lib/calculations/session-stats";
import type { BoosterRecord } from "@/types";

type SortMode = "time" | "value" | "profit";

function profitClass(v: number): string {
  return v > 0 ? "text-gain" : v < 0 ? "text-loss" : "";
}

function sign(v: number): string {
  return v > 0 ? "+" : "";
}

export function SessionDashboard() {
  const [boosters, setBoosters] = useState<BoosterRecord[] | null>(null);
  const [setFilter, setSetFilter] = useState("all");
  const [sort, setSort] = useState<SortMode>("time");
  const [confirmReset, setConfirmReset] = useState(false);
  const [openDetail, setOpenDetail] = useState<string | null>(null);

  useEffect(() => {
    setBoosters(loadSession().boosters);
  }, []);

  const setNames = useMemo(
    () => [...new Set((boosters ?? []).map((b) => b.setName))].sort(),
    [boosters],
  );

  const filtered = useMemo(() => {
    let list = boosters ?? [];
    if (setFilter !== "all") list = list.filter((b) => b.setName === setFilter);
    return [...list].sort((a, b) => {
      if (sort === "value") return b.grossCardValue - a.grossCardValue;
      if (sort === "profit") return b.netProfitLoss - a.netProfitLoss;
      return b.openedAt.localeCompare(a.openedAt);
    });
  }, [boosters, setFilter, sort]);

  const stats = useMemo(() => computeSessionStats(boosters ?? []), [boosters]);

  if (boosters === null) {
    return (
      <div
        className="panel h-48 animate-pulse"
        aria-busy="true"
        aria-label="Session wird geladen"
      />
    );
  }

  if (boosters.length === 0) {
    return (
      <div className="panel p-8 text-center text-mist-300">
        <p>Noch keine Booster in dieser Session geöffnet.</p>
        <p className="text-sm text-mist-500 mt-1">
          Wähle auf der Startseite ein Set aus, um zu beginnen.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {stats && (
        <section
          aria-label="Session-Übersicht"
          className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4"
        >
          {[
            ["Geöffnete Booster", String(stats.count)],
            ["Gesamtkosten", formatEur(stats.totalCost)],
            ["Theoretischer Kartenwert", formatEur(stats.totalValue)],
            [
              "Bruttoergebnis",
              `${sign(stats.totalGross)}${formatEur(stats.totalGross)}`,
              profitClass(stats.totalGross),
            ],
            [
              "Nettoergebnis",
              `${sign(stats.totalNet)}${formatEur(stats.totalNet)}`,
              profitClass(stats.totalNet),
            ],
            ["Ø Kartenwert / Booster", formatEur(stats.avgValue)],
            ["Ø ROI", stats.avgRoi === null ? "–" : formatPercent(stats.avgRoi)],
            ["Break-even-Quote", formatPercent(stats.breakEvenRate)],
            [
              "Bester Booster",
              stats.best
                ? `${sign(stats.best.netProfitLoss)}${formatEur(stats.best.netProfitLoss)}`
                : "–",
              stats.best ? profitClass(stats.best.netProfitLoss) : "",
            ],
            [
              "Schlechtester Booster",
              stats.worst
                ? `${sign(stats.worst.netProfitLoss)}${formatEur(stats.worst.netProfitLoss)}`
                : "–",
              stats.worst ? profitClass(stats.worst.netProfitLoss) : "",
            ],
            [
              "Wertvollster Pull",
              stats.bestPull ? `${stats.bestPull.name} (${formatEur(stats.bestPull.price)})` : "–",
            ],
            ["Karten ohne Marktpreis", String(stats.missingPrices)],
          ].map(([label, value, cls]) => (
            <div key={label} className="panel rounded-2xl p-4">
              <p className="text-xs text-text-dim">{label}</p>
              <p className={`num text-sm mt-1 break-words ${cls ?? ""}`}>{value}</p>
            </div>
          ))}
        </section>
      )}

      <section aria-label="Booster-Historie">
        <div className="flex flex-wrap gap-3 items-center mb-4">
          <h2 className="mr-auto font-display text-xl font-bold">Historie</h2>
          <label>
            <span className="sr-only">Nach Set filtern</span>
            <select
              value={setFilter}
              onChange={(e) => setSetFilter(e.target.value)}
              className="filter-control min-h-11 py-2"
            >
              <option value="all">Alle Sets</option>
              {setNames.map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span className="sr-only">Sortierung</span>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as SortMode)}
              className="filter-control min-h-11 py-2"
            >
              <option value="time">Nach Zeit</option>
              <option value="value">Nach Kartenwert</option>
              <option value="profit">Nach Gewinn</option>
            </select>
          </label>
          <button
            type="button"
            onClick={() => exportSessionCsv(boosters)}
            className="outline-button min-h-11 px-4 text-sm"
          >
            CSV exportieren
          </button>
          <button
            type="button"
            onClick={() => exportSessionJson(boosters)}
            className="outline-button min-h-11 px-4 text-sm"
          >
            JSON exportieren
          </button>
          <button
            type="button"
            onClick={() => setConfirmReset(true)}
            className="rounded-lg border border-loss-400/50 text-loss px-3 py-2 min-h-11 text-sm hover:border-loss-400"
          >
            Session zurücksetzen
          </button>
        </div>

        {confirmReset && (
          <div
            role="alertdialog"
            aria-label="Session löschen bestätigen"
            className="panel mb-4 border-loss/60 p-5"
          >
            <p className="text-sm">
              Wirklich alle {boosters.length} gespeicherten Booster unwiderruflich löschen?
            </p>
            <div className="mt-3 flex gap-2">
              <button
                type="button"
                onClick={() => {
                  setBoosters(clearSession().boosters);
                  setConfirmReset(false);
                }}
                className="accent-button min-h-11 bg-loss px-4 text-sm"
              >
                Ja, löschen
              </button>
              <button
                type="button"
                onClick={() => setConfirmReset(false)}
                className="outline-button min-h-11 px-4 text-sm"
              >
                Abbrechen
              </button>
            </div>
          </div>
        )}

        <ul className="space-y-3 list-none p-0">
          {filtered.map((b) => (
            <li key={b.id} className="panel rounded-2xl p-5">
              <button
                type="button"
                onClick={() => setOpenDetail(openDetail === b.id ? null : b.id)}
                aria-expanded={openDetail === b.id}
                className="w-full text-left flex flex-wrap gap-x-6 gap-y-1 items-baseline"
              >
                <span className="text-sm text-text-dim">{formatDateTime(b.openedAt)}</span>
                <span className="font-medium">{b.setName}</span>
                <span className="num text-sm">Wert: {formatEur(b.grossCardValue)}</span>
                <span className={`num text-sm ${profitClass(b.netProfitLoss)}`}>
                  Netto: {sign(b.netProfitLoss)}
                  {formatEur(b.netProfitLoss)}
                </span>
                <span className="num text-sm text-mist-500">
                  ROI: {b.roi === null ? "–" : formatPercent(b.roi)}
                </span>
                {b.missingPriceCount > 0 && (
                  <span className="text-xs text-warn">{b.missingPriceCount} ohne Preis</span>
                )}
                <span className="ml-auto text-sm text-text-dim">
                  {openDetail === b.id ? "Schließen" : "Details"}
                </span>
              </button>
              {openDetail === b.id && (
                <div className="mt-4 grid grid-cols-3 sm:grid-cols-5 lg:grid-cols-10 gap-2">
                  {b.cards.map((card, i) => (
                    <figure key={`${card.cardId}-${i}`} className="text-center">
                      <div className="aspect-[5/7] overflow-hidden rounded-lg bg-panel-solid">
                        {card.imageLow ? (
                          <Image
                            src={card.imageLow}
                            alt={`Karte ${card.name}`}
                            width={100}
                            height={140}
                            className="w-full h-full object-contain"
                            unoptimized
                          />
                        ) : (
                          <span className="text-[0.6rem] text-mist-500">Kein Bild</span>
                        )}
                      </div>
                      <figcaption className="num mt-1 text-[0.65rem] text-text-dim">
                        {card.price === null ? "–" : formatEur(card.price)}
                      </figcaption>
                    </figure>
                  ))}
                </div>
              )}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
