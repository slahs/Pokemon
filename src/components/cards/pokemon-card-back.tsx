import Image from "next/image";
import { POKEMON_CARD_BACK_DATA_URL } from "@/components/cards/pokemon-card-back-data";

export function PokemonCardBack({ className = "", label }: { className?: string; label?: string }) {
  // Absolute Kartenflächen müssen deckungsgleich im 3D-Stapel liegen. Für
  // normale Vorschauen bleibt der Wrapper relativ positioniert, damit das
  // eingebettete Bild mit `fill` korrekt skaliert.
  const positionedAbsolutely = /(^|\s)absolute(\s|$)/.test(className);

  return (
    <div
      className={`isolate overflow-hidden bg-[#1d2d63] shadow-[0_18px_45px_-24px_oklch(0.05_0.04_275/0.9)] ${className}`}
      style={{ position: positionedAbsolutely ? "absolute" : "relative" }}
      aria-hidden="true"
    >
      <Image
        src={POKEMON_CARD_BACK_DATA_URL}
        alt=""
        fill
        sizes="(max-width: 640px) 224px, 270px"
        className="pointer-events-none select-none object-fill"
        draggable={false}
        unoptimized
      />
      {label && (
        <span className="absolute inset-x-3 bottom-2 z-10 rounded-full bg-black/55 px-2 py-1 text-center font-numeric text-[0.58rem] tracking-wide text-white/90">
          {label}
        </span>
      )}
    </div>
  );
}
