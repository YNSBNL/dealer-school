import { useMemo, useState } from "react";
import AppShell from "@/components/AppShell";
import { useAuth } from "@/lib/auth-context";
import { CATALOGUE_GAMES, GAME_FAMILY_LABELS } from "@/lib/game-registry";
import { buildLoginHref } from "@/lib/platform-access";
import { Badge, Button, Card, SectionHeader, StatCard } from "@/components/ui";

const FAMILIES = [
  { id: "all", name: "Tous les simulateurs" },
  { id: "classiques", name: "Classiques casino" },
  { id: "poker-casino", name: "Poker casino" },
];

function DifficultyDots({ level }) {
  return (
    <div style={{ display: "flex", gap: 4 }}>
      {Array.from({ length: 5 }, (_, index) => (
        <span
          key={index}
          style={{
            width: 7,
            height: 7,
            borderRadius: "50%",
            background: index < level ? "#C9A84C" : "var(--line)",
            display: "block",
          }}
        />
      ))}
    </div>
  );
}

export default function GameCatalogue() {
  const { user } = useAuth();
  const [selectedFamily, setSelectedFamily] = useState("all");
  const [selectedGameId, setSelectedGameId] = useState(null);

  const filteredGames = useMemo(
    () => (selectedFamily === "all" ? CATALOGUE_GAMES : CATALOGUE_GAMES.filter((game) => game.family === selectedFamily)),
    [selectedFamily]
  );

  const selectedGame = CATALOGUE_GAMES.find((game) => game.id === selectedGameId) || null;
  const averageDifficulty = filteredGames.length
    ? (filteredGames.reduce((sum, game) => sum + game.difficulty, 0) / filteredGames.length).toFixed(1)
    : "0";

  if (selectedGame) {
    return (
      <AppShell badge="Catalogue" density="comfortable">
        <Card tone="elevated">
          <div className="cp-product-hero">
            <div className="cp-product-hero-main">
              <SectionHeader
                eyebrow={GAME_FAMILY_LABELS[selectedGame.family]}
                title={selectedGame.name}
                description={selectedGame.description}
                action={<Button variant="ghost" onClick={() => setSelectedGameId(null)}>Retour au catalogue</Button>}
              />
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
                <Badge tone="pill">{user ? "Disponible" : "Compte requis"}</Badge>
                <DifficultyDots level={selectedGame.difficulty} />
                <span className="cp-muted" style={{ fontSize: 12 }}>{selectedGame.tagline}</span>
              </div>
            </div>

            <div className="cp-product-hero-aside">
              <Card padded="md" tone="muted">
                <div className="cp-section-eyebrow">{user ? "Accès direct" : "Accès membre requis"}</div>
                <div style={{ fontWeight: 700, fontSize: 16, marginTop: 10, lineHeight: 1.4 }}>
                  {user
                    ? "Ce simulateur est disponible dans votre espace."
                    : "Le détail du jeu est public. Le simulateur complet s'ouvre après connexion."}
                </div>
                <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 16 }}>
                  <Button href={user ? selectedGame.route : buildLoginHref(selectedGame.route)}>
                    {user ? "Ouvrir le simulateur" : "Se connecter pour ouvrir"}
                  </Button>
                  {!user ? <Button href={buildLoginHref(selectedGame.route)} variant="secondary">Se connecter</Button> : null}
                </div>
              </Card>
            </div>
          </div>
        </Card>
      </AppShell>
    );
  }

  return (
    <AppShell badge="Catalogue" density="comfortable">
      <Card tone="elevated">
        <div className="cp-product-hero">
          <div className="cp-product-hero-main">
            <SectionHeader
              eyebrow="Catalogue de formation"
              title="Tous les simulateurs disponibles"
              description="Six modules de formation procédurale. Chaque simulateur couvre la procédure complète d'un jeu de casino : annonces, paiements et gestion de table."
              action={
                <Button href={user ? "/dashboard" : buildLoginHref("/dashboard")} variant={user ? "secondary" : "primary"}>
                  {user ? "Mon espace" : "Se connecter"}
                </Button>
              }
            />

            <div className="cp-metric-strip">
              <StatCard value={CATALOGUE_GAMES.length} label="simulateurs" />
              <StatCard value={averageDifficulty} label="difficulté moyenne" accent />
              <StatCard value={FAMILIES.length - 1} label="familles" />
            </div>
          </div>

          <div className="cp-product-hero-aside">
            <Card padded="md" tone="muted">
              <div className="cp-section-eyebrow">{user ? "Accès complet" : "Compte requis"}</div>
              <div style={{ fontWeight: 700, fontSize: 17, marginTop: 10, lineHeight: 1.4 }}>
                {user
                  ? "Tous les simulateurs sont ouverts dans votre espace."
                  : "Créez un compte pour accéder aux simulateurs, au suivi de progression et à la certification."}
              </div>
              {!user ? (
                <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 16 }}>
                  <Button href={buildLoginHref("/dashboard")}>Se connecter</Button>
                  <Button href={buildLoginHref("/dashboard")} variant="ghost">Connexion</Button>
                </div>
              ) : null}
            </Card>
          </div>
        </div>
      </Card>

      <div className="cp-catalog-layout">
        <Card padded="md" className="cp-filter-panel">
          <SectionHeader
            eyebrow="Filtrer"
            title="Par famille de jeux"
            style={{ marginBottom: 0 }}
          />
          <div className="cp-filter-list" style={{ marginTop: 16 }}>
            {FAMILIES.map((family) => (
              <Button
                key={family.id}
                variant={selectedFamily === family.id ? "secondary" : "ghost"}
                className="cp-filter-chip"
                onClick={() => setSelectedFamily(family.id)}
              >
                {family.name}
              </Button>
            ))}
          </div>
        </Card>

        <div className="cp-card-stack">
          <SectionHeader
            eyebrow="Modules"
            title={`${filteredGames.length} simulateur${filteredGames.length > 1 ? "s" : ""} disponible${filteredGames.length > 1 ? "s" : ""}`}
          />

          <div className="cp-module-grid">
            {filteredGames.map((game) => (
              <Card key={game.id} padded="md" className="cp-module-card" onClick={() => setSelectedGameId(game.id)} style={{ cursor: "pointer" }}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "start" }}>
                  <div className="cp-game-abbrev">{game.icon}</div>
                  <Badge tone="pill">{user ? "Disponible" : "Compte requis"}</Badge>
                </div>

                <div style={{ marginTop: 16 }}>
                  <div style={{ fontWeight: 700, fontSize: 16, lineHeight: 1.3 }}>{game.name}</div>
                  <div className="cp-muted" style={{ marginTop: 6, fontSize: 13, lineHeight: 1.6 }}>{game.description}</div>
                </div>

                <div className="cp-module-meta">
                  <div>
                    <div className="cp-muted" style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.08em" }}>Difficulté</div>
                    <div style={{ marginTop: 6 }}><DifficultyDots level={game.difficulty} /></div>
                  </div>
                  <div>
                    <div className="cp-muted" style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.08em" }}>Famille</div>
                    <div style={{ marginTop: 6, fontWeight: 600, fontSize: 13 }}>{GAME_FAMILY_LABELS[game.family]}</div>
                  </div>
                </div>

                <div style={{ marginTop: 16, textAlign: "right" }}>
                  <span className="cp-gold" style={{ fontWeight: 700, fontSize: 13 }}>Voir le détail →</span>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
