"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { formatDate } from "@/lib/calculations/format";

type SetListItem = {
  id: string;
  name: string;
  serie: string;
  releaseDate: string | null;
  cardCountOfficial: number | null;
  cardCountTotal: number | null;
  logo: string | null;
  language: "de" | "en";
  simulationAvailable: boolean;
  profileName: string | null;
};

type SortMode = "new" | "old" | "alpha";

export function SetBrowser() {
  const [sets, setSets] = useState<SetListItem[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [serie, setSerie] = useState("all");
  const [year, setYear] = useState("all");
  const [sort, setSort] = useState<SortMode>("new");
  const [reloadKey, setReloadKey] = useState(0);

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
    () => [...new Set((sets ?? []).map((s) => s.serie))].sort(),
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
    const q = search.trim().toLowerCase();
    if (q) list = list.filter((s) => s.name.toLowerCase().includes(q));
    if (serie !== "all") list = list.filter((s) => s.serie === serie);
    if (year !== "all") list = list.filter((s) => s.releaseDate?.startsWith(year));
    const byDate = (s: SetListItem) => s.releaseDate ?? "0000";
    return [...list].sort((a, b) => {
      if (sort === "alpha") return a.name.localeCompare(b.name, "de");
      if (sort === "old") return byDate(a).localeCompare(byDate(b));
      return byDate(b).localeCompare(byDate(a));
    });
  }, [sets, search, serie, year, sort]);

  if (error) {
    return (
      <div className="panel p-6 text-center" role="alert">
        <p className="text-mist-100 font-medium">Sets konnten nicht geladen werden.</p>
        <p className="text-mist-500 text-sm mt-1">{error}</p>
        <button
          type="button"
          onClick={() => setReloadKey((k) => k + 1)}
          className="mt-4 rounded-lg bg-foil-400 text-ink-950 px-4 py-2.5 min-h-11 font-medium hover:bg-foil-300"
        >
          Erneut laden
        </button>
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-wrap gap-3 mb-6">
        <label className="flex-1 min-w-52">
          <span className="sr-only">Set suchen</span>
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Set suchen …"
            className="w-full rounded-lg bg-ink-900 border border-ink-700 px-3 py-2.5 min-h-11 placeholder:text-mist-500"
          />
        </label>
        <label>
          <span className="sr-only">Nach Serie filtern</span>
          <select
            value={serie}
            onChange={(e) => setSerie(e.target.value)}
            className="rounded-lg bg-ink-900 border border-ink-700 px-3 py-2.5 min-h-11"
          >
            <option value="all">Alle Serien</option>
            {series.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span className="sr-only">Nach Jahr filtern</span>
          <select
            value={year}
            onChange={(e) => setYear(e.target.value)}
            className="rounded-lg bg-ink-900 border border-ink-700 px-3 py-2.5 min-h-11"
          >
            <option value="all">Alle Jahre</option>
            {years.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span className="sr-only">Sortierung</span>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as SortMode)}
            className="rounded-lg bg-ink-900 border border-ink-700 px-3 py-2.5 min-h-11"
          >
            <option value="new">Neueste zuerst</option>
            <option value="old">Älteste zuerst</option>
            <option value="alpha">Alphabetisch</option>
          </select>
        </label>
      </div>

      {sets === null ? (
        <div
          className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
          aria-busy="true"
          aria-label="Sets werden geladen"
        >
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="panel h-40 animate-pulse" />
          ))}
        </div>
      ) : (
        <ul className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 list-none p-0">
          {filtered.map((set) => (
            <li key={set.id} className="panel p-4 flex flex-col gap-3">
              <div className="h-14 flex items-center">
                {set.logo ? (
                  <Image
                    src={set.logo}
                    alt={`Logo des Sets ${set.name}`}
                    width={140}
                    height={52}
                    className="h-12 w-auto object-contain"
                    unoptimized
                  />
                ) : (
                  <span className="text-mist-500 text-sm">Kein Logo</span>
                )}
              </div>
              <div>
                <h3 className="font-medium text-base leading-snug">{set.name}</h3>
                <p className="text-sm text-mist-500 mt-0.5">
                  {set.serie}
                  {set.releaseDate ? ` · ${formatDate(set.releaseDate)}` : ""}
                  {set.cardCountTotal ? ` · ${set.cardCountTotal} Karten` : ""}
                </p>
              </div>
              <div className="mt-auto flex items-center justify-between gap-2">
                {set.simulationAvailable ? (
                  <>
                    <span className="text-xs text-gain-400">✓ Simulation verfügbar</span>
                    <Link
                      href={`/simulator/${set.id}`}
                      className="rounded-lg bg-foil-400 text-ink-950 px-3.5 py-2 min-h-11 inline-flex items-center font-medium text-sm hover:bg-foil-300"
                    >
                      Öffnen
                    </Link>
                  </>
                ) : (
                  <span className="text-xs text-warn-300">Profil noch nicht verfügbar</span>
                )}
              </div>
            </li>
          ))}
          {filtered.length === 0 && (
            <li className="panel p-6 text-mist-500 sm:col-span-2 lg:col-span-3">
              Kein Set entspricht der aktuellen Suche. Suchbegriff oder Filter anpassen.
            </li>
          )}
        </ul>
      )}
    </div>
  );
}
