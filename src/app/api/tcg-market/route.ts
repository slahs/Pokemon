import { NextResponse } from "next/server";
import type { CardFinish } from "@/types";
import { lookupTcgMarketPrice } from "@/lib/api/tcgapi-market";

export const dynamic = "force-dynamic";

function isFinish(value: unknown): value is CardFinish {
  return value === "normal" || value === "reverse" || value === "holo";
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Record<string, unknown>;
    const setName = typeof body.setName === "string" ? body.setName.trim() : "";
    const releaseDate = typeof body.releaseDate === "string" ? body.releaseDate : null;
    const cardCount =
      typeof body.cardCount === "number" && Number.isFinite(body.cardCount) ? body.cardCount : null;
    const localId = typeof body.localId === "string" ? body.localId.trim() : "";
    const finish = body.finish;

    if (!setName || !localId || !isFinish(finish)) {
      return NextResponse.json({ error: "Ungültige Marktpreis-Anfrage." }, { status: 400 });
    }

    const result = await lookupTcgMarketPrice({
      setName,
      releaseDate,
      cardCount,
      localId,
      finish,
    });

    return NextResponse.json(result, {
      headers: { "Cache-Control": "private, no-store" },
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "TCG-Marktpreis konnte nicht geladen werden.",
      },
      { status: 502 },
    );
  }
}
