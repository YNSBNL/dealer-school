"use client";

import { memo, useMemo } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
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

function TopBar({ badge = null }) {
  const { user, profile, loading } = useAuth();
  const { resolvedTheme, theme, toggleTheme } = useTheme();
  const pathname = usePathname();
  const isDarkTheme = resolvedTheme === "dark";

  const initials = useMemo(
    () => (profile?.display_name?.[0] || user?.email?.[0] || "C").toUpperCase(),
    [profile?.display_name, user?.email]
  );

  const primaryNav = useMemo(
    () => (
      user
        ? [
            { href: "/dashboard", label: "Dashboard", active: pathname.startsWith("/dashboard") },
            { href: "/catalogue", label: "Catalogue", active: pathname.startsWith("/catalogue") },
            { href: "/simulateur", label: "Simulateurs", active: pathname === "/simulateur" || pathname.startsWith("/simulateur/") },
            { href: "/tuteur", label: "Coach IA", active: pathname.startsWith("/tuteur") },
            { href: "/certification", label: "Certification", active: pathname.startsWith("/certification") },
          ]
        : [
            { href: "/", label: "Accueil", active: pathname === "/" },
            { href: "/catalogue", label: "Catalogue", active: pathname.startsWith("/catalogue") },
            { href: "/auth/login", label: "Connexion", active: pathname.startsWith("/auth/login") },
            { href: "/auth/register", label: "Inscription", active: pathname.startsWith("/auth/register") },
          ]
    ),
    [pathname, user]
  );

  return (
    <header className="cp-navbar">
      <div className="cp-topbar-shell">
        <div className="cp-topbar-main">
          <div className="cp-topbar-brand">
            <Link href="/" className="cp-logo">
              Dealer<span>School</span>
            </Link>
            <div className="cp-topbar-product">
              <div className="cp-topbar-product-label">{user ? "Espace membre" : "Vitrine publique"}</div>
              <div className="cp-topbar-product-copy">
                {user
                  ? "Simulateurs, progression, revision et certification dans un meme espace."
                  : "Catalogue public, compte requis pour debloquer les simulateurs, le coach et le suivi."}
              </div>
            </div>
          </div>

          <div className="cp-topbar-actions">
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
            {!loading && user ? (
              <Link href="/profil" className="cp-topbar-profile">
                <div className="cp-topbar-avatar">{initials}</div>
                <div className="cp-topbar-profile-copy">
                  <div>{profile?.display_name || "Mon profil"}</div>
                  <span>{profile?.rank || "Membre"}</span>
                </div>
              </Link>
            ) : !loading ? (
              <div className="cp-topbar-cta-group">
                <Link href="/auth/login" className="cp-button-ghost">
                  Connexion
                </Link>
                <Link href="/auth/register" className="cp-button">
                  Creer un compte
                </Link>
              </div>
            ) : null}
          </div>
        </div>

        <nav className="cp-topbar-navrow cp-topbar-nav" aria-label="Navigation principale">
          {primaryNav.map((item) => (
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
      </div>
    </header>
  );
}

export default memo(TopBar);
