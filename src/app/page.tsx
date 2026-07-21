import Link from "next/link";
import { APP_CONFIG } from "@/config/app-config";
import { SetBrowser } from "@/components/cards/set-browser";

export default function HomePage() {
  return (
    <div className="mx-auto max-w-[1120px] px-4 sm:px-7">
      <section className="screen-rise max-w-[760px] pb-10 pt-16">
        <p className="mb-5 inline-block rounded-full bg-[oklch(0.8_0.14_200/0.14)] px-4 py-1.5 font-numeric text-xs uppercase tracking-[0.14em] text-[oklch(0.85_0.12_200)]">
          Virtueller Booster-Simulator
        </p>
        <h1 className="text-balance font-display text-4xl font-extrabold leading-[1.02] tracking-[-0.035em] sm:text-[56px]">
          Pokémon-Booster virtuell öffnen und den{" "}
          <span className="bg-gradient-to-r from-accent-cyan to-accent-magenta bg-clip-text text-transparent">
            Kartenwert
          </span>{" "}
          berechnen
        </h1>
        <p className="mt-6 max-w-[620px] text-lg leading-relaxed text-[oklch(0.85_0.02_290)] sm:text-[19px]">
          {APP_CONFIG.description}
        </p>
        <div className="mt-8 flex flex-wrap items-center gap-4">
          <Link href="#sets" className="accent-button min-h-12 px-8 py-3 text-base">
            Booster öffnen →
          </Link>
          <span className="font-numeric text-xs text-text-dim sm:text-[13px]">
            Kostenlose Simulation · keine echten Gewinne
          </span>
        </div>
      </section>

      <section id="sets" aria-labelledby="sets-heading" className="scroll-mt-24 pb-16 pt-6">
        <div className="mb-6 flex items-end justify-between gap-4">
          <h2 id="sets-heading" className="font-display text-3xl font-bold">
            Set auswählen
          </h2>
          <span className="font-numeric text-xs text-text-muted">Alle verfügbaren TCGdex-Sets</span>
        </div>
        <SetBrowser />
      </section>
    </div>
  );
}
