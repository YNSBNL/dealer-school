"use client";

import AppShell from "@/components/AppShell";
import { useAuth } from "@/lib/auth-context";
import { buildLoginHref, buildProtectedHref } from "@/lib/platform-access";
import { Badge, Button, Card, SectionHeader } from "@/components/ui";

// ── Vrais modules disponibles ────────────────────────────────────────────────
const GAME_FAMILIES = [
  {
    family: "Classiques casino",
    games: [
      {
        id: "roulette",
        abbrev: "RT",
        name: "Roulette Anglaise",
        desc: "Annonces, calcul des paiements et résolution complète d'un coup de roulette. Procédure pleine table.",
        route: "/simulateur/roulette",
      },
      {
        id: "blackjack",
        abbrev: "BJ",
        name: "Blackjack",
        desc: "Distribution, décisions joueurs (hit, stand, double, split), règles dealer et résolution des mains.",
        route: "/simulateur/blackjack",
      },
      {
        id: "punto-banco",
        abbrev: "PB",
        name: "Punto Banco",
        desc: "Naturels, règle de la troisième carte, rythme de table et résolution Banco / Punto.",
        route: "/simulateur/baccarat",
      },
    ],
  },
  {
    family: "Poker casino",
    games: [
      {
        id: "ultimate-texas",
        abbrev: "UTH",
        name: "Ultimate Texas Hold'em",
        desc: "Blind, ante, trips, fenêtres de mise et showdown. Le poker casino à procédure la plus complète.",
        route: "/simulateur/ultimate-texas",
      },
      {
        id: "three-card-poker",
        abbrev: "3CP",
        name: "Three Card Poker",
        desc: "Ante/play, pair plus et qualification du dealer. Procédure simple, résolution rigoureuse.",
        route: "/simulateur/three-card-poker",
      },
      {
        id: "caribbean-stud",
        abbrev: "CS",
        name: "Caribbean Stud",
        desc: "Qualification du dealer, raise et paiements selon paytable. Cinq cartes contre la maison.",
        route: "/simulateur/caribbean-stud",
      },
      {
        id: "texas-holdem",
        abbrev: "TH",
        name: "Texas Hold'em",
        desc: "Ante/call, flop communautaire, qualification dealer et paiements selon le paytable.",
        route: "/simulateur/casino-holdem",
      },
      {
        id: "let-it-ride",
        abbrev: "LIR",
        name: "Let It Ride",
        desc: "Trois mises initiales, retraits progressifs et paytable finale. Lecture de main et gestion des mises.",
        route: "/simulateur/let-it-ride",
      },
      {
        id: "pot-limit-omaha",
        abbrev: "PLO",
        name: "Pot Limit Omaha",
        desc: "Quatre cartes en main, mises limitées au pot, lecture de combinaisons et résolution showdown.",
        route: "/simulateur/plo-omaha",
      },
    ],
  },
];

// Liste à plat pour le hero preview
const ALL_GAMES = GAME_FAMILIES.flatMap((f) => f.games);

const levels = [
  { num: 1, label: "Bases", desc: "Règles et terminologie" },
  { num: 2, label: "Procédures", desc: "Annonces et gestion" },
  { num: 3, label: "Autonomie", desc: "Tables classiques" },
  { num: 4, label: "Maîtrise", desc: "Situations complexes" },
  { num: 5, label: "Expert", desc: "Tenue de table stable" },
];

const certTiers = [
  {
    key: "bronze",
    label: "Bronze",
    title: "Socle procédural",
    desc: "Règles maîtrisées, annonces correctes, gestion de table accompagnée.",
  },
  {
    key: "silver",
    label: "Silver",
    title: "Autonomie encadrée",
    desc: "Tenue autonome sur les jeux classiques, situations courantes gérées.",
  },
  {
    key: "gold",
    label: "Gold",
    title: "Niveau opérationnel",
    desc: "Tenue de table stable et mesurable. Niveau visé pour une prise de poste.",
    target: true,
  },
];

const memberFeatures = [
  "Accès complet aux 9 simulateurs de jeux",
  "Suivi de progression session par session",
  "Parcours de certification Bronze → Gold",
  "Coach IA pour réviser les procédures",
  "Statistiques détaillées par jeu et par niveau",
];

