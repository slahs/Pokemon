import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";
import { APP_CONFIG } from "@/config/app-config";
import { SettingsProvider } from "@/components/settings-context";
import { AppLogo } from "@/components/ui/logo";
import { NavLinks } from "@/components/ui/nav-links";

export const metadata: Metadata = {
  title: `${APP_CONFIG.name} – Virtueller Pokémon-Booster-Simulator`,
  description: APP_CONFIG.description,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="de">
      <body className="min-h-screen flex flex-col antialiased">
        <SettingsProvider>
          <header className="sticky top-0 z-40 border-b border-white/10 bg-[oklch(0.16_0.045_275/0.72)] backdrop-blur-[14px]">
            <div className="mx-auto flex max-w-[1120px] flex-wrap items-center gap-5 px-4 py-[15px] sm:px-7">
              <Link
                href="/"
                className="flex items-center gap-3 font-display text-xl font-extrabold tracking-[-0.02em]"
              >
                <AppLogo />
                {APP_CONFIG.name}
              </Link>
              <NavLinks />
            </div>
            <div className="foil-seam" aria-hidden="true" />
          </header>

          <main className="relative z-[1] flex-1">{children}</main>

          <footer className="relative z-[1] mt-16 border-t border-white/10">
            <div className="mx-auto max-w-[1120px] space-y-3 px-4 py-8 text-xs text-text-dim sm:px-7">
              <p>{APP_CONFIG.legalFooter}</p>
              <p>
                Kartendaten, Setlogos, Karten- und Boosterbilder über die dokumentierte{" "}
                <a
                  href="https://tcgdex.dev"
                  className="text-accent-cyan hover:text-foil-300"
                  rel="noopener noreferrer"
                  target="_blank"
                >
                  TCGdex-API
                </a>
                .{" "}
                <Link href="/info" className="text-accent-cyan hover:text-foil-300">
                  Quellen und Hinweise
                </Link>
              </p>
            </div>
          </footer>
        </SettingsProvider>
      </body>
    </html>
  );
}
