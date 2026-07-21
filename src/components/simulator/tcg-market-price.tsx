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
  id: string;
  name: string;
  releaseDate: string | null;
  cardCountOfficial: number | null;
  cardCountTotal: number | null;
};

type LookupBody = {
  cardId: string;
  setName: string;
  releaseDate: string | null;
  cardCount: number | null;
  localId: string;
  finish: CardFinish;
};

let setMetadataPromise: Promise<SetMetadata[]> | null = null;
const marketLookupCache = new Map<string, Promise<TcgMarketLookupResponse>>();

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

function requestMarketLookup(body: LookupBody): Promise<TcgMarketLookupResponse> {
  const key = JSON.stringify(body);
  const cached = marketLookupCache.get(key);
  if (cached) return cached;

  const request = fetch("/api/tcg-market", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  })
    .then(async (response) => {
      if (!response.ok) throw new Error("TCG-Marktpreis konnte nicht geladen werden.");
      return response.json() as Promise<TcgMarketLookupResponse>;
    })
    .catch((error) => {
      marketLookupCache.delete(key);
      throw error;
    });

  marketLookupCache.set(key, request);
  return request;
}

function statusLabel(status: LoadState["status"]): string {
  if (status === "missing-key") return "API-Key nicht verfügbar";
  if (status === "set-not-found") return "Set nicht eindeutig zugeordnet";
  if (status === "card-not-found") return "Karte nicht eindeutig zugeordnet";
  if (status === "price-not-found") return "noch kein Preis verfügbar";
  return "Preis konnte nicht geladen werden";
}

export function TcgMarketPrice(props: {
  cardId?: string;
  setName: string;
  releaseDate?: string | null;
  cardCount?: number | null;
  localId: string;
  finish: CardFinish;
  compact?: boolean;
  className?: string;
  showDisclaimer?: boolean;
}) {
  const [state, setState] = useState<LoadState>({ status: "idle", quote: null });

  useEffect(() => {
    let cancelled = false;
    setState({ status: "loading", quote: null });

    void (async () => {
      let cardId = props.cardId ?? "";
      let releaseDate = props.releaseDate ?? null;
      let cardCount = props.cardCount ?? null;

      if (!cardId) {
        const sets = await loadSetMetadata();
        const set = sets.find((candidate) => candidate.name === props.setName);
        cardId = set ? `${set.id}-${props.localId}` : "";
        releaseDate ??= set?.releaseDate ?? null;
        cardCount ??= set?.cardCountOfficial ?? set?.cardCountTotal ?? null;
      }

      const result = await requestMarketLookup({
        cardId,
        setName: props.setName,
        releaseDate,
        cardCount,
        localId: props.localId,
        finish: props.finish,
      });
      if (!cancelled) setState(result);
    })().catch(() => {
      if (!cancelled) setState({ status: "error", quote: null });
    });

    return () => {
      cancelled = true;
    };
  }, [
    props.cardId,
    props.setName,
    props.releaseDate,
    props.cardCount,
    props.localId,
    props.finish,
  ]);

  const baseClass = props.className ?? "";

  if (state.status === "idle" || state.status === "loading") {
    return (
      <p className={`${props.compact ? "text-[0.68rem]" : "text-xs"} text-text-dim ${baseClass}`}>
        {props.compact ? "TCG: lädt …" : "TCGPlayer: Preis wird geladen …"}
      </p>
    );
  }

  if (state.status !== "ready" || !state.quote) {
    return (
      <p className={`${props.compact ? "text-[0.68rem]" : "text-xs"} text-text-dim ${baseClass}`}>
        {props.compact ? `TCG: ${statusLabel(state.status)}` : `TCGPlayer: ${statusLabel(state.status)}`}
      </p>
    );
  }

  const quote = state.quote;
  const primary = quote.marketUsd ?? quote.lowUsd ?? quote.medianUsd;

  if (props.compact) {
    return (
      <p className={`num text-[0.68rem] text-accent-cyan ${baseClass}`}>
        TCG: {formatUsd(primary)} USD{quote.printing ? ` · ${quote.printing}` : ""}
      </p>
    );
  }

  return (
    <p className={`text-xs leading-relaxed text-text-muted ${baseClass}`}>
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
      {(props.showDisclaimer ?? true) && (
        <span className="block text-[0.68rem] text-text-dim">
          Nur Vergleichswert, nicht Teil der Bilanz.
        </span>
      )}
    </p>
  );
}
