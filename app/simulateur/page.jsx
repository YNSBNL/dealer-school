"use client";

import AppShell from "@/components/AppShell";
import { Badge, Button, Card, SectionHeader, StatCard } from "@/components/ui";
import { AVAILABLE_GAMES } from "@/lib/game-registry";

export default function SimulatorsIndexPage() {
  return (
    <AppShell badge="Simulateurs" density="comfortable">
      <Card tone="elevated">
        <div className="cp-product-hero">
          <div className="cp-product-hero-main">
            <SectionHeader
              eyebrow="Acces direct"
              title="Tous les simulateurs réellement disponibles sont regroupés ici"
              description="Cette page sert de point d'entree unique pour la pratique. Elle reprend uniquement les jeux accessibles aujourd'hui dans le site."
            />
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <Badge tone="pill">{AVAILABLE_GAMES.length} simulateurs ouverts</Badge>
              <Badge tone="pill">Routes directes stables</Badge>
            </div>
          </div>
          <div className="cp-product-hero-aside">
            <div className="cp-kpi-row">
              <StatCard value={AVAILABLE_GAMES.filter((game) => game.family === "classiques").length} label="classiques" />
              <StatCard value={AVAILABLE_GAMES.filter((game) => game.family === "poker-casino").length} label="poker casino" accent />
            </div>
          </div>
        </div>
      </Card>

      <div className="cp-module-grid">
        {AVAILABLE_GAMES.map((game) => (
          <Card key={game.id} padded="md" className="cp-module-card">
            <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "start" }}>
              <div className="cp-dashboard-game-icon" style={{ width: 48, height: 48, fontSize: 16 }}>{game.icon}</div>
              <Badge tone="pill">Disponible</Badge>
            </div>
            <div style={{ fontWeight: 800, fontSize: 20 }}>{game.name}</div>
            <div className="cp-muted">{game.tagline}</div>
            <div className="cp-muted">{game.description}</div>
            <Button href={game.route} block>Ouvrir {game.shortName}</Button>
          </Card>
        ))}
      </div>
    </AppShell>
  );
}
