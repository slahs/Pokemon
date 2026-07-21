"use client";

import { formatEur } from "@/lib/calculations/format";

function ProfitValue({ value, label }: { value: number; label: string }) {
  const positive = value > 0;
  const negative = value < 0;
  return (
    <span
      className={`num font-medium ${positive ? "text-gain-400" : negative ? "text-loss-400" : ""}`}
    >
      {/* Vorzeichen und Text, nicht nur Farbe */}
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
    { label: "Kaufpreis", value: <span className="num">{formatEur(props.packPrice)}</span> },
    {
      label: "Kartenwert",
      value: props.showResults ? (
        <span className="num">
          {formatEur(props.cardValue)}
          {props.incomplete ? " *" : ""}
        </span>
      ) : (
        <span className="text-mist-500">–</span>
      ),
    },
    {
      label: "Brutto",
      value: props.showResults ? (
        <ProfitValue value={props.gross} label="Brutto" />
      ) : (
        <span className="text-mist-500">–</span>
      ),
    },
    {
      label: "Netto",
      value: props.showResults ? (
        <ProfitValue value={props.net} label="Netto" />
      ) : (
        <span className="text-mist-500">–</span>
      ),
    },
    { label: "Session", value: <ProfitValue value={props.sessionNet} label="Session" /> },
  ];

  return (
    <section aria-label="Statistik" className="panel px-4 py-3">
      <dl className="grid grid-cols-2 sm:grid-cols-5 gap-x-4 gap-y-2 text-sm">
        {items.map((item) => (
          <div key={item.label} className="min-w-0">
            <dt className="text-xs text-mist-500">{item.label}</dt>
            <dd className="truncate">{item.value}</dd>
          </div>
        ))}
      </dl>
      {props.incomplete && props.showResults && (
        <p className="text-xs text-warn-300 mt-2">
          * Unvollständige Bewertung – nicht alle Karten haben einen Marktpreis.
        </p>
      )}
    </section>
  );
}
