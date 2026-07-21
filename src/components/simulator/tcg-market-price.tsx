"use client";

import { useEffect, useState } from "react";
import type { CardFinish } from "@/types";
import type {
  TcgMarketLookupResponse,
  TcgMarketQuote,
} from "@/lib/api/tcgapi-matching";
import { formatUsd } from "@/lib/calculations/format";

type LoadState =
  | { status: "idle" | "loading"; quote: null }
  | { status: TcgMarketLookupResponse["status"]; quote: TcgMarketQuote | null }
  | { status: "error"; quote: null };

export function TcgMarketPrice(props: {
  setName: string;
  releaseDate: string | null;
  cardCount: number | null;
  localId: string;
  finish: CardFinish;
}) {
  const [state, setState] = useState<LoadState>({ status: "idle", quote: null });

  useEffect(() => {
    const controller = new AbortController();
    setState({ status: "loading", quote: null });

    fetch("/api/tcg-market", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(props),
      signal: controller.signal,
    })
      .then(async (response) => {
        if (!response.ok) throw new Error("TCG-Marktpreis konnte nicht geladen werden.");
        return response.json() as Promise<TcgMarketLookupResponse>;
      })
      .then((result) => {
        if (!controller.signal.aborted) setState(result);
      })
      .catch(() => {
        if (!controller.signal.aborted) setState({ status: "error", quote: null });
      });

    return () => controller.abort();
  }, [props.setName, props.releaseDate, props.cardCount, props.localId, props.finish]);

  if (state.status === "idle" || state.status === "loading") {
    return <p className="text-xs text-text-dim">TCGPlayer: Preis wird geladen …</p>;
  }

  if (state.status !== "ready" || !state.quote) {
    const label =
      state.status === "missing-key"
        ? "API-Key nicht verfügbar"
        : state.status === "set-not-found" || state.status === "card-not-found"
          ? "Karte nicht eindeutig zugeordnet"
          : "kein Preis verfügbar";
    return <p className="text-xs text-text-dim">TCGPlayer: {label}</p>;
  }

  const quote = state.quote;
  const primary = quote.marketUsd ?? quote.lowUsd ?? quote.medianUsd;
  return (
    <p className="text-xs leading-relaxed text-text-muted">
      TCGPlayer: {formatUsd(primary)} USD
      {quote.printing ? ` · ${quote.printing}` : ""}
      {quote.tcgplayerUrl ? (
        <>
          {" · "}
          <a
            href={quote.tcgplayerUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-accent-cyan hover:text-foil-300"
          >
            Markt ansehen
          </a>
        </>
      ) : null}
      <span className="block text-[0.68rem] text-text-dim">Nur Vergleichswert, nicht Teil der Bilanz.</span>
    </p>
  );
}
