"use client";
import AppShell from "@/components/AppShell";
import { Card, SectionHeader } from "@/components/ui";

export default function TuteurPage() {
  return (
    <AppShell badge="Coach IA" containerStyle={{ paddingTop: 24, paddingBottom: 40 }} density="comfortable">
      <Card tone="elevated" style={{ minHeight: "calc(100vh - 200px)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", padding: "3rem" }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>🔒</div>
        <SectionHeader
          eyebrow="Bientot disponible"
          title="Coach IA en construction"
          description="Le coach IA personnalise sera disponible prochainement. Il vous aidera a reviser les regles, procedures et paiements de chaque jeu."
          style={{ marginBottom: 0, maxWidth: 480 }}
        />
        <div style={{ marginTop: 24, padding: "0.75rem 1.5rem", background: "rgba(201,168,76,0.1)", border: "1px solid rgba(201,168,76,0.2)", borderRadius: 8, color: "rgba(201,168,76,0.9)", fontSize: "0.875rem", fontWeight: 500 }}>
          En cours de developpement
        </div>
      </Card>
    </AppShell>
  );
}
