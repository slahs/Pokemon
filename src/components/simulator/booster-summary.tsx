"use client";

import Image from "next/image";
import Link from "next/link";
import { APP_CONFIG } from "@/config/app-config";
import { formatEur, formatPercent } from "@/lib/calculations/format";
import type { BoosterRecord } from "@/types";

function Row({ label, value, emphasis }: { label: string; value: string; emphasis?: "gain" | "loss" }) {
  return (
    <div className="flex justify-between gap-4 text-sm py-1.5 border-b border-ink-800 last:border-0">
      <dt className="text-mist-300">{label}</dt>
      <dd
        className={`num ${emphasis === "gain" ? "text-gain-400" : emphasis === "loss" ? "text-loss-400" : ""}`}
      >
        {value}
      </dd>
    </div>
  );
}

export function BoosterSummary({
  record,
  onNextBooster,
}: {
  record: BoosterRecord;
  onNextBooster: () => void;
}) {
  const gross = record.grossProfitLoss;
  const net = record.netProfitLoss;
  const fees = record.grossCardValue - record.netCardValue;

  return (
    <section className="mt-8 grid gap-8 lg:grid-cols-[1fr_22rem] items-start" aria-label="Booster-Auswertung">
      <div>
        <h2 className="text-xl font-semibold mb-4">Gezogene Karten</h2>
        <ul className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 list-none p-0">
          {record.cards.map((card, i) => {
            const isBest = record.bestCard?.cardId === card.cardId && card.price === record.bestCard?.price;
            return (
              <li
                key={`${card.cardId}-${card.finish}-${i}`}
                className={`panel p-2 ${isBest ? "border-foil-400 holo-glow" : ""}`}
              >
                <div className="aspect-[5/7] rounded-lg overflow-hidden bg-ink-800">
                  {card.imageLow ? (
                    <Image
                      src={card.imageLow}
                      alt={`Karte ${card.name}`}
                      width={180}
                      height={252}
                      className="w-full h-full object-contain"
                      unoptimized
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-xs text-mist-500">
                      Kein Bild
                    </div>
                  )}
                </div>
                <p className="mt-2 text-xs leading-snug truncate" title={card.name}>
                  {isBest && <span aria-hidden="true">★ </span>}
                  {card.name}
                </p>
                <p className="num text-xs text-mist-300">
                  {card.price === null ? "Kein Marktpreis" : formatEur(card.price)}
                </p>
                {isBest && <p className="sr-only">Wertvollste Karte dieses Boosters</p>}
              </li>
            );
          })}
        </ul>
      </div>

      <aside className="panel p-5">
        <h2 className="font-semibold mb-3">Auswertung</h2>
        <dl>
          <Row label="Kartenwert" value={formatEur(record.grossCardValue)} />
          <Row label="Booster-Kaufpreis" value={formatEur(record.packPurchasePrice)} />
          <Row
            label="Brutto-Ergebnis"
            value={`${gross > 0 ? "+" : ""}${formatEur(gross)}`}
            emphasis={gross > 0 ? "gain" : gross < 0 ? "loss" : undefined}
          />
          <Row label="Geschätzte Verkaufsgebühren" value={formatEur(Math.round(fees * 100) / 100)} />
          <Row
            label="Netto-Ergebnis"
            value={`${net > 0 ? "+" : ""}${formatEur(net)}`}
            emphasis={net > 0 ? "gain" : net < 0 ? "loss" : undefined}
          />
          <Row label="ROI" value={record.roi === null ? "– (Kaufpreis 0 €)" : formatPercent(record.roi)} />
          <Row label="Karten ohne Marktpreis" value={String(record.missingPriceCount)} />
        </dl>
        {record.missingPriceCount > 0 && (
          <p className="mt-3 text-xs text-warn-300">
            Unvollständige Bewertung: {record.missingPriceCount} Karten ohne Marktpreis wurden
            nicht eingerechnet.
          </p>
        )}
        <p className="mt-3 text-xs text-mist-500">{APP_CONFIG.valueDisclaimer}</p>

        <div className="mt-5 flex flex-col gap-2">
          <button
            type="button"
            onClick={onNextBooster}
            className="rounded-lg bg-foil-400 text-ink-950 px-4 py-2.5 min-h-11 font-medium hover:bg-foil-300"
          >
            Nächsten Booster öffnen
          </button>
          <button
            type="button"
            onClick={onNextBooster}
            className="rounded-lg border border-ink-600 px-4 py-2.5 min-h-11 hover:border-foil-400"
            title="Öffnet einen neuen zufälligen Booster desselben Sets"
          >
            Booster wiederholen (neuer Zufall)
          </button>
          <Link
            href="/session"
            className="rounded-lg border border-ink-600 px-4 py-2.5 min-h-11 text-center hover:border-foil-400"
          >
            Session ansehen
          </Link>
        </div>
      </aside>
    </section>
  );
}
