"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { APP_CONFIG } from "@/config/app-config";
import { formatEur, formatPercent, formatUsd } from "@/lib/calculations/format";
import { RarityCardSurface } from "@/components/cards/rarity-card-surface";
import {
  TcgMarketPrice,
  type TcgMarketSettledResult,
} from "@/components/simulator/tcg-market-price";
import type { BoosterRecord, BoosterResultCard } from "@/types";

const FINISH_LABELS = {
  normal: "Normal",
  reverse: "Reverse Holo",
  holo: "Holo",
} as const;

function Row({
  label,
  value,
  emphasis,
}: {
  label: string;
  value: string;
  emphasis?: "gain" | "loss";
}) {
  return (
    <div className="flex justify-between gap-4 border-b border-white/8 py-2.5 text-sm last:border-0">
      <dt className="text-text-muted">{label}</dt>
      <dd
        className={`num text-right ${emphasis === "gain" ? "text-gain" : emphasis === "loss" ? "text-loss" : ""}`}
      >
        {value}
      </dd>
    </div>
  );
}

function cardResultKey(card: BoosterResultCard, index: number): string {
  return `${card.cardId}-${card.finish}-${index}`;
}

function quoteValue(result: TcgMarketSettledResult | undefined): number | null {
  if (result?.status !== "ready" || !result.quote) return null;
  return result.quote.marketUsd ?? result.quote.lowUsd ?? result.quote.medianUsd;
}

