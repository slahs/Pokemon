import { APP_CONFIG } from "@/config/app-config";
import { SetBrowser } from "@/components/cards/set-browser";

export default function HomePage() {
  return (
    <div className="mx-auto max-w-6xl px-4">
      <section className="py-14 sm:py-20 max-w-3xl">
        <p className="text-xs uppercase tracking-[0.2em] text-foil-400 mb-4">
          Virtueller Booster-Simulator
        </p>
        <h1 className="text-3xl sm:text-5xl font-semibold leading-tight text-balance">
          {APP_CONFIG.tagline}
        </h1>
        <p className="mt-5 text-mist-300 text-base sm:text-lg max-w-2xl">
          {APP_CONFIG.description}
        </p>
        <p className="mt-4 text-sm text-mist-500">{APP_CONFIG.freeNotice}</p>
      </section>

      <div className="foil-seam mb-10" aria-hidden="true" />

      <section id="sets" aria-labelledby="sets-heading" className="pb-10 scroll-mt-20">
        <h2 id="sets-heading" className="text-2xl font-semibold mb-6">
          Set auswählen
        </h2>
        <SetBrowser />
      </section>
    </div>
  );
}
