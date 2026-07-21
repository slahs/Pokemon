"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  { href: "/", label: "Booster öffnen", exact: true },
  { href: "/#sets", label: "Sets", exact: false },
  { href: "/session", label: "Session", exact: true },
  { href: "/settings", label: "Einstellungen", exact: true },
  { href: "/info", label: "Information", exact: true },
];

export function NavLinks() {
  const pathname = usePathname();
  return (
    <nav
      aria-label="Hauptnavigation"
      className="ml-auto flex flex-wrap gap-1.5 text-sm font-semibold"
    >
      {NAV_ITEMS.map((item) => {
        const active = item.href === "/" ? pathname === "/" : item.exact && pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={
              active
                ? "accent-button px-4 py-2"
                : "pill px-4 py-2 text-text-muted transition-colors hover:bg-white/9 hover:text-text"
            }
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
