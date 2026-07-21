"use client";

import type { PointerEvent, ReactNode } from "react";
import type { CardFinish } from "@/types";
import { getRarityEffectTier } from "@/lib/presentation/rarity-effects";
import styles from "./rarity-card-surface.module.css";

export function RarityCardSurface({
  rarity,
  finish,
  children,
  className = "",
  interactive = true,
}: {
  rarity: string | null | undefined;
  finish: CardFinish;
  children: ReactNode;
  className?: string;
  interactive?: boolean;
}) {
  const tier = getRarityEffectTier(rarity, finish);

  function handlePointerMove(event: PointerEvent<HTMLDivElement>) {
    if (!interactive || tier === 0 || event.pointerType === "touch") return;
    const rect = event.currentTarget.getBoundingClientRect();
    const x = Math.min(1, Math.max(0, (event.clientX - rect.left) / rect.width));
    const y = Math.min(1, Math.max(0, (event.clientY - rect.top) / rect.height));
    event.currentTarget.style.setProperty("--foil-x", `${Math.round(x * 100)}%`);
    event.currentTarget.style.setProperty("--foil-y", `${Math.round(y * 100)}%`);
    event.currentTarget.style.setProperty("--tilt-x", `${((0.5 - y) * 8).toFixed(2)}deg`);
    event.currentTarget.style.setProperty("--tilt-y", `${((x - 0.5) * 10).toFixed(2)}deg`);
  }

  function resetPointer(event: PointerEvent<HTMLDivElement>) {
    event.currentTarget.style.setProperty("--foil-x", "50%");
    event.currentTarget.style.setProperty("--foil-y", "50%");
    event.currentTarget.style.setProperty("--tilt-x", "0deg");
    event.currentTarget.style.setProperty("--tilt-y", "0deg");
  }

  return (
    <div
      data-tier={tier}
      className={`${styles.surface} ${interactive ? styles.interactive : ""} ${className}`}
      onPointerMove={handlePointerMove}
      onPointerLeave={resetPointer}
    >
      <div className={styles.content}>{children}</div>
      {tier > 0 && <span className={styles.foil} aria-hidden="true" />}
      {tier >= 2 && <span className={styles.spectrum} aria-hidden="true" />}
      {tier >= 3 && <span className={styles.sparkles} aria-hidden="true" />}
      {tier >= 4 && (
        <span className={styles.particles} aria-hidden="true">
          <span className={styles.particle} />
          <span className={styles.particle} />
          <span className={styles.particle} />
          <span className={styles.particle} />
        </span>
      )}
    </div>
  );
}
