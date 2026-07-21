import "server-only";
import type { CardFinish } from "@/types";
import {
  normalizeCardNumber,
  normalizeComparableText,
  pickTcgCard,
  pickTcgPrice,
  pickTcgSearchQuote,
  pickTcgSet,
  type TcgApiCardCandidate,
  type TcgApiPriceCandidate,
  type TcgApiSearchCandidate,
  type TcgApiSetCandidate,
  type TcgMarketLookupResponse,
} from "@/lib/api/tcgapi-matching";

const API_BASE = "https://api.tcgapi.dev/v1";
const TCGDEX_BASE = "https://api.tcgdex.net/v2";
const DAY = 60 * 60 * 24;
const SIX_HOURS = 6 * 60 * 60;

function numberOrNull(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function stringOrNull(value: unknown): string | null {
  if (typeof value === "string" && value.trim()) return value;
  if (typeof value === "number" && Number.isFinite(value)) return String(value);
  return null;
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

async function fetchPublicJson(url: string): Promise<unknown> {
  const response = await fetch(url, {
    next: { revalidate: DAY },
    signal: AbortSignal.timeout(10_000),
  });
  if (!response.ok) {
    throw new Error(`Öffentliche Kartendaten antworteten mit HTTP ${response.status}.`);
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
  return meta?.has_more === true || meta?.hasMore === true;
}

async function fetchPokemonSets(): Promise<TcgApiSetCandidate[]> {
  const sets: TcgApiSetCandidate[] = [];
  for (let page = 1; page <= 10; page++) {
    const raw = await fetchTcgJson(`/games/pokemon/sets?per_page=100&page=${page}`, {
      authenticated: true,
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

type TcgDexSetHint = {
  id: string;
  name: string;
  releaseDate: string | null;
  cardCount: number | null;
};

type TcgDexCardHint = {
  name: string;
  localId: string;
};

function parseTcgdexSets(value: unknown): TcgDexSetHint[] {
  const data = responseData(value);
  if (!Array.isArray(data)) return [];

  return data
    .map((item): TcgDexSetHint | null => {
      const row = objectOrNull(item);
      const id = stringOrNull(row?.id);
      const name = stringOrNull(row?.name);
      if (!id || !name) return null;
      const cardCount = objectOrNull(row?.cardCount);
      return {
        id,
        name,
        releaseDate: stringOrNull(row?.releaseDate),
        cardCount: numberOrNull(cardCount?.official) ?? numberOrNull(cardCount?.total),
      };
    })
    .filter((set): set is TcgDexSetHint => set !== null);
}

async function resolveTcgdexSetHint(setName: string): Promise<TcgDexSetHint | null> {
  const [deRaw, enRaw] = await Promise.all([
    fetchPublicJson(`${TCGDEX_BASE}/de/sets`).catch(() => null),
    fetchPublicJson(`${TCGDEX_BASE}/en/sets`).catch(() => null),
  ]);
  const deSets = parseTcgdexSets(deRaw);
  const enSets = parseTcgdexSets(enRaw);
  const targetName = normalizeComparableText(setName);

  const primary =
    deSets.find((set) => normalizeComparableText(set.name) === targetName) ??
    enSets.find((set) => normalizeComparableText(set.name) === targetName) ??
    null;
  if (!primary) return null;

  const english = enSets.find((set) => set.id === primary.id) ?? null;
  return {
    id: primary.id,
    name: english?.name ?? primary.name,
    releaseDate: primary.releaseDate ?? english?.releaseDate ?? null,
    cardCount: primary.cardCount ?? english?.cardCount ?? null,
  };
}

async function resolveTcgdexCardHint(cardId: string): Promise<TcgDexCardHint | null> {
  if (!cardId) return null;
  const raw = await fetchPublicJson(`${TCGDEX_BASE}/en/cards/${encodeURIComponent(cardId)}`).catch(
    () => null,
  );
  const row = objectOrNull(responseData(raw));
  const name = stringOrNull(row?.name);
  const localId = stringOrNull(row?.localId);
  return name && localId ? { name, localId } : null;
}

function parseSearchRows(raw: unknown): TcgApiSearchCandidate[] {
  const data = responseData(raw);
  if (!Array.isArray(data)) return [];

  return data
    .map((item): TcgApiSearchCandidate | null => {
      const row = objectOrNull(item);
      if (!row) return null;
      const id = numberOrNull(row.id);
      const name = stringOrNull(row.name);
      const number = stringOrNull(row.number);
      if (id === null || !name || !number) return null;

      const nestedPrice = objectOrNull(row.price);
      const tcgplayerId = numberOrNull(row.tcgplayer_id);
      return {
        id,
        name,
        number,
        productType: stringOrNull(row.product_type),
        tcgplayerUrl:
          stringOrNull(row.tcgplayer_url) ??
          (tcgplayerId === null ? null : `https://www.tcgplayer.com/product/${tcgplayerId}`),
        printing: stringOrNull(row.printing),
        marketPrice: numberOrNull(row.market_price) ?? numberOrNull(nestedPrice?.market_price),
        lowPrice: numberOrNull(row.low_price) ?? numberOrNull(nestedPrice?.low_price),
        medianPrice: numberOrNull(row.median_price) ?? numberOrNull(nestedPrice?.median_price),
        updatedAt:
          stringOrNull(row.price_updated_at) ??
          stringOrNull(row.last_updated_at) ??
          stringOrNull(row.updated_at),
      };
    })
    .filter((card): card is TcgApiSearchCandidate => card !== null);
}

async function searchTcgCards(query: string, setId: number): Promise<TcgApiSearchCandidate[]> {
  const params = new URLSearchParams({
    q: query,
    game: "pokemon",
    set_id: String(setId),
    type: "Cards",
    per_page: "100",
  });
  const raw = await fetchTcgJson(`/search?${params.toString()}`, {
    authenticated: true,
    revalidate: SIX_HOURS,
  });
  return parseSearchRows(raw);
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
      const tcgplayerId = numberOrNull(row?.tcgplayer_id);
      cards.push({
        id,
        name,
        number,
        productType: stringOrNull(row?.product_type),
        tcgplayerUrl:
          stringOrNull(row?.tcgplayer_url) ??
          (tcgplayerId === null ? null : `https://www.tcgplayer.com/product/${tcgplayerId}`),
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
    revalidate: SIX_HOURS,
  });
  return parsePriceRows(raw);
}

export async function lookupTcgMarketPrice(input: {
  cardId: string;
  setName: string;
  releaseDate: string | null;
  cardCount: number | null;
  localId: string;
  finish: CardFinish;
}): Promise<TcgMarketLookupResponse> {
  if (!process.env.TCGAPI_KEY?.trim()) return { status: "missing-key", quote: null };

  const [sets, setHint, cardHint] = await Promise.all([
    fetchPokemonSets(),
    resolveTcgdexSetHint(input.setName),
    resolveTcgdexCardHint(input.cardId),
  ]);

  let set = pickTcgSet(sets, {
    name: setHint?.name ?? input.setName,
    releaseDate: input.releaseDate ?? setHint?.releaseDate ?? null,
    cardCount: input.cardCount ?? setHint?.cardCount ?? null,
  });

  if (!set && setHint) {
    set = pickTcgSet(sets, {
      name: setHint.name,
      releaseDate: setHint.releaseDate,
      cardCount: setHint.cardCount,
    });
  }
  if (!set) return { status: "set-not-found", quote: null };

  if (cardHint) {
    const searchRows = await searchTcgCards(cardHint.name, set.id);
    const quote = pickTcgSearchQuote(searchRows, {
      localId: cardHint.localId || input.localId,
      englishName: cardHint.name,
      finish: input.finish,
    });
    if (quote) return { status: "ready", quote };

    const exactSearchCard = searchRows.find(
      (candidate) =>
        normalizeCardNumber(candidate.number) === normalizeCardNumber(input.localId) &&
        normalizeComparableText(candidate.name) === normalizeComparableText(cardHint.name),
    );
    if (exactSearchCard) {
      const prices = await fetchCardPrices(exactSearchCard.id);
      const detailQuote = pickTcgPrice(prices, input.finish, exactSearchCard.tcgplayerUrl);
      return detailQuote
        ? { status: "ready", quote: detailQuote }
        : { status: "price-not-found", quote: null };
    }
  }

  const cards = await fetchSetCards(set.id);
  const card = pickTcgCard(cards, input.localId);
  if (!card) return { status: "card-not-found", quote: null };

  const prices = await fetchCardPrices(card.id);
  const quote = pickTcgPrice(prices, input.finish, card.tcgplayerUrl);
  return quote ? { status: "ready", quote } : { status: "price-not-found", quote: null };
}
