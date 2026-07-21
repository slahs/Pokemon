import { APP_CONFIG } from "@/config/app-config";

export const metadata = { title: "Information – BoosterBilanz" };

export default function InfoPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10 space-y-10">
      <section>
        <h1 className="text-2xl font-semibold mb-3">Information</h1>
        <p className="text-mist-300">
          {APP_CONFIG.name} ist ein virtueller Booster-Simulator. Simulierte Booster werden mit
          echten Marktdaten bewertet, damit sich der theoretische Kartenwert mit dem Kaufpreis
          vergleichen lässt. {APP_CONFIG.freeNotice}
        </p>
      </section>

      <section aria-labelledby="sim-heading">
        <h2 id="sim-heading" className="text-lg font-semibold mb-2">
          Simulationshinweis
        </h2>
        <p className="text-mist-300">
          Die verwendeten Ziehungswahrscheinlichkeiten sind geschätzte Modelle und keine
          offiziellen Pull Rates. Die Zusammensetzung echter Booster kann deutlich abweichen.
          Details und Annahmen sind in der Projektdokumentation
          (docs/simulation-sources.md) beschrieben.
        </p>
        <p className="text-mist-300 mt-2">{APP_CONFIG.valueDisclaimer}</p>
      </section>

      <section aria-labelledby="sources-heading">
        <h2 id="sources-heading" className="text-lg font-semibold mb-2">
          Quellenübersicht
        </h2>
        <p className="text-mist-300">
          Kartendaten, Setinformationen, Kartenbilder und Cardmarket-Marktpreise stammen aus der
          dokumentierten, öffentlichen{" "}
          <a href="https://tcgdex.dev" className="underline" target="_blank" rel="noopener noreferrer">
            TCGdex-API
          </a>
          . Deutsche Daten werden bevorzugt; fehlen sie, wird sichtbar gekennzeichnet auf
          englische Daten zurückgegriffen. Es werden keine Daten von Drittseiten gescrapt.
        </p>
      </section>

      <section aria-labelledby="privacy-heading">
        <h2 id="privacy-heading" className="text-lg font-semibold mb-2">
          Datenschutz (Platzhalter)
        </h2>
        <p className="text-mist-500 text-sm">
          Platzhalter: Diese Anwendung speichert Sitzungsdaten ausschließlich lokal im Browser
          (Local Storage). Es findet kein Tracking statt und es werden keine personenbezogenen
          Daten an einen Server übertragen. Vor einer Veröffentlichung ist dieser Abschnitt durch
          eine vollständige Datenschutzerklärung zu ersetzen.
        </p>
      </section>

      <section aria-labelledby="imprint-heading">
        <h2 id="imprint-heading" className="text-lg font-semibold mb-2">
          Impressum (Platzhalter)
        </h2>
        <p className="text-mist-500 text-sm">
          Platzhalter: Angaben gemäß § 5 DDG sind vor einer Veröffentlichung zu ergänzen
          (Name, Anschrift, Kontakt).
        </p>
      </section>

      <section aria-labelledby="legal-heading">
        <h2 id="legal-heading" className="text-lg font-semibold mb-2">
          Rechtlicher Hinweis
        </h2>
        <p className="text-mist-500 text-sm">{APP_CONFIG.legalFooter}</p>
      </section>
    </div>
  );
}
