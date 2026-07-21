"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { formatDate } from "@/lib/calculations/format";
import { loadSession } from "@/lib/storage/session-storage";

type SetListItem = {
  id: string;
  name: string;
  serie: string;
  releaseDate: string | null;
  releaseOrder: number | null;
  cardCountOfficial: number | null;
  cardCountTotal: number | null;
  logo: string | null;
  language: "de" | "en";
  simulationAvailable: boolean;
  profileName: string | null;
};

type SortMode = "popular" | "new" | "old" | "alpha";

const POPULAR_SET_IDS = [
  "sv03.5",
  "sv04.5",
  "swsh7",
  "swsh12.5",
  "base1",
  "base4",
  "xy12",
  "sm115",
  "neo1",
  "swsh9",
  "swsh11",
];
const POPULARITY = new Map(
  POPULAR_SET_IDS.map((id, index) => [id, POPULAR_SET_IDS.length - index]),
);

function releaseRank(set: SetListItem): number {
  if (set.releaseOrder !== null) return set.releaseOrder;
  if (set.releaseDate) return -Date.parse(set.releaseDate);
  return Number.MAX_SAFE_INTEGER;
}

export function SetBrowser() {
  const [sets, setSets] = useState<SetListItem[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [serie, setSerie] = useState("all");
  const [year, setYear] = useState("all");
  const [sort, setSort] = useState<SortMode>("new");
  const [reloadKey, setReloadKey] = useState(0);
  const [openCounts, setOpenCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    const counts: Record<string, number> = {};
    for (const booster of loadSession().boosters) {
      counts[booster.setId] = (counts[booster.setId] ?? 0) + 1;
    }
    setOpenCounts(counts);
  }, []);

  useEffect(() => {
    let cancelled = false;
    setError(null);
    setSets(null);
    fetch("/api/sets")
      .then(async (res) => {
        if (!res.ok) {
          const body = (await res.json().catch(() => null)) as { error?: string } | null;
          throw new Error(body?.error ?? "Sets konnten nicht geladen werden.");
        }
        return res.json() as Promise<{ sets: SetListItem[] }>;
      })
      .then((data) => {
        if (!cancelled) setSets(data.sets);
      })
      .catch((err: Error) => {
        if (!cancelled) setError(err.message);
      });
    return () => {
      cancelled = true;
    };
  }, [reloadKey]);

  const series = useMemo(
    () => [...new Set((sets ?? []).map((s) => s.serie))].sort((a, b) => a.localeCompare(b, "de")),
    [sets],
  );
  const years = useMemo(
    () =>
      [
        ...new Set(
          (sets ?? [])
            .map((s) => s.releaseDate?.slice(0, 4))
            .filter((y): y is string => Boolean(y)),
        ),
      ].sort((a, b) => b.localeCompare(a)),
    [sets],
  );

  const filtered = useMemo(() => {
    let list = sets ?? [];
    const q = search.trim().toLocaleLowerCase("de");
    if (q) list = list.filter((s) => `${s.name} ${s.serie}`.toLocaleLowerCase("de").includes(q));
    if (serie !== "all") list = list.filter((s) => s.serie === serie);
    if (year !== "all") list = list.filter((s) => s.releaseDate?.startsWith(year));

    return [...list].sort((a, b) => {
      if (sort === "alpha") return a.name.localeCompare(b.name, "de");
      if (sort === "old") return releaseRank(b) - releaseRank(a);
      if (sort === "new") return releaseRank(a) - releaseRank(b);

      const score = (set: SetListItem) =>
        (openCounts[set.id] ?? 0) * 1000 +
        (POPULARITY.get(set.id) ?? 0) * 10 +
        Math.max(0, 5 - Math.min(releaseRank(set), 5));
      return score(b) - score(a) || releaseRank(a) - releaseRank(b);
    });
  }, [sets, search, serie, year, sort, openCounts]);

  if (error) {
    return (
      <div className="panel p-8 text-center" role="alert">
        <p className="font-semibold">Sets konnten nicht geladen werden.</p>
        <p className="mt-1 text-sm text-text-dim">{error}</p>
        <button
          type="button"
          onClick={() => setReloadKey((k) => k + 1)}
          className="accent-button mt-5 min-h-11 px-5"
        >
          Erneut laden
        </button>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-7 flex flex-wrap gap-3">
        <label className="min-w-60 flex-1">
          <span className="sr-only">Set suchen</span>
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="⌕  Set suchen …"
            className="filter-control w-full placeholder:text-text-dim"
          />
        </label>
        <label>
          <span className="sr-only">Nach Serie filtern</span>
          <select
            value={serie}
            onChange={(e) => setSerie(e.target.value)}
            className="filter-control"
          >
            <option value="all">Alle Serien</option>
            {series.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </label>
        {years.length > 0 && (
          <label>
            <span className="sr-only">Nach Jahr filtern</span>
            <select
              value={year}
              onChange={(e) => setYear(e.target.value)}
              className="filter-control"
            >
              <option value="all">Alle Jahre</option>
              {years.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </label>
        )}
        <label>
          <span className="sr-only">Sortierung</span>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as SortMode)}
            className="filter-control"
          >
            <option value="popular">Beliebteste</option>
            <option value="new">Neueste Releases</option>
            <option value="old">Älteste Releases</option>
            <option value="alpha">Alphabetisch</option>
          </select>
        </label>
      </div>

      {sets === null ? (
        <div
          className="grid grid-cols-1 gap-[18px] sm:grid-cols-2 lg:grid-cols-3"
          aria-busy="true"
          aria-label="Sets werden geladen"
        >
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="panel h-60 animate-pulse" />
          ))}
        </div>
      ) : (
        <>
          <p className="mb-4 font-numeric text-xs text-text-dim">{filtered.length} Sets</p>
          <ul className="grid list-none grid-cols-1 gap-[18px] p-0 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((set) => (
              <li
                key={set.id}
                className="panel panel-hover flex min-h-60 flex-col overflow-hidden p-5"
              >
                <Link href={`/simulator/${set.id}`} className="flex h-full flex-col">
                  <div className="mb-4 flex h-24 items-center justify-center rounded-2xl border border-white/14 bg-gradient-to-br from-[oklch(0.5_0.16_200/0.4)] to-[oklch(0.5_0.18_340/0.35)] px-4">
                    {set.logo ? (
                      <Image
                        src={set.logo}
                        alt={`Logo des Sets ${set.name}`}
                        width={190}
                        height={80}
                        className="max-h-20 w-auto max-w-full object-contain drop-shadow-[0_3px_12px_oklch(0.12_0.05_285/0.7)]"
                        unoptimized
                      />
                    ) : (
                      <span className="font-display text-center text-xl font-extrabold">
                        {set.name}
                      </span>
                    )}
                  </div>
                  <h3 className="font-display text-base font-bold leading-snug">{set.name}</h3>
                  <p className="mt-1 font-numeric text-xs text-text-muted">
                    {set.serie}
                    {set.releaseDate ? ` · ${formatDate(set.releaseDate)}` : ""}
                    {set.cardCountTotal ? ` · ${set.cardCountTotal} Karten` : ""}
                  </p>
                  <div className="mt-auto flex items-center justify-between gap-3 pt-5">
                    <span className="text-xs font-bold text-gain">● bereit</span>
                    <span className="accent-button min-h-10 px-5 text-sm">Öffnen</span>
                  </div>
                </Link>
              </li>
            ))}
            {filtered.length === 0 && (
              <li className="panel p-8 text-text-muted sm:col-span-2 lg:col-span-3">
                Kein Set entspricht der aktuellen Suche.
              </li>
            )}
          </ul>
        </>
      )}
    </div>
  );
}