// ── Hero ──────────────────────────────────────────────────────────────────────
function HeroSection({ user }) {
  return (
    <div className="cp-hero-shell">
      <div className="cp-hero-inner">

        <div className="cp-hero-text">
          <Badge>
            <span className="cp-badge-dot" /> Plateforme de formation · Procédures de table
          </Badge>

          <h1 className="cp-hero-title">
            Former un dealer<br />
            <span className="cp-gold">prêt pour le terrain.</span>
          </h1>

          <p className="cp-hero-lead">
            Simulateurs de procédures réelles, suivi de progression et certification structurée.
            Un environnement d&apos;entraînement conçu pour les standards du métier.
          </p>

          <div className="cp-hero-cta">
            <Button href={user ? "/dashboard" : buildLoginHref("/dashboard")}>
              {user ? "Mon espace de formation" : "Créer un espace membre"}
            </Button>
            <Button href="#simulateurs" variant="ghost">
              Voir les simulateurs
            </Button>
          </div>
        </div>

        <div className="cp-hero-divider" />

        {/* Aperçu des 6 modules */}
        <div className="cp-hero-preview">
          {ALL_GAMES.map((game) => (
            <div key={game.id} className="cp-hero-preview-card">
              <div className="cp-hero-preview-icon">{game.abbrev}</div>
              <div className="cp-hero-preview-name">{game.name}</div>
              <div className="cp-hero-preview-tag">{user ? "Disponible" : "Accès membre"}</div>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function Home() {
  const { user } = useAuth();

  return (
    <AppShell
      density="comfortable"
      showSecondaryNav={false}
      heroContent={<HeroSection user={user} />}
    >

      {/* ── MODULES DE FORMATION ── */}
      <section id="simulateurs">
        <SectionHeader
          eyebrow="Les modules"
          title="9 simulateurs de procédures complètes"
          description="Chaque module reproduit la procédure réelle d'un jeu de casino : annonces, décisions, paiements et gestion de table. Les mêmes standards qu'en formation terrain."
        />

        {GAME_FAMILIES.map((group) => (
          <div key={group.family} className="cp-game-group">
            <div className="cp-game-group-label">{group.family}</div>
            <div className="cp-game-module-grid">
              {group.games.map((game) => (
                <Card key={game.id} padded="lg" tone="elevated" className="cp-game-module-card">
                  <div className="cp-game-module-head">
                    <div className="cp-game-abbrev">{game.abbrev}</div>
                    {!user && (
                      <span className="cp-game-lock-tag">Accès membre</span>
                    )}
                  </div>
                  <div className="cp-game-module-name">{game.name}</div>
                  <div className="cp-game-module-desc cp-muted">{game.desc}</div>
                  <div className="cp-game-module-footer">
                    <Button href={buildProtectedHref(Boolean(user), game.route)} block>
                      {user ? "Ouvrir le simulateur" : "Se connecter pour accéder"}
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        ))}
      </section>

      {/* ── PARCOURS ── */}
      <section>
        <SectionHeader
          eyebrow="Progression"
          title="Cinq niveaux, une trajectoire claire"
          description="Le parcours est structuré pour construire les compétences dans l'ordre. Chaque session alimente le suivi : volume, précision, régularité."
        />
        <Card padded="lg" tone="elevated">
          <div className="cp-level-track">
            {levels.map((level) => (
              <div key={level.num} className="cp-level-step">
                <div className="cp-level-node">{level.num}</div>
                <div className="cp-level-step-label">{level.label}</div>
                <div className="cp-level-step-desc">{level.desc}</div>
              </div>
            ))}
          </div>
          <div className="cp-level-track-note">
            L&apos;avancement est visible et mesurable. Chaque niveau débloque des situations plus complexes jusqu&apos;à une tenue de table autonome et stable.
          </div>
        </Card>
      </section>

      {/* ── CERTIFICATION ── */}
      <section>
        <SectionHeader
          eyebrow="Certification"
          title="Un référentiel de niveau lisible"
          description="Trois paliers progressifs. Une lecture claire du niveau atteint, vérifiable par un employeur ou un centre de formation."
        />
        <div className="cp-cert-tier-grid">
          {certTiers.map((tier) => (
            <Card key={tier.key} padded="lg" tone={tier.target ? "elevated" : "default"}>
              <div className={`cp-cert-tier-label cp-cert-${tier.key}`}>{tier.label}</div>
              <div style={{ marginTop: 14, fontWeight: 600, fontSize: 14, lineHeight: 1.3 }}>{tier.title}</div>
              <div className="cp-muted" style={{ marginTop: 10, fontSize: 13, lineHeight: 1.7 }}>{tier.desc}</div>
              {tier.target && (
                <Badge tone="pill" style={{ marginTop: 18, width: "fit-content" }}>Niveau cible</Badge>
              )}
            </Card>
          ))}
        </div>
        <div style={{ marginTop: 24 }}>
          <Button href={user ? "/certification" : buildLoginHref("/certification")}>
            {user ? "Voir mon parcours de certification" : "Commencer le parcours"}
          </Button>
        </div>
      </section>

      {/* ── ACCES MEMBRE ── */}
      <Card tone="elevated" padded="lg">
        <div className="cp-access-block">
          <div className="cp-access-block-text">
            <div className="cp-section-eyebrow">Accès membre</div>
            <h2 className="cp-section-title">Tout l&apos;environnement de formation dans un seul espace</h2>
            <p className="cp-subtitle" style={{ marginTop: 12 }}>
              Les simulateurs, le suivi de progression et la certification sont accessibles après inscription.
              Gratuit, sans engagement.
            </p>
            <div style={{ marginTop: 28 }}>
              <Button href={user ? "/dashboard" : buildLoginHref("/dashboard")}>
                {user ? "Accéder à mon espace" : "Créer un compte gratuitement"}
              </Button>
            </div>
          </div>
          <ul className="cp-access-feature-list">
            {memberFeatures.map((f) => (
              <li key={f}>{f}</li>
            ))}
          </ul>
        </div>
      </Card>

    </AppShell>
  );
}
