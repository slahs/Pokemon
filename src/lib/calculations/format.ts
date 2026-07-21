const eur = new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR" });
const usd = new Intl.NumberFormat("de-DE", {
  style: "currency",
  currency: "USD",
  currencyDisplay: "narrowSymbol",
});
const pct = new Intl.NumberFormat("de-DE", {
  style: "percent",
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
});

export function formatEur(value: number | null): string {
  return value === null ? "–" : eur.format(value);
}

export function formatUsd(value: number | null): string {
  return value === null ? "–" : usd.format(value);
}

/** value als Prozentzahl, z. B. 12.5 fuer 12,5 % */
export function formatPercent(value: number | null): string {
  return value === null ? "–" : pct.format(value / 100);
}

export function formatDateTime(iso: string): string {
  return new Intl.DateTimeFormat("de-DE", { dateStyle: "medium", timeStyle: "short" }).format(
    new Date(iso),
  );
}

export function formatDate(iso: string): string {
  return new Intl.DateTimeFormat("de-DE", { dateStyle: "medium" }).format(new Date(iso));
}
