import { expect, test, type Page } from "@playwright/test";

/**
 * Vollstaendiger E2E-Flow:
 * Startseite -> Paldeas Schicksale -> Kaufpreis setzen -> Booster oeffnen ->
 * alle Karten aufdecken -> Auswertung pruefen -> Sessionseite -> Booster wiederfinden.
 *
 * Die internen API-Routen werden gemockt, damit der Test deterministisch und
 * ohne externe Netzwerkabhaengigkeit laeuft.
 */

const MOCK_SETS = {
  sets: [
    {
      id: "sv04.5",
      name: "Paldeas Schicksale",
      serie: "Karmesin & Purpur",
      releaseDate: "2024-01-26",
      cardCountOfficial: 91,
      cardCountTotal: 245,
      logo: null,
      symbol: null,
      language: "de",
      simulationAvailable: true,
      profileId: "sv-special",
      profileName: "Karmesin & Purpur (Spezialset)",
    },
  ],
};

function mockCard(i: number, rarity: string, canonical: string) {
  return {
    id: `sv04.5-${i}`,
    localId: String(i),
    name: `Testkarte ${i}`,
    setId: "sv04.5",
    setName: "Paldeas Schicksale",
    imageLow: null,
    imageHigh: null,
    rarity,
    canonicalRarity: canonical,
    category: "Pokemon",
    availableFinishes: ["normal", "reverse", "holo"],
    prices: {
      normal: { low: 0.02, average: 0.1, trend: 0.25, avg1: null, avg7: 0.2, avg30: 0.18 },
      reverse: { low: 0.1, average: 0.4, trend: 0.6, avg1: null, avg7: 0.5, avg30: 0.45 },
      holo: { low: 0.1, average: 0.4, trend: 0.6, avg1: null, avg7: 0.5, avg30: 0.45 },
    },
    pricingUpdatedAt: "2026-07-19",
    language: "de",
  };
}

function buildMockPool() {
  const cards = [];
  let i = 1;
  for (let n = 0; n < 30; n++) cards.push(mockCard(i++, "Häufig", "common"));
  for (let n = 0; n < 20; n++) cards.push(mockCard(i++, "Nicht so häufig", "uncommon"));
  for (let n = 0; n < 10; n++) cards.push(mockCard(i++, "Selten", "rare"));
  for (let n = 0; n < 5; n++) cards.push(mockCard(i++, "Doppelselten", "doubleRare"));
  for (let n = 0; n < 5; n++) cards.push(mockCard(i++, "Ultra Selten", "ultraRare"));
  for (let n = 0; n < 5; n++) cards.push(mockCard(i++, "Schimmerndes Selten", "shinyRare"));
  return {
    set: {
      id: "sv04.5",
      name: "Paldeas Schicksale",
      serie: "Karmesin & Purpur",
      releaseDate: "2024-01-26",
      cardCountOfficial: 91,
      cardCountTotal: 245,
      logo: null,
      symbol: null,
      language: "de",
    },
    cards,
    loadedAt: new Date().toISOString(),
    englishFallbackCount: 0,
  };
}

async function installMocks(page: Page) {
  await page.route("**/api/sets", (route) =>
    route.fulfill({ json: MOCK_SETS, contentType: "application/json" }),
  );
  await page.route("**/api/sets/sv04.5/pool", (route) =>
    route.fulfill({ json: buildMockPool(), contentType: "application/json" }),
  );
}

test("kompletter Booster-Flow bis zur Session", async ({ page }) => {
  await installMocks(page);

  // 1. Startseite oeffnen
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: /Pokémon-Booster virtuell öffnen/ }),
  ).toBeVisible();

  // 2. Paldeas Schicksale auswaehlen
  await expect(page.getByText("Paldeas Schicksale")).toBeVisible();
  await page.getByRole("link", { name: "Öffnen" }).click();
  await expect(page).toHaveURL(/\/simulator\/sv04\.5/);

  // 3. Boosterpreis setzen
  const priceInput = page.getByLabel("Booster-Kaufpreis (€)");
  await priceInput.fill("4,29");

  // 4. Booster oeffnen
  await page.getByRole("button", { name: "Booster öffnen" }).click();

  // 5. Alle Karten aufdecken
  await page.getByRole("button", { name: "Alle aufdecken" }).click();

  // 6. Auswertung pruefen
  await expect(page.getByRole("heading", { name: "Gezogene Karten" })).toBeVisible();
  await expect(page.getByText("Booster-Kaufpreis")).toBeVisible();
  await expect(page.getByText("Netto-Ergebnis")).toBeVisible();
  await expect(page.getByText("ROI")).toBeVisible();

  // 7. Sessionseite oeffnen
  await page.getByRole("link", { name: "Session ansehen" }).click();
  await expect(page).toHaveURL(/\/session/);

  // 8. Gespeicherten Booster finden
  await expect(page.getByText("Geöffnete Booster")).toBeVisible();
  await expect(page.getByRole("button", { name: /Paldeas Schicksale/ })).toBeVisible();
});
