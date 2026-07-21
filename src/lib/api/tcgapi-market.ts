import "server-only";
import type { CardFinish } from "@/types";
import {
  pickTcgCard,
  pickTcgPrice,
  pickTcgSet,
  type TcgApiCardCandidate,
  type TcgApiPriceCandidate,
  type TcgApiSetCandidate,
  type TcgMarketLookupResponse,
} from "@/lib/api/tcgapi-matching";

const API_BASE = "https://api.tcgapi.dev/v1";
const DAY = 60 * 60 * 24;

function numberOrNull(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function stringOrNull(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value : null;
}

function objectOrNull(value: unknown): Record<string, unknown> | null {
  return value !== null && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

async function fetchTcgJson(
  path: string,
  options: { authenticated: boolean; revalidate: number },
): Promise<unknown> {
  const apiKey = process.env.TCGAPI_KEY?.trim();
  if (options.authenticated && !apiKey) throw new Error("TCGAPI_KEY fehlt.");

  const response = await fetch(`${API_BASE}${path}`, {
    headers: options.authenticated && apiKey ? { "X-API-Key": apiKey } : undefined,
    next: { revalidate: options.revalidate },
    signal: AbortSignal.timeout(10_000),
  });

  if (!response.ok) {
    throw new Error(`TCG API antwortete mit HTTP ${response.status}.`);
  }
  return response.json();
}

function responseData(value: unknown): unknown {
  const root = objectOrNull(value);
  return root?.data ?? value;
}

function responseHasMore(value: unknown): boolean {
  const root = objectOrNull(value);
  const meta = objectOrNull(root?.meta);
  return meta?.has_more === true;
}

async function fetchPokemonSets(): Promise<TcgApiSetCandidate[]> {
  const sets: TcgApiSetCandidate[] = [];
  for (let page = 1; page <= 5; page++) {
    const raw = await fetchTcgJson(`/games/pokemon/sets?per_page=100&page=${page}`, {
      authenticated: false,
      revalidate: DAY,
    });
    const data = responseData(raw);
    if (!Array.isArray(data)) break;

    for (const item of data) {
      const row = objectOrNull(item);
      const id = numberOrNull(row?.id);
      const name = stringOrNull(row?.name);
      if (id === null || !name) continue;
      sets.push({
        id,
        name,
        releaseDate: stringOrNull(row?.release_date),
        cardCount: numberOrNull(row?.card_count),
      });
    }
    if (!responseHasMore(raw) || data.length === 0) break;
  }
  return sets;
}

async function fetchSetCards(setId: number): Promise<TcgApiCardCandidate[]> {
  const cards: TcgApiCardCandidate[] = [];
  for (let page = 1; page <= 10; page++) {
    const raw = await fetchTcgJson(`/sets/${setId}/cards?per_page=100&page=${page}`, {
      authenticated: true,
      revalidate: DAY,
    });
    const data = responseData(raw);
    if (!Array.isArray(data)) break;

    for (const item of data) {
      const row = objectOrNull(item);
      const id = numberOrNull(row?.id);
      const name = stringOrNull(row?.name);
      const number = stringOrNull(row?.number);
      if (id === null || !name || !number) continue;
      cards.push({
        id,
        name,
        number,
        productType: stringOrNull(row?.product_type),
        tcgplayerUrl: stringOrNull(row?.tcgplayer_url),
      });
    }
    if (!responseHasMore(raw) || data.length === 0) break;
  }
  return cards;
}

function parsePriceRows(raw: unknown): TcgApiPriceCandidate[] {
  const data = responseData(raw);
  const dataObject = objectOrNull(data);
  const rows = Array.isArray(data)
    ? data
    : Array.isArray(dataObject?.prices)
      ? dataObject.prices
      : dataObject
        ? [dataObject]
        : [];

  return rows
    .map((item): TcgApiPriceCandidate | null => {
      const row = objectOrNull(item);
      if (!row) return null;
      return {
        printing: stringOrNull(row.printing),
        marketPrice: numberOrNull(row.market_price),
        lowPrice: numberOrNull(row.low_price),
        medianPrice: numberOrNull(row.median_price),
        updatedAt:
          stringOrNull(row.last_updated_at) ??
          stringOrNull(row.price_updated_at) ??
          stringOrNull(row.updated_at),
      };
    })
    .filter((row): row is TcgApiPriceCandidate => row !== null);
}

async function fetchCardPrices(cardId: number): Promise<TcgApiPriceCandidate[]> {
  const raw = await fetchTcgJson(`/cards/${cardId}/prices`, {
    authenticated: true,
    revalidate: 6 * 60 * 60,
  });
  return parsePriceRows(raw);
}

export async function lookupTcgMarketPrice(input: {
  setName: string;
  releaseDate: string | null;
  cardCount: number | null;
  localId: string;
  finish: CardFinish;
}): Promise<TcgMarketLookupResponse> {
  if (!process.env.TCGAPI_KEY?.trim()) return { status: "missing-key", quote: null };

  const sets = await fetchPokemonSets();
  const set = pickTcgSet(sets, {
    name: input.setName,
    releaseDate: input.releaseDate,
    cardCount: input.cardCount,
  });
  if (!set) return { status: "set-not-found", quote: null };

  const cards = await fetchSetCards(set.id);
  const card = pickTcgCard(cards, input.localId);
  if (!card) return { status: "card-not-found", quote: null };

  const prices = await fetchCardPrices(card.id);
  const quote = pickTcgPrice(prices, input.finish, card.tcgplayerUrl);
  return quote ? { status: "ready", quote } : { status: "price-not-found", quote: null };
}
