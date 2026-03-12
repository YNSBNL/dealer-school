import { useMemo, useState } from "react";
import AppShell from "@/components/AppShell";
import { useAuth } from "@/lib/auth-context";
import { CATALOGUE_GAMES, GAME_AVAILABILITY_LABELS, GAME_FAMILY_LABELS } from "@/lib/game-registry";
import { buildLoginHref, buildRegisterHref } from "@/lib/platform-access";
import { Badge, Button, Card, SectionHeader, Select, StatCard } from "@/components/ui";

const FAMILIES = [
  { id: "all", name: "Tous les jeux", note: "Vue d'ensemble des simulateurs disponibles" },
  { id: "classiques", name: GAME_FAMILY_LABELS.classiques, note: "Roulette, blackjack, baccarat" },
  { id: "poker-casino", name: GAME_FAMILY_LABELS["poker-casino"], note: "Jeux poker contre la maison" },
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
  const selectedFamilyMeta = FAMILIES.find((family) => family.id === selectedFamily) || FAMILIES[0];
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
                <Badge tone="pill">{user ? GAME_AVAILABILITY_LABELS[selectedGame.availability] : "Compte requis"}</Badge>
                <DifficultyDots level={selectedGame.difficulty} />
                <Badge tone="pill">{selectedGame.route}</Badge>
              </div>
            </div>

            <div className="cp-product-hero-aside">
              <div className="cp-kpi-row">
                <StatCard value={selectedGame.difficulty} label="difficulte / 5" />
                <StatCard value={selectedGame.shortName} label="module" accent />
              </div>
            </div>
          </div>
        </Card>

        <div className="cp-card-grid">
          <Card padded="md">
            <SectionHeader eyebrow="Positionnement" title={selectedGame.tagline} />
            <div className="cp-muted">{selectedGame.description}</div>
          </Card>

          <Card padded="md">
            <SectionHeader eyebrow="Acces" title={user ? "Route active" : "Debloquer ce module"} />
            <div className="cp-muted">
              {user
                ? selectedGame.route
                : "Le detail reste public. Le simulateur complet s'ouvre apres connexion ou creation de compte."}
            </div>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 16 }}>
              <Button href={user ? selectedGame.route : buildLoginHref(selectedGame.route)}>
                {user ? "Ouvrir le simulateur" : "Se connecter pour ouvrir"}
              </Button>
              {!user ? <Button href={buildRegisterHref(selectedGame.route)} variant="secondary">Creer un compte</Button> : null}
            </div>
          </Card>

          <Card padded="md">
            <SectionHeader eyebrow="Visibilite" title="Presence dans le site" />
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {selectedGame.visibleInLanding ? <Badge tone="pill">Landing</Badge> : null}
              {selectedGame.visibleInDashboard ? <Badge tone="pill">Dashboard</Badge> : null}
              {selectedGame.visibleInCatalogue ? <Badge tone="pill">Catalogue</Badge> : null}
              {selectedGame.visibleInCertification ? <Badge tone="pill">Certification</Badge> : null}
            </div>
          </Card>
        </div>
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
              title="Le catalogue est genere exclusivement depuis la registry centrale"
              description="Chaque fiche visible ici correspond a un jeu disponible, avec une route active et des points d'entree coherents dans le site."
              action={
                <Button href={user ? "/dashboard" : buildRegisterHref("/dashboard")} variant={user ? "secondary" : "primary"}>
                  {user ? "Ouvrir mon espace" : "Creer un compte"}
                </Button>
              }
            />

            <div className="cp-metric-strip">
              <StatCard value={CATALOGUE_GAMES.length} label="simulateurs disponibles" />
              <StatCard value={averageDifficulty} label="difficulte moyenne" accent />
              <StatCard value={FAMILIES.length - 1} label="familles visibles" />
            </div>
          </div>

          <div className="cp-product-hero-aside">
            <Card padded="md" tone="muted">
              <div className="cp-section-eyebrow">{user ? "Filtre actif" : "Compte requis"}</div>
              <div style={{ fontWeight: 800, fontSize: 22, marginTop: 10 }}>
                {user ? selectedFamilyMeta.name : "Debloquez les simulateurs"}
              </div>
              <div className="cp-muted" style={{ marginTop: 8 }}>
                {user
                  ? selectedFamilyMeta.note
                  : "Le catalogue reste public. Les simulateurs complets, le coach, la progression et la certification s'ouvrent depuis un compte membre."}
              </div>
              {!user ? (
                <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 16 }}>
                  <Button href={buildRegisterHref("/dashboard")}>Creer un compte</Button>
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
            eyebrow="Exploration"
            title="Parcourir les jeux"
            description="Choisissez une famille ou gardez une vue d'ensemble."
          />

          <Select
            label="Famille de jeux"
            value={selectedFamily}
            onChange={(event) => setSelectedFamily(event.target.value)}
            options={FAMILIES.map((family) => ({ value: family.id, label: family.name }))}
          />

          <div className="cp-filter-list">
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
            title={`${filteredGames.length} jeu(x) visible(s) dans cette vue`}
            description="Toutes les cartes proviennent de la registry centrale et pointent vers une route valide."
          />

          <div className="cp-module-grid">
            {filteredGames.map((game) => (
              <Card key={game.id} padded="md" className="cp-module-card" onClick={() => setSelectedGameId(game.id)} style={{ cursor: "pointer" }}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "start" }}>
                  <div className="cp-dashboard-game-icon" style={{ width: 48, height: 48, fontSize: 16 }}>{game.icon}</div>
                  <Badge tone="pill">{user ? GAME_AVAILABILITY_LABELS[game.availability] : "Compte requis"}</Badge>
                </div>

                <div>
                  <div style={{ fontWeight: 800, fontSize: 20 }}>{game.name}</div>
                  <div className="cp-muted" style={{ marginTop: 6 }}>{game.tagline}</div>
                </div>

                <div className="cp-muted">{game.description}</div>

                <div className="cp-module-meta">
                  <div>
                    <div className="cp-muted" style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.08em" }}>difficulte</div>
                    <div style={{ marginTop: 6 }}><DifficultyDots level={game.difficulty} /></div>
                  </div>
                  <div>
                    <div className="cp-muted" style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.08em" }}>route</div>
                    <div style={{ marginTop: 6, fontWeight: 700 }}>{game.route}</div>
                  </div>
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "center" }}>
                  <span className="cp-muted">{GAME_FAMILY_LABELS[game.family]}</span>
                  <span className="cp-gold" style={{ fontWeight: 700 }}>{user ? "Voir le detail" : "Voir le detail et debloquer"}</span>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
