import type { BoosterRecord } from "@/types";

function download(filename: string, content: string, mime: string): void {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function exportSessionJson(boosters: BoosterRecord[]): void {
  download(
    `boosterbilanz-session-${new Date().toISOString().slice(0, 10)}.json`,
    JSON.stringify({ exportedAt: new Date().toISOString(), boosters }, null, 2),
    "application/json",
  );
}

function csvEscape(value: string): string {
  return /[";\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;
}

export function exportSessionCsv(boosters: BoosterRecord[]): void {
  const header = [
    "Datum",
    "Set",
    "Kaufpreis",
    "Kartenwert",
    "Brutto",
    "Netto",
    "ROI %",
    "Fehlende Preise",
    "Wertvollste Karte",
  ];
  const rows = boosters.map((b) =>
    [
      b.openedAt,
      b.setName,
      b.packPurchasePrice.toFixed(2),
      b.grossCardValue.toFixed(2),
      b.grossProfitLoss.toFixed(2),
      b.netProfitLoss.toFixed(2),
      b.roi === null ? "" : b.roi.toFixed(1),
      String(b.missingPriceCount),
      b.bestCard?.name ?? "",
    ]
      .map((v) => csvEscape(String(v)))
      .join(";"),
  );
  download(
    `boosterbilanz-session-${new Date().toISOString().slice(0, 10)}.csv`,
    "\uFEFF" + [header.join(";"), ...rows].join("\n"),
    "text/csv;charset=utf-8",
  );
}
