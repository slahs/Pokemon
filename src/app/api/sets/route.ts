import { NextResponse } from "next/server";
import { fetchSets } from "@/lib/api/tcgdex";
import { findProfileForSet } from "@/config/simulation-profiles";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const sets = await fetchSets();
    const withProfiles = sets.map((set) => {
      const profile = findProfileForSet(set.id);
      return {
        ...set,
        simulationAvailable: profile !== null,
        profileId: profile?.id ?? null,
        profileName: profile?.name ?? null,
      };
    });
    return NextResponse.json(
      { sets: withProfiles },
      { headers: { "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400" } },
    );
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Sets konnten nicht geladen werden." },
      { status: 502 },
    );
  }
}
