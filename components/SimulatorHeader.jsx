"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { AVAILABLE_GAMES } from "@/lib/game-registry";
import { useTheme } from "@/lib/theme-context";

function ThemeIcon({ theme, isDarkTheme }) {
  if (theme === "system") {
    return (
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
        <circle cx="9" cy="9" r="6" stroke="currentColor" strokeWidth="1.5" opacity="0.45" />
        <path d="M9 3a6 6 0 1 1 0 12V3Z" fill="currentColor" />
      </svg>
    );
  }

  if (isDarkTheme) {
    return (
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
        <circle cx="9" cy="9" r="3.5" stroke="currentColor" strokeWidth="1.5" />
        <path
          d="M9 1.75v2.1M9 14.15v2.1M16.25 9h-2.1M3.85 9h-2.1M13.95 4.05l-1.48 1.48M5.53 12.47l-1.48 1.48M13.95 13.95l-1.48-1.48M5.53 5.53L4.05 4.05"
          stroke="currentColor"
          strokeWidth="1.35"
          strokeLinecap="round"
        />
      </svg>
    );
  }

  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <path d="M11.76 2.05a6.4 6.4 0 1 0 4.19 11.67A7 7 0 1 1 11.76 2.05Z" fill="currentColor" />
    </svg>
  );
}

export default function SimulatorHeader({ title, badge, stats = null, onBackToMenu = null }) {
  const pathname = usePathname();
  const { resolvedTheme, theme, toggleTheme } = useTheme();
  const isDarkTheme = resolvedTheme === "dark";

  const links = [
    { href: "/", label: "Accueil", active: pathname === "/" },
    { href: "/catalogue", label: "Catalogue", active: pathname.startsWith("/catalogue") },
    { href: "/dashboard", label: "Dashboard", active: pathname.startsWith("/dashboard") },
    { href: "/simulateur", label: "Tous les simulateurs", active: pathname === "/simulateur" },
    ...AVAILABLE_GAMES.map((game) => ({
      href: game.route,
      label: game.shortName,
      active: pathname === game.route,
    })),
  ];

  return (
    <header className="cp-navbar cp-navbar-sim">
      <div className="cp-topbar-shell cp-topbar-shell-sim">
        <div className="cp-topbar-main">
          <div className="cp-topbar-brand">
            <Link href="/" className="cp-logo">
              Dealer<span>School</span>
            </Link>
            <div className="cp-topbar-product">
              <div className="cp-topbar-product-label">Mode simulateur</div>
              <div className="cp-topbar-product-copy">
                {title} - environnement d entrainement integre au parcours Dealer School
              </div>
            </div>
          </div>

          <div className="cp-topbar-actions">
            <div className="cp-badge">{badge || title}</div>
            {stats ? <div className="cp-topbar-status-chip">{stats}</div> : null}
            <button
              type="button"
              className="cp-button-ghost cp-theme-toggle"
              aria-label={isDarkTheme ? "Activer le theme clair" : "Activer le theme sombre"}
              title={theme === "system" ? "Theme systeme actif" : `Theme ${resolvedTheme}`}
              onClick={toggleTheme}
              aria-pressed={isDarkTheme}
            >
              <span aria-hidden="true" style={{ display: "inline-flex", alignItems: "center" }}>
                <ThemeIcon theme={theme} isDarkTheme={isDarkTheme} />
              </span>
            </button>
            {onBackToMenu ? (
              <button type="button" className="cp-button-secondary" onClick={onBackToMenu}>
                Menu du jeu
              </button>
            ) : null}
          </div>
        </div>

        <div className="cp-topbar-navrow">
          <nav className="cp-topbar-nav" aria-label="Navigation simulateur">
            {links.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`cp-topbar-link${item.active ? " cp-topbar-link-active" : ""}`}
                aria-current={item.active ? "page" : undefined}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="cp-topbar-status">
            Retour immediat vers le site, le catalogue et l espace de progression.
          </div>
        </div>
      </div>
    </header>
  );
}
