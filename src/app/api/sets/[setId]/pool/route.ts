import { NextResponse } from "next/server";
import { fetchSetPool } from "@/lib/api/tcgdex";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ setId: string }> },
) {
  const { setId } = await params;
  try {
    const pool = await fetchSetPool(setId);
    return NextResponse.json(pool, {
      headers: { "Cache-Control": "public, s-maxage=1800, stale-while-revalidate=21600" },
    });
  } catch (err) {
    return NextResponse.json(
      {
        error:
          err instanceof Error ? err.message : "Kartenpool konnte nicht geladen werden.",
      },
      { status: 502 },
    );
  }
}
