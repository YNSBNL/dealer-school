"use client";

import AppShell from "@/components/AppShell";
import { Badge, Button, Card, SectionHeader } from "@/components/ui";
import { AVAILABLE_GAMES } from "@/lib/game-registry";

const FAMILIES = [
  { id: "classiques", label: "Classiques casino" },
  { id: "poker-casino", label: "Poker casino" },
];

export default function SimulatorsIndexPage() {
  const grouped = FAMILIES.map((family) => ({
    ...family,
    games: AVAILABLE_GAMES.filter((g) => g.family === family.id),
  }));

  return (
    <AppShell density="comfortable">
      <SectionHeader
        eyebrow="Simulateurs"
        title="Choisir un module de formation"
        description="Sélectionnez un simulateur pour démarrer une session. Chaque module couvre la procédure complète du jeu : annonces, paiements et gestion de table."
      />

      {grouped.map((group) => (
        <div key={group.id} className="cp-game-group">
          <div className="cp-game-group-label">{group.label}</div>
          <div className="cp-game-module-grid">
            {group.games.map((game) => (
              <Card key={game.id} padded="lg" tone="elevated" className="cp-game-module-card">
                <div className="cp-game-module-head">
                  <div className="cp-game-abbrev">{game.icon}</div>
                  <Badge tone="pill" style={{ fontSize: 11 }}>Disponible</Badge>
                </div>
                <div className="cp-game-module-name">{game.name}</div>
                <div className="cp-game-module-desc cp-muted">{game.description}</div>
                <div className="cp-game-module-footer">
                  <Button href={game.route} block>Ouvrir le simulateur</Button>
                </div>
              </Card>
            ))}
          </div>
        </div>
      ))}
    </AppShell>
  );
}
