"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import AppShell from "@/components/AppShell";
import { createClient } from "@/lib/supabase-browser";
import { getLocalDevFallbackReason, isSupabaseConfigured } from "@/lib/config";
import { getAuthErrorMessage, sanitizeAuthRedirect } from "@/lib/auth-utils";
import { Button, Card, ErrorState, Input, SectionHeader } from "@/components/ui";

function LoginContent() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = sanitizeAuthRedirect(searchParams.get("redirect") || "/dashboard");
  const authError = searchParams.get("error");
  const supabase = createClient();
  const configured = isSupabaseConfigured();
  const fallbackReason = getLocalDevFallbackReason();

  const handleLogin = async (event) => {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (!configured || !supabase) {
        throw new Error("Le service de connexion n'est pas disponible dans cet environnement.");
      }

      const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });

      if (signInError) {
        throw new Error(signInError.message === "Invalid login credentials" ? "Adresse email ou mot de passe incorrect." : signInError.message);
      }

      router.push(redirect);
      router.refresh();
    } catch (loginError) {
      setError(loginError?.message || "La connexion n'a pas pu etre finalisee.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppShell badge="Connexion" showSecondaryNav={false} padded={false}>
      <div className="cp-auth-shell">
        <div className="cp-auth-card-wrap">
          <Card tone="elevated">
            <SectionHeader
              eyebrow="Connexion"
              title="Retrouver son espace de formation"
              description="Accedez au suivi de progression, au coach et a l'historique des sessions depuis un seul espace."
              style={{ marginBottom: 0 }}
            />

            {!configured ? (
              <ErrorState
                tone="info"
                title="Authentification indisponible"
                description={fallbackReason || "Supabase n'est pas configure. Les pages membres restent verrouillees tant que l'authentification n'est pas disponible."}
                style={{ marginTop: 16 }}
              />
            ) : null}
            {authError ? <ErrorState tone="info" title="Connexion a relancer" description={getAuthErrorMessage(authError)} style={{ marginTop: 16 }} /> : null}
            {error ? <ErrorState description={error} style={{ marginTop: 16 }} /> : null}

            <form onSubmit={handleLogin} style={{ marginTop: 22 }}>
              <Input label="Email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="vous@croupierpro.fr" required={configured} />
              <Input label="Mot de passe" type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Votre mot de passe" required={configured} style={{ marginTop: 14 }} />
              <Button type="submit" block style={{ marginTop: 20, opacity: loading ? 0.75 : 1 }} disabled={loading || !configured}>
                {loading ? "Connexion en cours..." : configured ? "Se connecter" : "Configuration requise"}
              </Button>
            </form>

            <div className="cp-auth-note">
              Pas encore de compte ?{" "}
              <Link href="/auth/register" className="cp-gold" style={{ fontWeight: 700, textDecoration: "none" }}>
                Creer un espace membre
              </Link>
            </div>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="cp-shell" />}>
      <LoginContent />
    </Suspense>
  );
}
