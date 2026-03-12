"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { AVAILABLE_GAMES } from "@/lib/game-registry";
import { useAuth } from "@/lib/auth-context";

const MEMBER_ITEMS = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/catalogue", label: "Catalogue" },
  { href: "/simulateur", label: "Simulateurs" },
  { href: "/certification", label: "Certification" },
  { href: "/tuteur", label: "Coach IA" },
  { href: "/profil", label: "Profil" },
];

const PUBLIC_ITEMS = [
  { href: "/", label: "Accueil" },
  { href: "/catalogue", label: "Catalogue" },
  { href: "/auth/login", label: "Connexion" },
  { href: "/auth/register", label: "Creer un compte" },
];

export default function SecondaryNav({ items = MEMBER_ITEMS, title = "Navigation produit" }) {
  const pathname = usePathname();
  const { user } = useAuth();
  const resolvedItems = items === MEMBER_ITEMS
    ? (
        user
          ? [...MEMBER_ITEMS, ...AVAILABLE_GAMES.slice(0, 4).map((game) => ({ href: game.route, label: game.shortName }))]
          : PUBLIC_ITEMS
      )
    : items;

  return (
    <div className="cp-secondary-nav-shell">
      <div className="cp-secondary-nav-label">{title}</div>
      <nav className="cp-secondary-nav" aria-label={title}>
        {resolvedItems.map((item) => {
          const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`cp-secondary-nav-link${active ? " cp-secondary-nav-link-active" : ""}`}
              aria-current={active ? "page" : undefined}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
