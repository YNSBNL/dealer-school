"use client";
import Link from "next/link";
import AppShell from "@/components/AppShell";
import { Card, SectionHeader, Button } from "@/components/ui";

export default function RegisterPage() {
  return (
    <AppShell badge="Inscription" showSecondaryNav={false} padded={false}>
      <div className="cp-auth-shell">
        <div className="cp-auth-layout">
          <div className="cp-auth-card-wrap">
            <Card tone="elevated">
              <SectionHeader
                eyebrow="Inscription"
                title="Acces sur invitation uniquement"
                description="Les inscriptions sont actuellement fermees. Si vous disposez d'un compte de formation, connectez-vous ci-dessous."
                style={{ marginBottom: 0 }}
              />
              <div style={{ marginTop: 24 }}>
                <Button href="/auth/login" block>Se connecter</Button>
              </div>
              <div className="cp-auth-note" style={{ marginTop: 16 }}>
                Besoin d&apos;un acces ? Contactez votre responsable de formation.
              </div>
            </Card>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
