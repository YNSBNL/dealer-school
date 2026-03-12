"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import AppShell from "@/components/AppShell";
import { createClient } from "@/lib/supabase-browser";
import { getLocalDevFallbackReason, isSupabaseConfigured } from "@/lib/config";
import { sanitizeAuthRedirect } from "@/lib/auth-utils";
import { Button, Card, ErrorState, Input, SectionHeader } from "@/components/ui";

function RegisterContent() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = sanitizeAuthRedirect(searchParams.get("redirect") || "/dashboard");
  const supabase = createClient();
  const configured = isSupabaseConfigured();
  const fallbackReason = getLocalDevFallbackReason();

  const handleRegister = async (event) => {
    event.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      if (!configured || !supabase) {
        throw new Error("Le service de creation de compte n'est pas disponible dans cet environnement.");
      }

      if (password.length < 6) {
        throw new Error("Le mot de passe doit contenir au moins 6 caracteres.");
      }

      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { display_name: displayName },
          emailRedirectTo: `${window.location.origin}/auth/callback?next=/dashboard`,
        },
      });

      if (signUpError) {
        throw signUpError;
      }

      if (data.session) {
        router.push(redirect);
        router.refresh();
        return;
      }

      setSuccess("Compte cree. Verifiez votre email pour confirmer l'inscription, puis connectez-vous.");
    } catch (registerError) {
      setError(registerError?.message || "L'inscription n'a pas pu etre finalisee.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppShell badge="Inscription" showSecondaryNav={false} padded={false}>
      <div className="cp-auth-shell">
        <div className="cp-auth-card-wrap">
          <Card tone="elevated">
            <SectionHeader
              eyebrow="Inscription"
              title="Creer un espace de formation personnel"
              description="Activez le suivi des sessions, la progression par jeu et l'acces aux outils de revision."
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
            {error ? <ErrorState description={error} style={{ marginTop: 16 }} /> : null}
            {success ? <ErrorState tone="info" title="Inscription enregistree" description={success} style={{ marginTop: 16 }} /> : null}

            <form onSubmit={handleRegister} style={{ marginTop: 22 }}>
              <Input label="Prenom ou nom d'usage" type="text" value={displayName} onChange={(event) => setDisplayName(event.target.value)} placeholder="Lucas" required={configured} />
              <Input label="Email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="vous@croupierpro.fr" required={configured} style={{ marginTop: 14 }} />
              <Input label="Mot de passe" type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="6 caracteres minimum" required={configured} style={{ marginTop: 14 }} />

              <Button type="submit" block style={{ marginTop: 20, opacity: loading ? 0.75 : 1 }} disabled={loading || !configured}>
                {loading ? "Creation du compte..." : configured ? "Creer mon espace" : "Configuration requise"}
              </Button>
            </form>

            <div className="cp-auth-note">
              Deja membre ?{" "}
              <Link href="/auth/login" className="cp-gold" style={{ fontWeight: 700, textDecoration: "none" }}>
                Se connecter
              </Link>
            </div>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<div className="cp-shell" />}>
      <RegisterContent />
    </Suspense>
  );
}
