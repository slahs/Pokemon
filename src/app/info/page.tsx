import { APP_CONFIG } from "@/config/app-config";

export const metadata = { title: "Information – BoosterBilanz" };

const sections = [
  {
    id: "sim-heading",
    title: "Simulationshinweis",
    content: (
      <>
        <p>
          Die verwendeten Ziehungswahrscheinlichkeiten sind geschätzte Modelle und keine offiziellen
          Pull Rates. Die Zusammensetzung echter Booster kann deutlich abweichen. Details und
          Annahmen sind in docs/simulation-sources.md beschrieben.
        </p>
        <p className="mt-2">{APP_CONFIG.valueDisclaimer}</p>
      </>
    ),
  },
  {
    id: "sources-heading",
    title: "Quellenübersicht",
    content: (
      <p>
        Kartendaten, Setinformationen, Kartenbilder, Booster-Artworks und Cardmarket-Marktpreise
        stammen aus der dokumentierten, öffentlichen{" "}
        <a
          href="https://tcgdex.dev"
          className="text-accent-cyan hover:text-foil-300"
          target="_blank"
          rel="noopener noreferrer"
        >
          TCGdex-API
        </a>
        . Deutsche Daten werden bevorzugt; fehlen sie, wird sichtbar auf englische Daten
        zurückgegriffen.
      </p>
    ),
  },
  {
    id: "privacy-heading",
    title: "Datenschutz (Platzhalter)",
    content: (
      <p>
        Platzhalter: Diese Anwendung speichert Sitzungsdaten ausschließlich lokal im Browser. Es
        findet kein Tracking statt und es werden keine personenbezogenen Daten an einen Server
        übertragen.
      </p>
    ),
  },
  {
    id: "imprint-heading",
    title: "Impressum (Platzhalter)",
    content: (
      <p>
        Platzhalter: Angaben gemäß § 5 DDG sind vor einer Veröffentlichung zu ergänzen (Name,
        Anschrift, Kontakt).
      </p>
    ),
  },
  {
    id: "legal-heading",
    title: "Rechtlicher Hinweis",
    content: <p>{APP_CONFIG.legalFooter}</p>,
  },
];

export default function InfoPage() {
  return (
    <div className="screen-rise mx-auto max-w-[840px] px-4 py-12 sm:px-7">
      <h1 className="font-display text-3xl font-bold">Information</h1>
      <p className="mt-4 text-[oklch(0.85_0.02_290)] leading-relaxed">
        {APP_CONFIG.name} ist ein virtueller Booster-Simulator. Simulierte Booster werden mit echten
        Marktdaten bewertet, damit sich der theoretische Kartenwert mit dem Kaufpreis vergleichen
        lässt. {APP_CONFIG.freeNotice}
      </p>
      <div className="mt-8 space-y-4">
        {sections.map((section) => (
          <section key={section.id} aria-labelledby={section.id} className="panel rounded-2xl p-6">
            <h2 id={section.id} className="mb-2 font-display text-lg font-bold">
              {section.title}
            </h2>
            <div className="text-sm leading-relaxed text-text-muted">{section.content}</div>
          </section>
        ))}
      </div>
    </div>
  );
}
