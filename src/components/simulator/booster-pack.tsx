import Image from "next/image";
import type { NormalizedBoosterArtwork } from "@/types";

export function BoosterPack({
  booster,
  setLogo,
  setName,
  className = "",
}: {
  booster: NormalizedBoosterArtwork | null;
  setLogo: string | null;
  setName: string;
  className?: string;
}) {
  if (booster?.artworkFront) {
    return (
      <div className={`relative aspect-[5/8] overflow-hidden ${className}`}>
        <Image
          src={booster.artworkFront}
          alt={`Booster ${booster.name || setName}`}
          fill
          sizes="(max-width: 640px) 176px, 208px"
          className="object-contain drop-shadow-[0_22px_30px_oklch(0.05_0.04_275/0.55)]"
          priority
          unoptimized
        />
      </div>
    );
  }

  return (
    <div
      className={`relative aspect-[5/8] overflow-hidden rounded-[18px] border border-white/18 bg-panel-solid shadow-[0_24px_42px_-20px_oklch(0.05_0.04_275/0.9)] ${className}`}
      aria-label={`Simulierter Booster ${setName}`}
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_22%,oklch(0.6_0.18_200/0.5),transparent_60%),radial-gradient(circle_at_76%_82%,oklch(0.6_0.2_340/0.45),transparent_60%)]" />
      <div className="absolute inset-x-0 top-0 h-4 bg-[repeating-linear-gradient(90deg,transparent_0_7px,oklch(1_0_0/0.22)_8px_9px)]" />
      <div className="foil-seam absolute left-0 right-0 top-[34%]" />
      <div className="relative z-10 flex h-full flex-col items-center justify-center gap-4 px-5 text-center">
        {setLogo ? (
          <Image
            src={setLogo}
            alt={`Logo ${setName}`}
            width={170}
            height={80}
            className="max-h-24 w-auto max-w-full object-contain drop-shadow-[0_4px_12px_oklch(0.08_0.05_275/0.8)]"
            unoptimized
          />
        ) : (
          <span className="font-display text-xl font-extrabold leading-tight">{setName}</span>
        )}
        <span className="font-numeric text-[0.6rem] uppercase tracking-[0.22em] text-text-muted">
          Simulierter Booster
        </span>
      </div>
    </div>
  );
}
