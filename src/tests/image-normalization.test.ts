import { describe, expect, it } from "vitest";
import {
  buildImageUrl,
  buildSetAssetUrl,
  normalizeCard,
  normalizeSetSummary,
} from "@/lib/api/normalize";
import type {
  TcgdexCardDetail,
  TcgdexSetBrief,
  TcgdexSetDetail,
} from "@/lib/validation/tcgdex-schemas";

describe("TCGdex image normalization", () => {
  it("builds card image variants from a base URL", () => {
    const base = "https://assets.tcgdex.net/en/sv/sv04.5/001";
    expect(buildImageUrl(base, "low")).toBe(`${base}/low.webp`);
    expect(buildImageUrl(base, "high")).toBe(`${base}/high.webp`);
  });

  it("accepts already completed asset URLs without duplicating extensions", () => {
    expect(buildImageUrl("https://assets.tcgdex.net/en/sv/sv04.5/001/low.webp", "high")).toBe(
      "https://assets.tcgdex.net/en/sv/sv04.5/001/high.webp",
    );
    expect(buildSetAssetUrl("https://assets.tcgdex.net/en/sv/sv04.5/logo.webp")).toBe(
      "https://assets.tcgdex.net/en/sv/sv04.5/logo.webp",
    );
  });

  it("uses English media when German card and set metadata have no image", () => {
    const germanSet: TcgdexSetBrief = { id: "sv04.5", name: "Paldeas Schicksale" };
    const englishSet: TcgdexSetBrief = {
      id: "sv04.5",
      name: "Paldean Fates",
      logo: "https://assets.tcgdex.net/en/sv/sv04.5/logo",
      symbol: "https://assets.tcgdex.net/en/sv/sv04.5/symbol",
    };
    const normalizedSet = normalizeSetSummary(germanSet, "de", englishSet);
    expect(normalizedSet.logo).toBe("https://assets.tcgdex.net/en/sv/sv04.5/logo.webp");

    const germanCard: TcgdexCardDetail = {
      id: "sv04.5-001",
      localId: "001",
      name: "Tannza",
    };
    const image = "https://assets.tcgdex.net/en/sv/sv04.5/001";
    const normalizedCard = normalizeCard(
      germanCard,
      normalizedSet.id,
      normalizedSet.name,
      "de",
      image,
    );
    expect(normalizedCard.imageLow).toBe(`${image}/low.webp`);
    expect(normalizedCard.imageHigh).toBe(`${image}/high.webp`);
    expect(normalizedCard.name).toBe("Tannza");
    expect(normalizedCard.language).toBe("de");
  });

  it("normalizes release order and official booster artwork", () => {
    const set: TcgdexSetDetail = {
      id: "sv04.5",
      name: "Paldeas Schicksale",
      cards: [],
      boosters: [
        {
          id: "sv04.5-1",
          name: "Mew",
          artwork_front: "https://assets.tcgdex.net/de/sv/sv04.5/boosters/1/front",
          artwork_back: "https://assets.tcgdex.net/de/sv/sv04.5/boosters/1/back",
        },
      ],
    };

    const normalized = normalizeSetSummary(set, "de", null, 3);
    expect(normalized.releaseOrder).toBe(3);
    expect(normalized.boosters).toEqual([
      {
        id: "sv04.5-1",
        name: "Mew",
        logo: null,
        artworkFront: "https://assets.tcgdex.net/de/sv/sv04.5/boosters/1/front.webp",
        artworkBack: "https://assets.tcgdex.net/de/sv/sv04.5/boosters/1/back.webp",
      },
    ]);
  });
});
