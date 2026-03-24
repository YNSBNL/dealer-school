"use client";
import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import AppShell from "@/components/AppShell";
import { createClient } from "@/lib/supabase-browser";
import { isSupabaseConfigured, getLocalDevFallbackReason } from "@/lib/config";
import { getAuthErrorMessage, getSupabaseAuthErrorMessage, sanitizeAuthRedirect } from "@/lib/auth-utils";
import { Button, Card, ErrorState, Input, SectionHeader } from "@/components/ui";

function LoginContent() {
  const [identifier, setIdentifier] = useState("");
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

  const resolveEmail = async (input) => {
    const trimmed = input.trim().toLowerCase();
    // If it looks like an email, use it directly
    if (trimmed.includes("@")) return trimmed;
    // Otherwise, lookup username -> email
    try {
      const res = await fetch("/api/auth/lookup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: trimmed }),
      });
      const data = await res.json();
      if (data.email) return data.email;
    } catch {}
    return null;
  };

  const handleLogin = async (event) => {
    event.preventDefault();
    setError("");
    setLoading(true);
    try {
      if (!configured || !supabase) throw new Error("Le service de connexion n est pas disponible.");
      const email = await resolveEmail(identifier);
      if (!email) throw new Error("Nom d'utilisateur introuvable.");
      const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
      if (signInError) throw signInError;
      router.push(redirect);
      router.refresh();
    } catch (loginError) {
      setError(getSupabaseAuthErrorMessage(loginError, "login"));
    } finally { setLoading(false); }
  };

  return (
    <AppShell badge="Connexion" showSecondaryNav={false} padded={false}>
      <div className="cp-auth-shell">
        <div className="cp-auth-layout">
          <div className="cp-auth-card-wrap">
            <Card tone="elevated">
              <SectionHeader eyebrow="Connexion" title="Accéder à votre espace de formation" description="Retrouvez vos simulateurs, votre progression et votre parcours de certification." style={{ marginBottom: 0 }} />
              {!configured ? <ErrorState tone="info" title="Authentification indisponible" description={fallbackReason || "Supabase non configure."} style={{ marginTop: 16 }} /> : null}
              {authError ? <ErrorState tone="info" title="Connexion a relancer" description={getAuthErrorMessage(authError)} style={{ marginTop: 16 }} /> : null}
              {error ? <ErrorState description={error} style={{ marginTop: 16 }} /> : null}
              <form onSubmit={handleLogin} style={{ marginTop: 22 }}>
                <Input label="Identifiant" type="text" value={identifier} onChange={(e) => setIdentifier(e.target.value)} placeholder="admin, dealer01 ou email" required={configured} />
                <Input label="Mot de passe" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Votre mot de passe" required={configured} style={{ marginTop: 14 }} />
                <Button type="submit" block style={{ marginTop: 20, opacity: loading ? 0.75 : 1 }} disabled={loading || !configured}>{loading ? "Connexion..." : configured ? "Se connecter" : "Configuration requise"}</Button>
              </form>
              <div className="cp-auth-note">Acces reserve aux comptes de formation.</div>
            </Card>
          </div>
        </div>
      </div>
    </AppShell>
  );
}

export default function LoginPage() { return <Suspense fallback={<div className="cp-shell" />}><LoginContent /></Suspense>; }
