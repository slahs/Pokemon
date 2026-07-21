"use client";

import Image from "next/image";
import Link from "next/link";
import { APP_CONFIG } from "@/config/app-config";
import { formatEur, formatPercent } from "@/lib/calculations/format";
import type { BoosterRecord } from "@/types";

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
        className={`num ${emphasis === "gain" ? "text-gain" : emphasis === "loss" ? "text-loss" : ""}`}
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
    <section
      className="screen-rise mt-8 grid items-start gap-7 lg:grid-cols-[1fr_22rem]"
      aria-label="Booster-Auswertung"
    >
      <div>
        <h2 className="mb-4 font-display text-[22px] font-bold">Gezogene Karten</h2>
        <ul className="grid list-none grid-cols-2 gap-3 p-0 sm:grid-cols-3 lg:grid-cols-4">
          {record.cards.map((card, i) => {
            const isBest =
              record.bestCard?.cardId === card.cardId && card.price === record.bestCard?.price;
            return (
              <li
                key={`${card.cardId}-${card.finish}-${i}`}
                className={`panel p-2.5 ${isBest ? "border-warn holo-glow" : ""}`}
              >
                <div className="aspect-[5/7] overflow-hidden rounded-xl bg-panel-solid">
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

      <aside className="panel p-6">
        <h2 className="mb-3 font-display text-lg font-bold">Auswertung</h2>
        <dl>
          <Row label="Kartenwert" value={formatEur(record.grossCardValue)} />
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
  );
}
