"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import type { RevealCard } from "@/lib/simulation/booster-service";
import { formatEur } from "@/lib/calculations/format";
import { PRICE_FIELD_LABELS } from "@/lib/pricing/resolve-card-price";
import type { PriceVariants } from "@/types";

const FINISH_LABELS = { normal: "Normal", reverse: "Reverse Holo", holo: "Holo" } as const;

function isHighValue(card: RevealCard): boolean {
  return (card.price ?? 0) >= 5 || (!card.isBulk && card.finish === "holo");
}

export function RevealStage(props: {
  cards: RevealCard[];
  revealedCount: number;
  opening: boolean;
  onOpened: () => void;
  onReveal: () => void;
  onRevealAll: () => void;
  onSkipBulk: () => void;
  onCancel: () => void;
  animationsEnabled: boolean;
}) {
  const { cards, revealedCount, opening, onOpened, onReveal, animationsEnabled } = props;
  const current = revealedCount > 0 ? (cards[revealedCount - 1] ?? null) : null;
  const next = cards[revealedCount] ?? null;
  const done = revealedCount >= cards.length;
  const stageRef = useRef<HTMLDivElement>(null);
  const touchStartX = useRef<number | null>(null);
  const [flipKey, setFlipKey] = useState(0);

  // Aufreissanimation automatisch beenden
  useEffect(() => {
    if (!opening) return;
    const t = window.setTimeout(onOpened, animationsEnabled ? 900 : 0);
    return () => window.clearTimeout(t);
  }, [opening, onOpened, animationsEnabled]);

  useEffect(() => setFlipKey((k) => k + 1), [revealedCount]);

  // Tastatursteuerung: Enter/Leertaste deckt auf
  useEffect(() => {
    const el = stageRef.current;
    if (!el) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        if (!done && !opening) onReveal();
      }
    };
    el.addEventListener("keydown", handler);
    return () => el.removeEventListener("keydown", handler);
  }, [done, opening, onReveal]);

  if (opening) {
    return (
      <div className="mt-8 flex justify-center" aria-label="Booster wird geöffnet" aria-busy="true">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="relative w-44 aspect-[5/8] card-back rounded-xl overflow-hidden"
        >
          <motion.div
            className="foil-seam absolute left-0 right-0 top-10"
            initial={{ scaleX: 1 }}
            animate={{ scaleX: [1, 1.06, 0] }}
            transition={{ duration: 0.8, times: [0, 0.4, 1] }}
          />
          <motion.div
            className="absolute inset-x-0 top-0 h-10 bg-ink-700"
            animate={{ y: -60, rotate: -8, opacity: 0 }}
            transition={{ delay: 0.35, duration: 0.5 }}
          />
        </motion.div>
      </div>
    );
  }

  return (
    <section
      ref={stageRef}
      tabIndex={0}
      aria-label="Booster-Bühne. Enter oder Leertaste deckt die nächste Karte auf."
      className="mt-8 outline-none"
      onTouchStart={(e) => {
        touchStartX.current = e.touches[0]?.clientX ?? null;
      }}
      onTouchEnd={(e) => {
        const start = touchStartX.current;
        const end = e.changedTouches[0]?.clientX ?? null;
        touchStartX.current = null;
        if (start !== null && end !== null && start - end > 60 && !done) onReveal();
      }}
    >
      <p className="text-center text-sm text-mist-500 mb-4">
        Karte {Math.min(revealedCount, cards.length)} von {cards.length}
      </p>

      <div className="flex justify-center min-h-[24rem] sm:min-h-[28rem]">
        {current === null ? (
          <button
            type="button"
            onClick={onReveal}
            className="w-56 sm:w-64 aspect-[5/7] card-back rounded-2xl flex items-center justify-center text-mist-300 hover:border-foil-400 transition-colors"
          >
            Erste Karte aufdecken
          </button>
        ) : (
          <AnimatePresence mode="wait">
            <motion.div
              key={flipKey}
              initial={animationsEnabled ? { rotateY: 180, opacity: 0.6 } : false}
              animate={{ rotateY: 0, opacity: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={{ duration: animationsEnabled ? 0.45 : 0 }}
              style={{ transformStyle: "preserve-3d", perspective: 1200 }}
              className="relative"
            >
              <CardFace card={current} onClick={done ? undefined : props.onReveal} />
            </motion.div>
          </AnimatePresence>
        )}
      </div>

      {/* Naechste Kartenabbildung vorladen */}
      {next?.imageHigh && (
        <div className="hidden" aria-hidden="true">
          <Image src={next.imageHigh} alt="" width={10} height={14} unoptimized />
        </div>
      )}

      <div className="fixed bottom-0 inset-x-0 sm:static bg-ink-950/95 sm:bg-transparent border-t border-ink-700 sm:border-0 backdrop-blur sm:backdrop-blur-none z-30">
        <div className="mx-auto max-w-6xl px-4 py-3 sm:py-6 flex flex-wrap justify-center gap-2 sm:gap-3">
          <button
            type="button"
            onClick={onReveal}
            disabled={done}
            className="rounded-lg bg-foil-400 text-ink-950 px-4 py-2.5 min-h-11 font-medium hover:bg-foil-300 disabled:opacity-40"
          >
            Nächste Karte
          </button>
          <button
            type="button"
            onClick={props.onRevealAll}
            disabled={done}
            className="rounded-lg border border-ink-600 px-4 py-2.5 min-h-11 hover:border-foil-400 disabled:opacity-40"
          >
            Alle aufdecken
          </button>
          <button
            type="button"
            onClick={props.onSkipBulk}
            disabled={done || !next?.isBulk}
            className="rounded-lg border border-ink-600 px-4 py-2.5 min-h-11 hover:border-foil-400 disabled:opacity-40"
          >
            Bulk überspringen
          </button>
          <button
            type="button"
            onClick={props.onCancel}
            className="rounded-lg border border-loss-400/50 text-loss-400 px-4 py-2.5 min-h-11 hover:border-loss-400"
          >
            Booster abbrechen
          </button>
        </div>
      </div>
    </section>
  );
}

function CardFace({ card, onClick }: { card: RevealCard; onClick?: () => void }) {
  const highValue = isHighValue(card);
  return (
    <figure
      className={`relative w-56 sm:w-64 rounded-2xl ${highValue ? "holo-glow" : ""}`}
      onClick={onClick}
    >
      {highValue && (
        <div aria-hidden="true" className="absolute inset-0 pointer-events-none overflow-visible">
          {[0, 1, 2, 3].map((i) => (
            <span
              key={i}
              className="particle absolute h-1.5 w-1.5 rounded-full bg-foil-300"
              style={{
                left: `${15 + i * 22}%`,
                bottom: "10%",
                animationDelay: `${i * 0.5}s`,
              }}
            />
          ))}
        </div>
      )}
      <div className="aspect-[5/7] rounded-2xl overflow-hidden bg-ink-800 border border-ink-600">
        {card.imageHigh ? (
          <Image
            src={card.imageHigh}
            alt={`Karte ${card.name}`}
            width={480}
            height={672}
            className="w-full h-full object-contain"
            priority
            unoptimized
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-mist-500 text-sm px-4 text-center">
            Kein Kartenbild verfügbar
          </div>
        )}
      </div>
      <figcaption className="mt-3 text-sm space-y-1">
        <p className="font-medium text-base">
          {card.name} <span className="text-mist-500">· Nr. {card.localId}</span>
        </p>
        <p className="text-mist-300">
          {card.rarity ?? "Rarität unbekannt"} · {FINISH_LABELS[card.finish]}
          {card.language === "en" && (
            <span className="ml-2 text-warn-300 text-xs border border-warn-300/50 rounded px-1.5 py-0.5">
              EN-Daten
            </span>
          )}
        </p>
        <p className="num text-base">
          {card.price === null ? (
            <span className="text-mist-500">Kein Marktpreis verfügbar</span>
          ) : (
            formatEur(card.price)
          )}
        </p>
        {card.price !== null && (
          <p className="text-xs text-mist-500">
            Basis: {card.usedField ? PRICE_FIELD_LABELS[card.usedField as keyof PriceVariants] : "–"}
            {card.usedFallbackFinish ? " · Preis der Standardvariante" : ""}
            {card.updatedAt ? ` · Stand: ${card.updatedAt}` : ""}
          </p>
        )}
      </figcaption>
    </figure>
  );
}
