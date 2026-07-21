export function PokemonCardBack({ className = "", label }: { className?: string; label?: string }) {
  // `.card-back` benoetigt fuer seine Pseudo-Elemente standardmaessig eine
  // relative Position. Wird die Komponente jedoch als Kartenface oder
  // Stapelkarte absolut positioniert, muss diese Position Vorrang haben.
  const positionedAbsolutely = /(^|\s)absolute(\s|$)/.test(className);

  return (
    <div
      className={`card-back flex flex-col items-center justify-between p-[12%] ${className}`}
      style={positionedAbsolutely ? { position: "absolute" } : undefined}
      aria-hidden="true"
    >
      <span className="card-back-logo text-[clamp(1.2rem,8vw,2.4rem)] leading-none">POKÉMON</span>
      <span className="pokeball" />
      <span className="card-back-logo rotate-[173deg] text-[clamp(1.2rem,8vw,2.4rem)] leading-none">
        POKÉMON
      </span>
      {label && (
        <span className="absolute inset-x-3 bottom-2 rounded-full bg-black/45 px-2 py-1 text-center font-numeric text-[0.58rem] tracking-wide text-white/85">
          {label}
        </span>
      )}
    </div>
  );
}
