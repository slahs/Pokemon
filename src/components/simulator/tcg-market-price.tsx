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

type SetMetadata = {
  name: string;
  releaseDate: string | null;
  cardCountOfficial: number | null;
  cardCountTotal: number | null;
};

let setMetadataPromise: Promise<SetMetadata[]> | null = null;

function loadSetMetadata(): Promise<SetMetadata[]> {
  setMetadataPromise ??= fetch("/api/sets")
    .then(async (response) => {
      if (!response.ok) return [];
      const body = (await response.json()) as { sets?: SetMetadata[] };
      return body.sets ?? [];
    })
    .catch(() => []);
  return setMetadataPromise;
}

export function TcgMarketPrice(props: {
  cardId: string;
  setName: string;
  releaseDate?: string | null;
  cardCount?: number | null;
  localId: string;
  finish: CardFinish;
}) {
  const [state, setState] = useState<LoadState>({ status: "idle", quote: null });

  useEffect(() => {
    const controller = new AbortController();
    setState({ status: "loading", quote: null });

    void (async () => {
      let releaseDate = props.releaseDate ?? null;
      let cardCount = props.cardCount ?? null;

      if (!releaseDate || cardCount === null) {
        const sets = await loadSetMetadata();
        const set = sets.find((candidate) => candidate.name === props.setName);
        releaseDate ??= set?.releaseDate ?? null;
        cardCount ??= set?.cardCountOfficial ?? set?.cardCountTotal ?? null;
      }

      const response = await fetch("/api/tcg-market", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cardId: props.cardId,
          setName: props.setName,
          releaseDate,
          cardCount,
          localId: props.localId,
          finish: props.finish,
        }),
        signal: controller.signal,
      });
      if (!response.ok) throw new Error("TCG-Marktpreis konnte nicht geladen werden.");
      const result = (await response.json()) as TcgMarketLookupResponse;
      if (!controller.signal.aborted) setState(result);
    })().catch(() => {
      if (!controller.signal.aborted) setState({ status: "error", quote: null });
    });

    return () => controller.abort();
  }, [
    props.cardId,
    props.setName,
    props.releaseDate,
    props.cardCount,
    props.localId,
    props.finish,
  ]);

  if (state.status === "idle" || state.status === "loading") {
    return <p className="text-xs text-text-dim">TCGPlayer: Preis wird geladen …</p>;
  }

  if (state.status !== "ready" || !state.quote) {
    const label =
      state.status === "missing-key"
        ? "API-Key nicht verfügbar"
        : state.status === "set-not-found"
          ? "Set nicht eindeutig zugeordnet"
          : state.status === "card-not-found"
            ? "Karte nicht eindeutig zugeordnet"
            : "noch kein Preis verfügbar";
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
      <span className="block text-[0.68rem] text-text-dim">
        Nur Vergleichswert, nicht Teil der Bilanz.
      </span>
    </p>
  );
}