export function BoosterSummary({
  record,
  onNextBooster,
}: {
  record: BoosterRecord;
  onNextBooster: () => void;
}) {
  const [selectedCard, setSelectedCard] = useState<BoosterResultCard | null>(null);
  const [tcgResults, setTcgResults] = useState<Record<string, TcgMarketSettledResult>>({});
  const gross = record.grossProfitLoss;
  const net = record.netProfitLoss;
  const fees = record.grossCardValue - record.netCardValue;

  useEffect(() => {
    setTcgResults({});
    setSelectedCard(null);
  }, [record.id]);

  useEffect(() => {
    if (!selectedCard) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setSelectedCard(null);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [selectedCard]);

  const registerTcgResult = useCallback((key: string, result: TcgMarketSettledResult) => {
    setTcgResults((current) => {
      const previous = current[key];
      if (previous?.status === result.status && previous.quote === result.quote) return current;
      return { ...current, [key]: result };
    });
  }, []);

  const tcgSummary = useMemo(() => {
    let total = 0;
    let resolvedCount = 0;
    let pricedCount = 0;

    record.cards.forEach((card, index) => {
      const result = tcgResults[cardResultKey(card, index)];
      if (!result) return;
      resolvedCount++;
      const value = quoteValue(result);
      if (value !== null) {
        total += value;
        pricedCount++;
      }
    });

    return { total, resolvedCount, pricedCount };
  }, [record.cards, tcgResults]);

  const tcgTotalLabel = useMemo(() => {
    if (tcgSummary.resolvedCount === 0) return "wird geladen …";
    if (tcgSummary.resolvedCount < record.cards.length) {
      return `${formatUsd(tcgSummary.total)} USD · ${tcgSummary.resolvedCount}/${record.cards.length} geladen`;
    }
    if (tcgSummary.pricedCount === 0) return "Keine TCGPlayer-Preise";
    const coverage =
      tcgSummary.pricedCount < record.cards.length
        ? ` · ${tcgSummary.pricedCount}/${record.cards.length} mit Preis`
        : "";
    return `${formatUsd(tcgSummary.total)} USD${coverage}`;
  }, [record.cards.length, tcgSummary]);

  return (
    <>
      <section
        className="screen-rise mt-8 grid items-start gap-7 lg:grid-cols-[1fr_22rem]"
        aria-label="Booster-Auswertung"
      >
        <div>
          <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
            <h2 className="font-display text-[22px] font-bold">Gezogene Karten</h2>
            <p className="font-numeric text-[0.68rem] uppercase tracking-[0.1em] text-text-dim">
              Karte anklicken zum Ansehen
            </p>
          </div>
          <ul className="grid list-none grid-cols-2 gap-3 p-0 sm:grid-cols-3 lg:grid-cols-4">
            {record.cards.map((card, index) => {
              const resultKey = cardResultKey(card, index);
              const isBest =
                record.bestCard?.cardId === card.cardId && card.price === record.bestCard?.price;
              return (
                <li
                  key={resultKey}
                  className={`panel overflow-hidden ${isBest ? "border-warn holo-glow" : ""}`}
                >
                  <button
                    type="button"
                    onClick={() => setSelectedCard(card)}
                    className="group block h-full w-full p-2.5 text-left"
                    aria-label={`${card.name} erneut ansehen`}
                  >
                    <RarityCardSurface
                      rarity={card.rarity}
                      finish={card.finish}
                      interactive={false}
                      className="aspect-[5/7] rounded-xl bg-panel-solid"
                    >
                      {card.imageLow ? (
                        <Image
                          src={card.imageLow}
                          alt={`Karte ${card.name}`}
                          width={180}
                          height={252}
                          className="h-full w-full object-contain transition-transform duration-200 group-hover:scale-[1.035]"
                          unoptimized
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-xs text-mist-500">
                          Kein Bild
                        </div>
                      )}
                    </RarityCardSurface>
                    <p className="mt-2 truncate text-xs leading-snug" title={card.name}>
                      {isBest && <span aria-hidden="true">★ </span>}
                      {card.name}
                    </p>
                    <p className="num text-xs text-mist-300">
                      {card.price === null ? "Kein Cardmarket-Preis" : formatEur(card.price)}
                    </p>
                    <TcgMarketPrice
                      compact
                      showDisclaimer={false}
                      cardId={card.cardId}
                      setName={record.setName}
                      localId={card.localId}
                      finish={card.finish}
                      className="mt-0.5 line-clamp-2"
                      onResult={(result) => registerTcgResult(resultKey, result)}
                    />
                    {isBest && <p className="sr-only">Wertvollste Karte dieses Boosters</p>}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>

        <aside className="panel p-6">
          <h2 className="mb-3 font-display text-lg font-bold">Auswertung</h2>
          <dl>
            <Row label="Cardmarket-Kartenwert" value={formatEur(record.grossCardValue)} />
            <Row label="TCGPlayer-Gesamtwert" value={tcgTotalLabel} />
            <Row label="Booster-Kaufpreis" value={formatEur(record.packPurchasePrice)} />
            <Row
              label="Brutto-Ergebnis"
              value={`${gross > 0 ? "+" : ""}${formatEur(gross)}`}
              emphasis={gross > 0 ? "gain" : gross < 0 ? "loss" : undefined}
            />
            <Row
              label="Geschätzte Verkaufsgebühren"
              value={formatEur(Math.round(fees * 100) / 100)}
            />
            <Row
              label="Netto-Ergebnis"
              value={`${net > 0 ? "+" : ""}${formatEur(net)}`}
              emphasis={net > 0 ? "gain" : net < 0 ? "loss" : undefined}
            />
            <Row
              label="ROI"
              value={record.roi === null ? "– (Kaufpreis 0 €)" : formatPercent(record.roi)}
            />
            <Row label="Karten ohne Marktpreis" value={String(record.missingPriceCount)} />
          </dl>
          {record.missingPriceCount > 0 && (
            <p className="mt-3 text-xs text-warn">
              Unvollständige Bewertung: {record.missingPriceCount} Karten ohne Marktpreis wurden nicht
              eingerechnet.
            </p>
          )}
          <p className="mt-3 text-xs leading-relaxed text-text-dim">{APP_CONFIG.valueDisclaimer}</p>
          <p className="mt-2 text-xs leading-relaxed text-text-dim">
            TCGPlayer-Werte werden in USD nur zum Vergleich summiert und nicht in die Euro-Bilanz
            eingerechnet.
          </p>

          <div className="mt-5 flex flex-col gap-2">
            <button type="button" onClick={onNextBooster} className="accent-button min-h-11 px-4">
              Nächsten Booster öffnen
            </button>
            <Link href="/session" className="outline-button min-h-11 px-4 text-center">
              Session ansehen
            </Link>
          </div>
        </aside>
      </section>

      {selectedCard && (
        <div
          className="fixed inset-0 z-[80] flex items-center justify-center bg-[oklch(0.08_0.03_275/0.88)] p-4 backdrop-blur-md"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setSelectedCard(null);
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label={`${selectedCard.name} ansehen`}
            className="panel relative max-h-[92vh] w-full max-w-[760px] overflow-y-auto p-5 sm:p-7"
          >
            <button
              type="button"
              onClick={() => setSelectedCard(null)}
              className="outline-button absolute right-4 top-4 z-10 h-10 w-10 p-0 text-lg"
              aria-label="Kartenansicht schließen"
            >
              ×
            </button>

            <div className="grid items-start gap-6 sm:grid-cols-[minmax(240px,330px)_1fr]">
              <RarityCardSurface
                rarity={selectedCard.rarity}
                finish={selectedCard.finish}
                className="mx-auto aspect-[5/7] w-full max-w-[330px] rounded-[18px] bg-panel-solid"
              >
                {selectedCard.imageHigh ?? selectedCard.imageLow ? (
                  <Image
                    src={(selectedCard.imageHigh ?? selectedCard.imageLow) as string}
                    alt={`Karte ${selectedCard.name}`}
                    width={660}
                    height={924}
                    className="h-full w-full object-contain"
                    unoptimized
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-sm text-text-dim">
                    Kein Kartenbild verfügbar
                  </div>
                )}
              </RarityCardSurface>

              <div className="pt-10 sm:pt-3">
                <p className="font-numeric text-xs uppercase tracking-[0.12em] text-text-dim">
                  {record.setName}
                </p>
                <h3 className="mt-2 font-display text-2xl font-bold">{selectedCard.name}</h3>
                <p className="mt-1 text-sm text-text-muted">
                  Nr. {selectedCard.localId} · {selectedCard.rarity ?? "Rarität unbekannt"} ·{" "}
                  {FINISH_LABELS[selectedCard.finish]}
                </p>

                <div className="mt-6 space-y-3 rounded-2xl border border-white/10 bg-white/[0.035] p-4">
                  <div>
                    <p className="text-xs uppercase tracking-[0.08em] text-text-dim">Cardmarket</p>
                    <p className="num mt-1 text-xl font-bold">
                      {selectedCard.price === null ? "Kein Marktpreis" : formatEur(selectedCard.price)}
                    </p>
                  </div>
                  <div className="border-t border-white/8 pt-3">
                    <TcgMarketPrice
                      cardId={selectedCard.cardId}
                      setName={record.setName}
                      localId={selectedCard.localId}
                      finish={selectedCard.finish}
                    />
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedCard(null)}
                  className="accent-button mt-6 min-h-11 px-6"
                >
                  Zurück zur Auswertung
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
