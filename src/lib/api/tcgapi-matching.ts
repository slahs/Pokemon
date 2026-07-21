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

export type TcgApiSearchCandidate = TcgApiCardCandidate & TcgApiPriceCandidate;

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

function normalizeDate(value: string | null): string | null {
  if (!value) return null;
  const match = value.match(/^\d{4}-\d{2}-\d{2}/);
  return match?.[0] ?? (value.trim() || null);
}

function setScore(
  candidate: TcgApiSetCandidate,
  input: { name: string; releaseDate: string | null; cardCount: number | null },
): number {
  const candidateName = normalizeComparableText(candidate.name);
  const inputName = normalizeComparableText(input.name);
  let score = 0;

  if (candidateName && candidateName === inputName) score += 100;
  else if (
    candidateName &&
    inputName &&
    (candidateName.includes(inputName) || inputName.includes(candidateName))
  ) {
    score += 35;
  }

  const inputDate = normalizeDate(input.releaseDate);
  const candidateDate = normalizeDate(candidate.releaseDate);
  if (inputDate && candidateDate === inputDate) score += 45;
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

function hasPrice(candidate: TcgApiPriceCandidate): boolean {
  return (
    candidate.marketPrice !== null ||
    candidate.lowPrice !== null ||
    candidate.medianPrice !== null
  );
}

export function pickTcgPrice(
  candidates: TcgApiPriceCandidate[],
  finish: CardFinish,
  tcgplayerUrl: string | null,
): TcgMarketQuote | null {
  if (candidates.length === 0) return null;
  const preferred: "Normal" | "Foil" = finish === "normal" ? "Normal" : "Foil";
  const selected =
    candidates.find(
      (candidate) => canonicalPrinting(candidate.printing) === preferred && hasPrice(candidate),
    ) ??
    candidates.find((candidate) => hasPrice(candidate)) ??
    candidates[0];

  if (!selected || !hasPrice(selected)) return null;

  return {
    marketUsd: selected.marketPrice,
    lowUsd: selected.lowPrice,
    medianUsd: selected.medianPrice,
    printing: canonicalPrinting(selected.printing),
    updatedAt: selected.updatedAt,
    tcgplayerUrl,
  };
}

export function pickTcgSearchQuote(
  candidates: TcgApiSearchCandidate[],
  input: { localId: string; englishName: string; finish: CardFinish },
): TcgMarketQuote | null {
  const targetNumber = normalizeCardNumber(input.localId);
  const targetName = normalizeComparableText(input.englishName);
  const preferred: "Normal" | "Foil" = input.finish === "normal" ? "Normal" : "Foil";

  const ranked = candidates
    .filter((candidate) => normalizeCardNumber(candidate.number) === targetNumber)
    .filter(
      (candidate) =>
        !candidate.productType || candidate.productType.toLocaleLowerCase("en") === "cards",
    )
    .map((candidate) => {
      let score = 0;
      const candidateName = normalizeComparableText(candidate.name);
      if (candidateName === targetName) score += 100;
      else if (candidateName.includes(targetName) || targetName.includes(candidateName)) score += 30;
      if (canonicalPrinting(candidate.printing) === preferred) score += 20;
      if (hasPrice(candidate)) score += 10;
      return { candidate, score };
    })
    .sort((a, b) => b.score - a.score);

  const selected = ranked[0]?.candidate;
  if (!selected || !hasPrice(selected)) return null;

  return {
    marketUsd: selected.marketPrice,
    lowUsd: selected.lowPrice,
    medianUsd: selected.medianPrice,
    printing: canonicalPrinting(selected.printing),
    updatedAt: selected.updatedAt,
    tcgplayerUrl: selected.tcgplayerUrl,
  };
}
