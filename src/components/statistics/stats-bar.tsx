"use client";

import { formatEur } from "@/lib/calculations/format";

function ProfitValue({ value, label }: { value: number; label: string }) {
  const positive = value > 0;
  const negative = value < 0;
  return (
    <span className={`num font-bold ${positive ? "text-gain" : negative ? "text-loss" : ""}`}>
      {positive ? "+" : ""}
      {formatEur(value)}
      <span className="sr-only">
        {" "}
        ({label}: {positive ? "Gewinn" : negative ? "Verlust" : "ausgeglichen"})
      </span>
    </span>
  );
}

export function StatsBar(props: {
  packPrice: number;
  cardValue: number;
  gross: number;
  net: number;
  sessionNet: number;
  incomplete: boolean;
  showResults: boolean;
}) {
  const items: { label: string; value: React.ReactNode }[] = [
    {
      label: "Kaufpreis",
      value: <span className="num font-bold">{formatEur(props.packPrice)}</span>,
    },
    {
      label: "Kartenwert",
      value: props.showResults ? (
        <span className="num font-bold">
          {formatEur(props.cardValue)}
          {props.incomplete ? " *" : ""}
        </span>
      ) : (
        <span className="text-text-dim">–</span>
      ),
    },
    {
      label: "Brutto",
      value: props.showResults ? (
        <ProfitValue value={props.gross} label="Brutto" />
      ) : (
        <span className="text-text-dim">–</span>
      ),
    },
    {
      label: "Netto",
      value: props.showResults ? (
        <ProfitValue value={props.net} label="Netto" />
      ) : (
        <span className="text-text-dim">–</span>
      ),
    },
    { label: "Session", value: <ProfitValue value={props.sessionNet} label="Session" /> },
  ];

  return (
    <section aria-label="Statistik" className="panel px-5 py-4">
      <dl className="grid grid-cols-2 gap-x-5 gap-y-4 sm:grid-cols-5">
        {items.map((item) => (
          <div key={item.label} className="min-w-0">
            <dt className="mb-1 text-[11.5px] uppercase tracking-[0.06em] text-text-dim">
              {item.label}
            </dt>
            <dd className="truncate font-numeric text-lg">{item.value}</dd>
          </div>
        ))}
      </dl>
      {props.incomplete && props.showResults && (
        <p className="mt-3 text-xs text-warn">
          * Unvollständige Bewertung – nicht alle Karten haben einen Marktpreis.
        </p>
      )}
    </section>
  );
}
