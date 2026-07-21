"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { findProfileForSet } from "@/config/simulation-profiles";
import { openBooster, buildBoosterRecord, type RevealCard } from "@/lib/simulation/booster-service";
import { createCryptoRng } from "@/lib/simulation/rng";
import { appendBooster } from "@/lib/storage/session-storage";
import { useSettings } from "@/components/settings-context";
import { formatEur } from "@/lib/calculations/format";
import { calculateProfit } from "@/lib/calculations/profit";
import { loadSession } from "@/lib/storage/session-storage";
import { StatsBar } from "@/components/statistics/stats-bar";
import { RevealStage } from "@/components/simulator/reveal-stage";
import { BoosterSummary } from "@/components/simulator/booster-summary";
import { BoosterPack } from "@/components/simulator/booster-pack";
import type { BoosterRecord, SetPoolResponse } from "@/types";

type Phase = "loading" | "error" | "ready" | "opening" | "revealing" | "summary";

export function SimulatorClient({ setId }: { setId: string }) {
  const { settings, setPackPriceForSet, hydrated } = useSettings();
  const profile = useMemo(() => findProfileForSet(setId), [setId]);

  const [pool, setPool] = useState<SetPoolResponse | null>(null);
  const [phase, setPhase] = useState<Phase>("loading");
  const [loadError, setLoadError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  const [cards, setCards] = useState<RevealCard[]>([]);
  const [revealedCount, setRevealedCount] = useState(0);
  const [record, setRecord] = useState<BoosterRecord | null>(null);
  const [sessionNet, setSessionNet] = useState(0);
  const [packPriceInput, setPackPriceInput] = useState("");
  const [boosterIndex, setBoosterIndex] = useState(0);

  const liveRef = useRef<HTMLDivElement>(null);

  // Kaufpreis pro Set aus den Einstellungen vorbelegen.
  useEffect(() => {
    if (!hydrated) return;
    const stored = settings.packPricesBySet[setId] ?? settings.defaultPackPrice;
    setPackPriceInput(stored.toFixed(2).replace(".", ","));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated, setId]);

  useEffect(() => {
    setSessionNet(loadSession().boosters.reduce((s, b) => s + b.netProfitLoss, 0));
  }, []);

  useEffect(() => {
    let cancelled = false;
    setPhase("loading");
    setLoadError(null);
    fetch(`/api/sets/${encodeURIComponent(setId)}/pool`)
      .then(async (res) => {
        if (!res.ok) {
          const body = (await res.json().catch(() => null)) as { error?: string } | null;
          throw new Error(body?.error ?? "Kartenpool konnte nicht geladen werden.");
        }
        return res.json() as Promise<SetPoolResponse>;
      })
      .then((data) => {
        if (cancelled) return;
        setPool(data);
        setBoosterIndex(
          data.set.boosters.length > 0 ? Math.floor(Math.random() * data.set.boosters.length) : 0,
        );
        setPhase("ready");
      })
      .catch((err: Error) => {
        if (cancelled) return;
        setLoadError(err.message);
        setPhase("error");
      });
    return () => {
      cancelled = true;
    };
  }, [setId, reloadKey]);

  const packPrice = useMemo(() => {
    const parsed = Number.parseFloat(packPriceInput.replace(",", "."));
    return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
  }, [packPriceInput]);

  const announce = useCallback((text: string) => {
    if (liveRef.current) liveRef.current.textContent = text;
  }, []);

  const playRevealSound = useCallback(() => {
    if (!settings.soundEnabled) return;
    try {
      const AudioCtx = window.AudioContext;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.frequency.value = 660;
      gain.gain.setValueAtTime(0.06, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.18);
      osc.connect(gain).connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.2);
      osc.onended = () => void ctx.close();
    } catch {
      // Sound ist optional
    }
  }, [settings.soundEnabled]);

  const startBooster = useCallback(() => {
    if (!pool || !profile) return;
    try {
      const drawn = openBooster(profile, pool.cards, createCryptoRng(), {
        priceMode: settings.priceMode,
        bulkThreshold: settings.bulkThreshold,
      });
      setPackPriceForSet(setId, packPrice);
      setCards(drawn);
      setRevealedCount(0);
      setRecord(null);
      setPhase(settings.animationsEnabled && !settings.reducedAnimations ? "opening" : "revealing");
      announce("Booster geöffnet. Erste Karte kann aufgedeckt werden.");
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : "Simulation fehlgeschlagen.");
      setPhase("error");
    }
  }, [
    pool,
    profile,
    settings.priceMode,
    settings.bulkThreshold,
    settings.animationsEnabled,
    settings.reducedAnimations,
    setPackPriceForSet,
    setId,
    packPrice,
    announce,
  ]);

  const finishBooster = useCallback(
    (allCards: RevealCard[]) => {
      if (!pool || !profile) return;
      const rec = buildBoosterRecord({
        cards: allCards,
        setId,
        setName: pool.set.name,
        profileId: profile.id,
        packPurchasePrice: packPrice,
        priceMode: settings.priceMode,
        sellingFeePercent: settings.sellingFeePercent,
        fixedSellingCosts: settings.fixedSellingCosts,
      });
      setRecord(rec);
      if (settings.autoSaveSession) {
        const state = appendBooster(rec);
        setSessionNet(state.boosters.reduce((s, b) => s + b.netProfitLoss, 0));
      } else {
        setSessionNet((s) => s + rec.netProfitLoss);
      }
      setPhase("summary");
      if (pool.set.boosters.length > 1) {
        setBoosterIndex((current) => {
          const next = Math.floor(Math.random() * pool.set.boosters.length);
          return next === current ? (next + 1) % pool.set.boosters.length : next;
        });
      }
      announce(
        `Booster ausgewertet. Kartenwert ${formatEur(rec.grossCardValue)}, Nettoergebnis ${formatEur(rec.netProfitLoss)}.`,
      );
    },
    [pool, profile, setId, packPrice, settings, announce],
  );

  const revealNext = useCallback(
    (count = 1) => {
      setRevealedCount((prev) => {
        const next = Math.min(prev + count, cards.length);
        if (next > prev) {
          playRevealSound();
          const card = cards[next - 1];
          if (card) {
            announce(
              `Karte ${next} von ${cards.length}: ${card.name}, ${card.rarity ?? "Rarität unbekannt"}, ${
                card.price === null ? "kein Marktpreis verfügbar" : formatEur(card.price)
              }.`,
            );
          }
        }
        if (next >= cards.length) {
          // Auswertung nach kurzer Verzögerung, damit der letzte Flip sichtbar bleibt.
          window.setTimeout(() => finishBooster(cards), 650);
        }
        return next;
      });
    },
    [cards, playRevealSound, announce, finishBooster],
  );

  const skipBulk = useCallback(() => {
    setRevealedCount((prev) => {
      let next = prev;
      while (next < cards.length && cards[next]?.isBulk) next++;
      if (next === prev && next < cards.length) return prev;
      if (next >= cards.length) {
        window.setTimeout(() => finishBooster(cards), 400);
      } else {
        announce(`${next - prev} Bulk-Karten automatisch aufgedeckt.`);
      }
      return next;
    });
  }, [cards, finishBooster, announce]);

  const revealAll = useCallback(() => {
    setRevealedCount(cards.length);
    window.setTimeout(() => finishBooster(cards), 400);
  }, [cards, finishBooster]);

  const cancelBooster = useCallback(() => {
    setCards([]);
    setRevealedCount(0);
    setPhase("ready");
    announce("Booster abgebrochen.");
  }, [announce]);

  // Auto-Aufdeckung, wenn in den Einstellungen aktiviert.
  useEffect(() => {
    if (phase !== "revealing" || !settings.autoReveal) return;
    if (revealedCount >= cards.length) return;
    const t = window.setTimeout(() => revealNext(1), 900);
    return () => window.clearTimeout(t);
  }, [phase, settings.autoReveal, revealedCount, cards.length, revealNext]);

  const revealedCards = cards.slice(0, revealedCount);
  const selectedBooster = pool?.set.boosters[boosterIndex] ?? null;
  const liveProfit = useMemo(
    () =>
      calculateProfit({
        cardPrices: revealedCards.filter((c) => !c.excludedFromValue).map((c) => c.price),
        packPurchasePrice: packPrice,
        sellingFeePercentage: settings.sellingFeePercent / 100,
        fixedSellingCosts: settings.fixedSellingCosts,
      }),
    [revealedCards, packPrice, settings.sellingFeePercent, settings.fixedSellingCosts],
  );

  if (!profile) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16">
        <div className="panel p-8 text-center">
          <h1 className="text-xl font-semibold">Profil noch nicht verfügbar</h1>
          <p className="text-mist-300 mt-2">
            Für dieses Set existiert noch kein Simulationsprofil. Es kann daher nicht geöffnet
            werden.
          </p>
          <Link
            href="/#sets"
            className="mt-6 inline-flex rounded-lg bg-foil-400 text-ink-950 px-4 py-2.5 min-h-11 items-center font-medium"
          >
            Anderes Set wählen
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="screen-rise mx-auto max-w-[1120px] px-4 pb-28 sm:px-7 sm:pb-10">
      <div ref={liveRef} aria-live="polite" className="sr-only" />

      {/* Kopfbereich */}
      <header className="flex flex-wrap items-center gap-4 py-8">
        {pool?.set.logo && (
          <Image
            src={pool.set.logo}
            alt=""
            width={150}
            height={56}
            className="h-12 w-auto max-w-[150px] object-contain"
            unoptimized
          />
        )}
        <div className="min-w-0">
          <h1 className="truncate font-display text-2xl font-bold">
            {pool?.set.name ?? "Set wird geladen …"}
          </h1>
          <p className="text-sm text-text-muted">
            {pool?.set.serie ?? ""} · Profil: {profile.name}
          </p>
        </div>
        <Link href="/#sets" className="outline-button ml-auto min-h-11 px-4 text-sm">
          Anderes Set
        </Link>
      </header>

      {profile.confidence === "estimated" && (
        <p className="mb-5 rounded-xl border border-warn/30 bg-[oklch(0.5_0.12_80/0.14)] px-4 py-2.5 text-sm text-warn">
          {profile.disclaimer ?? "Geschätztes Simulationsmodell – keine offiziellen Pull Rates."}
        </p>
      )}
      {pool && pool.englishFallbackCount > 0 && (
        <p className="mb-4 text-sm text-mist-500">
          Hinweis: {pool.englishFallbackCount} Karten dieses Sets sind nur mit englischen Daten
          verfügbar.
        </p>
      )}

      <StatsBar
        packPrice={packPrice}
        cardValue={liveProfit.grossCardValue}
        gross={liveProfit.grossProfitLoss}
        net={liveProfit.netProfitLoss}
        sessionNet={sessionNet}
        incomplete={liveProfit.incomplete}
        showResults={phase === "revealing" || phase === "summary" || phase === "opening"}
      />

      {phase === "loading" && (
        <div className="panel mt-6 p-10 text-center" aria-busy="true">
          <div className="mx-auto h-56 w-40 card-back rounded-xl animate-pulse" />
          <p className="mt-4 text-mist-500">
            Kartenpool und Marktpreise werden geladen … Beim ersten Aufruf eines Sets kann das einen
            Moment dauern.
          </p>
        </div>
      )}

      {phase === "error" && (
        <div className="panel mt-6 p-8 text-center" role="alert">
          <p className="font-medium">Daten konnten nicht geladen werden.</p>
          <p className="text-sm text-mist-500 mt-1">{loadError}</p>
          <button
            type="button"
            onClick={() => setReloadKey((k) => k + 1)}
            className="mt-5 rounded-lg bg-foil-400 text-ink-950 px-4 py-2.5 min-h-11 font-medium hover:bg-foil-300"
          >
            Erneut laden
          </button>
        </div>
      )}

      {phase === "ready" && pool && (
        <section className="mt-8 grid items-start gap-7 lg:grid-cols-[1fr_20rem]">
          <div className="panel flex flex-col items-center p-8 text-center sm:p-11">
            <BoosterPack
              booster={selectedBooster}
              setLogo={pool.set.logo}
              setName={pool.set.name}
              className="pack-float w-44 sm:w-52"
            />
            {selectedBooster?.name && (
              <p className="mt-3 font-numeric text-xs text-text-dim">{selectedBooster.name}</p>
            )}
            <button
              type="button"
              onClick={startBooster}
              className="accent-button mt-7 min-h-12 px-10 text-base"
            >
              Booster öffnen
            </button>
          </div>

          <aside className="panel space-y-4 p-6">
            <h2 className="font-medium">Vor dem Öffnen</h2>
            <label className="block text-sm">
              <span className="text-mist-300">Booster-Kaufpreis (€)</span>
              <input
                inputMode="decimal"
                value={packPriceInput}
                onChange={(e) => setPackPriceInput(e.target.value)}
                className="mt-2 min-h-11 w-full rounded-xl border border-white/16 bg-input px-4 py-2.5 font-numeric"
                aria-describedby="price-hint"
              />
              <span id="price-hint" className="text-xs text-mist-500">
                Wird für dieses Set gespeichert.
              </span>
            </label>
            <p className="text-xs text-mist-500">
              Preisbasis: in den Einstellungen wählbar. Booster enthält {profile.packSize} Karten.
            </p>
          </aside>
        </section>
      )}

      {(phase === "opening" || phase === "revealing") && pool && (
        <RevealStage
          cards={cards}
          revealedCount={revealedCount}
          opening={phase === "opening"}
          onOpened={() => setPhase("revealing")}
          onReveal={() => revealNext(1)}
          onRevealAll={revealAll}
          onSkipBulk={skipBulk}
          onCancel={cancelBooster}
          animationsEnabled={settings.animationsEnabled && !settings.reducedAnimations}
          booster={selectedBooster}
          setLogo={pool.set.logo}
          setName={pool.set.name}
        />
      )}

      {phase === "summary" && record && (
        <BoosterSummary record={record} onNextBooster={startBooster} />
      )}
    </div>
  );
}
