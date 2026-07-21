"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { motion, useAnimationControls, type PanInfo } from "framer-motion";
import type { RevealCard } from "@/lib/simulation/booster-service";
import { formatEur } from "@/lib/calculations/format";
import { PRICE_FIELD_LABELS } from "@/lib/pricing/resolve-card-price";
import type { NormalizedBoosterArtwork, PriceVariants } from "@/types";
import { PokemonCardBack } from "@/components/cards/pokemon-card-back";
import { BoosterPack } from "@/components/simulator/booster-pack";

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
  booster: NormalizedBoosterArtwork | null;
  setLogo: string | null;
  setName: string;
}) {
  const { cards, revealedCount, opening, onOpened, onReveal, animationsEnabled } = props;
  const current = revealedCount > 0 ? (cards[revealedCount - 1] ?? null) : null;
  const next = cards[revealedCount] ?? null;
  const done = revealedCount >= cards.length;
  const stageRef = useRef<HTMLDivElement>(null);
  const dragStarted = useRef(false);
  const dragControls = useAnimationControls();
  const [detailsVisible, setDetailsVisible] = useState(!animationsEnabled);

  useEffect(() => {
    if (!opening) return;
    const t = window.setTimeout(onOpened, animationsEnabled ? 980 : 0);
    return () => window.clearTimeout(t);
  }, [opening, onOpened, animationsEnabled]);

  useEffect(() => {
    setDetailsVisible(!animationsEnabled);
    dragControls.set({ x: 0, rotate: 0, opacity: 1, scale: 1 });
  }, [revealedCount, animationsEnabled, dragControls]);

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

  async function dismissCard(info: PanInfo) {
    if (done) return;
    const shouldDismiss = Math.abs(info.offset.x) > 90 || Math.abs(info.velocity.x) > 650;
    if (!shouldDismiss) {
      await dragControls.start({
        x: 0,
        rotate: 0,
        scale: 1,
        transition: { type: "spring", stiffness: 420, damping: 32 },
      });
      window.setTimeout(() => {
        dragStarted.current = false;
      }, 0);
      return;
    }

    const direction =
      info.offset.x === 0 ? (info.velocity.x >= 0 ? 1 : -1) : Math.sign(info.offset.x);
    await dragControls.start({
      x: direction * 560,
      rotate: direction * 16,
      opacity: 0,
      scale: 0.94,
      transition: { duration: animationsEnabled ? 0.22 : 0 },
    });
    onReveal();
    window.setTimeout(() => {
      dragStarted.current = false;
    }, 0);
  }

  if (opening) {
    return (
      <div
        className="mt-8 flex min-h-[30rem] justify-center pt-6"
        aria-label="Booster wird geöffnet"
        aria-busy="true"
      >
        <motion.div
          initial={animationsEnabled ? { scale: 0.9, opacity: 0, rotate: -2 } : false}
          animate={{ scale: 1, opacity: 1, rotate: 0 }}
          className="relative w-44 sm:w-52"
        >
          <BoosterPack
            booster={props.booster}
            setLogo={props.setLogo}
            setName={props.setName}
            className="w-full"
          />
          <motion.div
            className="absolute inset-x-0 top-[6%] z-20 h-3 bg-gradient-to-r from-transparent via-white/75 to-transparent"
            initial={{ scaleX: 0.15, opacity: 0 }}
            animate={{ scaleX: [0.15, 1.04, 0], opacity: [0, 1, 0] }}
            transition={{ duration: animationsEnabled ? 0.85 : 0, times: [0, 0.45, 1] }}
          />
          <motion.div
            className="absolute inset-x-0 top-0 z-10 h-[12%] overflow-hidden"
            animate={animationsEnabled ? { y: -80, rotate: -9, opacity: 0 } : { opacity: 0 }}
            transition={{
              delay: animationsEnabled ? 0.38 : 0,
              duration: animationsEnabled ? 0.48 : 0,
            }}
          >
            {props.booster?.artworkFront ? (
              <BoosterPack
                booster={props.booster}
                setLogo={props.setLogo}
                setName={props.setName}
                className="w-full"
              />
            ) : (
              <div className="h-full bg-panel-solid" />
            )}
          </motion.div>
        </motion.div>
      </div>
    );
  }

  return (
    <section
      ref={stageRef}
      tabIndex={0}
      aria-label="Booster-Bühne. Ziehe die Karte mit Maus oder Finger zur Seite. Enter oder Leertaste deckt die nächste Karte auf."
      className="screen-rise mt-8 outline-none"
    >
      <p className="mb-5 text-center font-numeric text-sm text-text-muted">
        Karte {Math.min(revealedCount, cards.length)} von {cards.length}
      </p>

      <div className="relative flex min-h-[31rem] justify-center">
        {current === null ? (
          <button
            type="button"
            onClick={onReveal}
            className="group relative h-fit w-56 sm:w-[270px]"
            aria-label="Erste Karte aufdecken"
          >
            <PokemonCardBack className="aspect-[5/7] w-full rounded-[18px] transition-transform duration-300 group-hover:-translate-y-2" />
            <span className="outline-button mt-5 min-h-11 px-5 text-sm">Erste Karte aufdecken</span>
          </button>
        ) : (
          <div className="relative w-56 sm:w-[270px]">
            {!done && (
              <PokemonCardBack className="absolute left-3 top-3 aspect-[5/7] w-full rotate-[2deg] rounded-[18px] opacity-70" />
            )}
            <motion.figure
              animate={dragControls}
              drag={done ? false : "x"}
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={0.85}
              onDragStart={() => {
                dragStarted.current = true;
              }}
              onDragEnd={(_, info) => void dismissCard(info)}
              whileDrag={{ scale: 1.025, cursor: "grabbing" }}
              className={`relative z-10 m-0 w-full touch-pan-y select-none ${done ? "cursor-default" : "cursor-grab"}`}
              onClick={() => {
                if (!done && !dragStarted.current && detailsVisible) onReveal();
              }}
            >
              <motion.div
                key={`${current.cardId}-${revealedCount}`}
                initial={animationsEnabled ? { rotateY: 180, scale: 0.92, opacity: 0.7 } : false}
                animate={{ rotateY: 0, scale: 1, opacity: 1 }}
                transition={{ duration: animationsEnabled ? 0.55 : 0, ease: [0.2, 0.7, 0.3, 1] }}
                onAnimationComplete={() => setDetailsVisible(true)}
                className="relative aspect-[5/7] w-full"
                style={{ transformStyle: "preserve-3d", perspective: 1200 }}
              >
                <PokemonCardBack className="absolute inset-0 rounded-[18px] [backface-visibility:hidden] [transform:rotateY(180deg)]" />
                <CardImage card={current} />
              </motion.div>

              <motion.figcaption
                initial={false}
                animate={{ opacity: detailsVisible ? 1 : 0, y: detailsVisible ? 0 : 8 }}
                transition={{ duration: animationsEnabled ? 0.2 : 0 }}
                aria-hidden={!detailsVisible}
                className="mt-4 space-y-1"
              >
                <p className="font-display text-base font-bold">
                  {current.name}{" "}
                  <span className="font-body font-normal text-text-dim">
                    · Nr. {current.localId}
                  </span>
                </p>
                <p className="text-sm text-[oklch(0.82_0.02_290)]">
                  {current.rarity ?? "Rarität unbekannt"} · {FINISH_LABELS[current.finish]}
                  {current.language === "en" && (
                    <span className="ml-2 rounded-full border border-warn/50 px-2 py-0.5 text-xs text-warn">
                      EN-Daten
                    </span>
                  )}
                </p>
                <p
                  className={`num text-[17px] font-bold ${current.price === null ? "text-text-dim" : "text-text"}`}
                >
                  {current.price === null ? "Kein Marktpreis verfügbar" : formatEur(current.price)}
                </p>
                {current.price !== null && (
                  <p className="text-xs leading-relaxed text-text-dim">
                    Basis:{" "}
                    {current.usedField
                      ? PRICE_FIELD_LABELS[current.usedField as keyof PriceVariants]
                      : "–"}
                    {current.usedFallbackFinish ? " · Preis der Standardvariante" : ""}
                    {current.updatedAt ? ` · Stand: ${current.updatedAt}` : ""}
                  </p>
                )}
                {!done && (
                  <p className="pt-2 text-center font-numeric text-[0.68rem] uppercase tracking-[0.12em] text-text-dim">
                    Karte zur Seite ziehen
                  </p>
                )}
              </motion.figcaption>
            </motion.figure>
          </div>
        )}
      </div>

      {next?.imageHigh && (
        <div className="hidden" aria-hidden="true">
          <Image src={next.imageHigh} alt="" width={10} height={14} unoptimized />
        </div>
      )}

      {revealedCount > 0 && (
        <div
          className="mt-5 flex flex-wrap justify-center gap-2"
          aria-label="Bereits aufgedeckte Karten"
        >
          {cards.slice(0, revealedCount).map((card, index) => (
            <div
              key={`${card.cardId}-${index}`}
              className="h-[62px] w-11 overflow-hidden rounded-lg border border-white/14 bg-panel-solid"
            >
              {card.imageLow ? (
                <Image
                  src={card.imageLow}
                  alt=""
                  width={44}
                  height={62}
                  className="h-full w-full object-contain"
                  unoptimized
                />
              ) : (
                <PokemonCardBack className="h-full w-full rounded-lg border-[3px] p-1" />
              )}
            </div>
          ))}
        </div>
      )}

      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-white/10 bg-[oklch(0.16_0.045_275/0.95)] backdrop-blur sm:static sm:mt-1 sm:border-0 sm:bg-transparent sm:backdrop-blur-none">
        <div className="mx-auto flex max-w-[1120px] flex-wrap justify-center gap-2 px-4 py-3 sm:gap-3 sm:py-6">
          <button
            type="button"
            onClick={onReveal}
            disabled={done}
            className="accent-button min-h-11 px-5 text-sm disabled:opacity-40"
          >
            Nächste Karte
          </button>
          <button
            type="button"
            onClick={props.onRevealAll}
            disabled={done}
            className="outline-button min-h-11 px-5 text-sm disabled:opacity-40"
          >
            Alle aufdecken
          </button>
          <button
            type="button"
            onClick={props.onSkipBulk}
            disabled={done || !next?.isBulk}
            className="outline-button min-h-11 px-5 text-sm disabled:opacity-40"
          >
            Bulk überspringen
          </button>
          <button
            type="button"
            onClick={props.onCancel}
            className="outline-button min-h-11 border-loss/50 px-5 text-sm text-loss hover:border-loss"
          >
            Abbrechen
          </button>
        </div>
      </div>
    </section>
  );
}

function CardImage({ card }: { card: RevealCard }) {
  const highValue = isHighValue(card);
  return (
    <div
      className={`absolute inset-0 overflow-hidden rounded-[18px] border border-white/16 bg-panel-solid shadow-[0_18px_45px_-20px_oklch(0.05_0.04_275/0.9)] [backface-visibility:hidden] ${
        highValue ? "holo-glow holo-sheen" : ""
      }`}
    >
      {card.imageHigh ? (
        <Image
          src={card.imageHigh}
          alt={`Karte ${card.name}`}
          width={600}
          height={825}
          className="h-full w-full object-contain"
          priority
          unoptimized
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center px-4 text-center text-sm text-text-dim">
          Kein Kartenbild verfügbar
        </div>
      )}
    </div>
  );
}
