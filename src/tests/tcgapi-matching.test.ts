import { describe, expect, it } from "vitest";
import {
  normalizeCardNumber,
  normalizeComparableText,
  pickTcgCard,
  pickTcgPrice,
  pickTcgSearchCard,
  pickTcgSearchQuote,
  pickTcgSet,
} from "@/lib/api/tcgapi-matching";

describe("TCG API Zuordnung", () => {
  it("gleicht Kartennummern mit Fuehrungsnullen und Set-Gesamtzahl ab", () => {
    expect(normalizeCardNumber("086")).toBe("86");
    expect(normalizeCardNumber("086/165")).toBe("86");
    expect(normalizeCardNumber("SVP 001")).toBe("svp1");
  });

  it("normalisiert Satzzeichen und Sonderzeichen in Setnamen", () => {
    expect(normalizeComparableText("Scarlet & Violet—151")).toBe("scarletandviolet151");
  });

  it("findet ein englisches Set ueber Release-Datum und Kartenanzahl", () => {
    const result = pickTcgSet(
      [
        { id: 1, name: "Paldean Fates", releaseDate: "2024-01-26", cardCount: 245 },
        { id: 2, name: "Temporal Forces", releaseDate: "2024-03-22", cardCount: 218 },
      ],
      { name: "Paldeas Schicksale", releaseDate: "2024-01-26", cardCount: 245 },
    );
    expect(result?.id).toBe(1);
  });

  it("vergleicht ISO-Zeitstempel mit reinen Release-Daten", () => {
    const result = pickTcgSet(
      [{ id: 1, name: "Paldean Fates", releaseDate: "2024-01-26T00:00:00.000Z", cardCount: 245 }],
      { name: "Paldeas Schicksale", releaseDate: "2024-01-26", cardCount: null },
    );
    expect(result?.id).toBe(1);
  });

  it("ordnet eine Karte anhand der lokalen Nummer zu", () => {
    const result = pickTcgCard(
      [
        {
          id: 10,
          name: "Dewgong",
          number: "086/165",
          productType: "Cards",
          tcgplayerUrl: "https://example.test/card",
        },
      ],
      "086",
    );
    expect(result?.id).toBe(10);
  });

  it("bevorzugt fuer Holo und Reverse die Foil-Preise", () => {
    const quote = pickTcgPrice(
      [
        {
          printing: "Normal",
          marketPrice: 1,
          lowPrice: 0.5,
          medianPrice: 1.2,
          updatedAt: "2026-07-21",
        },
        {
          printing: "Foil",
          marketPrice: 2,
          lowPrice: 1.5,
          medianPrice: 2.2,
          updatedAt: "2026-07-21",
        },
      ],
      "reverse",
      null,
    );
    expect(quote?.printing).toBe("Foil");
    expect(quote?.marketUsd).toBe(2);
  });

  it("findet Inkay 051 global ueber englischen Setnamen statt ueber eine Set-ID", () => {
    const candidates = [
      {
        id: 20,
        name: "Inkay",
        number: "051/132",
        setName: "Gym Heroes",
        productType: "Cards",
        tcgplayerUrl: "https://example.test/wrong",
        printing: "Normal",
        marketPrice: 5,
        lowPrice: 4,
        medianPrice: 5.5,
        updatedAt: "2026-07-21",
      },
      {
        id: 21,
        name: "Inkay",
        number: "051/084",
        setName: "ME05: Pitch Black",
        productType: "Cards",
        tcgplayerUrl: "https://example.test/inkay",
        printing: "Normal",
        marketPrice: 0.1,
        lowPrice: 0.08,
        medianPrice: 0.12,
        updatedAt: "2026-07-21",
      },
      {
        id: 22,
        name: "Inkay (Master Ball Pattern)",
        number: "051/084",
        setName: "ME05: Pitch Black",
        productType: "Cards",
        tcgplayerUrl: "https://example.test/pattern",
        printing: "Foil",
        marketPrice: 3,
        lowPrice: 2.5,
        medianPrice: 3.2,
        updatedAt: "2026-07-21",
      },
    ];

    const input = {
      localId: "051",
      englishName: "Inkay",
      englishSetName: "ME05: Pitch Black",
      finish: "normal" as const,
    };
    expect(pickTcgSearchCard(candidates, input)?.id).toBe(21);
    expect(pickTcgSearchQuote(candidates, input)?.marketUsd).toBe(0.1);
  });

  it("akzeptiert Setnamen mit zusaetzlichem TCGPlayer-Praefix", () => {
    const result = pickTcgSearchCard(
      [
        {
          id: 31,
          name: "Inkay",
          number: "051/084",
          setName: "ME05: Pitch Black",
          productType: "Cards",
          tcgplayerUrl: null,
          printing: "Normal",
          marketPrice: 0.1,
          lowPrice: null,
          medianPrice: null,
          updatedAt: null,
        },
      ],
      {
        localId: "051",
        englishName: "Inkay",
        englishSetName: "Pitch Black",
        finish: "normal",
      },
    );
    expect(result?.id).toBe(31);
  });
});
