import type { CardFinish } from "@/types";

export type TcgApiSetCandidate = {
  id: number;
  name: string;
  releaseDate: string | null;
  cardCount: number | null;
};

export type TcgApiCardCandidate = {
  id: number;
  name: string;
  number: string;
  productType: string | null;
  tcgplayerUrl: string | null;
};

export type TcgApiPriceCandidate = {
  printing: string | null;
  marketPrice: number | null;
  lowPrice: number | null;
  medianPrice: number | null;
  updatedAt: string | null;
};

export type TcgMarketQuote = {
  marketUsd: number | null;
  lowUsd: number | null;
  medianUsd: number | null;
  printing: "Normal" | "Foil" | null;
  updatedAt: string | null;
  tcgplayerUrl: string | null;
};

export type TcgMarketLookupStatus =
  | "ready"
  | "missing-key"
  | "set-not-found"
  | "card-not-found"
  | "price-not-found";

export type TcgMarketLookupResponse = {
  status: TcgMarketLookupStatus;
  quote: TcgMarketQuote | null;
};

export function normalizeComparableText(value: string): string {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("en")
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "")
    .trim();
}

export function normalizeCardNumber(value: string): string {
  const firstPart = value.trim().split("/")[0] ?? value;
  return firstPart
    .toLocaleLowerCase("en")
    .replace(/[^a-z0-9]/g, "")
    .replace(/^0+(?=\d)/, "")
    .replace(/([a-z])0+(?=\d)/g, "$1");
}

function setScore(
  candidate: TcgApiSetCandidate,
  input: { name: string; releaseDate: string | null; cardCount: number | null },
): number {
  const candidateName = normalizeComparableText(candidate.name);
  const inputName = normalizeComparableText(input.name);
  let score = 0;

  if (candidateName && candidateName === inputName) score += 100;
  else if (candidateName && inputName && (candidateName.includes(inputName) || inputName.includes(candidateName))) {
    score += 35;
  }

  if (input.releaseDate && candidate.releaseDate === input.releaseDate) score += 45;
  if (input.cardCount !== null && candidate.cardCount === input.cardCount) score += 35;

  return score;
}

export function pickTcgSet(
  candidates: TcgApiSetCandidate[],
  input: { name: string; releaseDate: string | null; cardCount: number | null },
): TcgApiSetCandidate | null {
  const ranked = candidates
    .map((candidate) => ({ candidate, score: setScore(candidate, input) }))
    .sort((a, b) => b.score - a.score);

  const best = ranked[0];
  if (!best || best.score < 45) return null;

  // Bei einem reinen Datums-Treffer darf kein gleichwertiger Kandidat existieren.
  const second = ranked[1];
  if (second && second.score === best.score && best.score < 100) return null;
  return best.candidate;
}

export function pickTcgCard(
  candidates: TcgApiCardCandidate[],
  localId: string,
): TcgApiCardCandidate | null {
  const target = normalizeCardNumber(localId);
  if (!target) return null;

  const matching = candidates.filter((candidate) => normalizeCardNumber(candidate.number) === target);
  if (matching.length === 0) return null;

  return (
    matching.find((candidate) => candidate.productType?.toLocaleLowerCase("en") === "cards") ??
    matching[0] ??
    null
  );
}

function canonicalPrinting(value: string | null): "Normal" | "Foil" | null {
  if (!value) return null;
  const normalized = value.toLocaleLowerCase("en");
  if (normalized.includes("foil") || normalized.includes("holo")) return "Foil";
  if (normalized.includes("normal")) return "Normal";
  return null;
}

export function pickTcgPrice(
  candidates: TcgApiPriceCandidate[],
  finish: CardFinish,
  tcgplayerUrl: string | null,
): TcgMarketQuote | null {
  if (candidates.length === 0) return null;
  const preferred: "Normal" | "Foil" = finish === "normal" ? "Normal" : "Foil";
  const selected =
    candidates.find((candidate) => canonicalPrinting(candidate.printing) === preferred) ??
    candidates.find((candidate) => candidate.marketPrice !== null || candidate.lowPrice !== null) ??
    candidates[0];

  if (!selected) return null;
  const printing = canonicalPrinting(selected.printing);
  if (
    selected.marketPrice === null &&
    selected.lowPrice === null &&
    selected.medianPrice === null
  ) {
    return null;
  }

  return {
    marketUsd: selected.marketPrice,
    lowUsd: selected.lowPrice,
    medianUsd: selected.medianPrice,
    printing,
    updatedAt: selected.updatedAt,
    tcgplayerUrl,
  };
}
