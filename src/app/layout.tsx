import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";
import { APP_CONFIG } from "@/config/app-config";
import { SettingsProvider } from "@/components/settings-context";
import { AppLogo } from "@/components/ui/logo";

export const metadata: Metadata = {
  title: `${APP_CONFIG.name} – Virtueller Pokémon-Booster-Simulator`,
  description: APP_CONFIG.description,
};

const NAV_ITEMS = [
  { href: "/", label: "Booster öffnen" },
  { href: "/#sets", label: "Sets" },
  { href: "/session", label: "Session" },
  { href: "/settings", label: "Einstellungen" },
  { href: "/info", label: "Information" },
];

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="de">
      <body className="min-h-screen flex flex-col antialiased">
        <SettingsProvider>
          <header className="sticky top-0 z-40 bg-ink-950/90 backdrop-blur border-b border-ink-700">
            <div className="mx-auto max-w-6xl px-4 py-3 flex flex-wrap items-center gap-x-6 gap-y-2">
              <Link
                href="/"
                className="flex items-center gap-2 text-lg font-semibold tracking-tight"
                style={{ fontFamily: "var(--font-display)" }}
              >
                <AppLogo size={24} />
                {APP_CONFIG.name}
              </Link>
              <nav aria-label="Hauptnavigation" className="flex flex-wrap gap-x-5 gap-y-1 text-sm">
                {NAV_ITEMS.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="text-mist-300 hover:text-mist-100 py-2 transition-colors"
                  >
                    {item.label}
                  </Link>
                ))}
              </nav>
            </div>
            <div className="foil-seam" aria-hidden="true" />
          </header>

          <main className="flex-1">{children}</main>

          <footer className="border-t border-ink-700 mt-16">
            <div className="mx-auto max-w-6xl px-4 py-8 text-xs text-mist-500 space-y-3">
              <p>{APP_CONFIG.legalFooter}</p>
              <p>
                Kartendaten und Marktpreise über die dokumentierte{" "}
                <a
                  href="https://tcgdex.dev"
                  className="underline hover:text-mist-300"
                  rel="noopener noreferrer"
                  target="_blank"
                >
                  TCGdex-API
                </a>
                . <Link href="/info" className="underline hover:text-mist-300">Quellen und Hinweise</Link>
              </p>
            </div>
          </footer>
        </SettingsProvider>
      </body>
    </html>
  );
}
