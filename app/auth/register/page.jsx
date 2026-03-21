"use client";
import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import AppShell from "@/components/AppShell";
import { createClient } from "@/lib/supabase-browser";
import { isSupabaseConfigured, getLocalDevFallbackReason } from "@/lib/config";
import { buildEmailRedirectUrl, getSupabaseAuthErrorMessage, sanitizeAuthRedirect } from "@/lib/auth-utils";
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
    setError(""); setSuccess(""); setLoading(true);
    try {
      if (!configured || !supabase) throw new Error("Le service de creation de compte n est pas disponible.");
      if (password.length < 6) throw new Error("Le mot de passe doit contenir au moins 6 caracteres.");
      const emailRedirectTo = buildEmailRedirectUrl(redirect, window.location.origin);
      if (!emailRedirectTo) throw new Error("L URL publique de l application est invalide. Definissez NEXT_PUBLIC_SITE_URL.");
      const { data, error: signUpError } = await supabase.auth.signUp({ email, password, options: { data: { display_name: displayName.trim() }, emailRedirectTo } });
      if (signUpError) throw signUpError;
      if (data.session) { router.push(redirect); router.refresh(); return; }
      setSuccess("Compte cree. Verifiez votre email pour confirmer l inscription.");
    } catch (registerError) { setError(getSupabaseAuthErrorMessage(registerError, "register")); }
    finally { setLoading(false); }
  };

  return (
    <AppShell badge="Inscription" showSecondaryNav={false} padded={false}>
      <div className="cp-auth-shell">
        <div className="cp-auth-layout">
          <div className="cp-auth-card-wrap">
            <Card tone="elevated">
              <SectionHeader eyebrow="Inscription" title="Créer votre espace de formation" description="Accédez aux simulateurs, au suivi de progression et au parcours de certification. Gratuit, sans engagement." style={{ marginBottom: 0 }} />
              {!configured ? <ErrorState tone="info" title="Authentification indisponible" description={fallbackReason || "Supabase non configure."} style={{ marginTop: 16 }} /> : null}
              {error ? <ErrorState description={error} style={{ marginTop: 16 }} /> : null}
              {success ? <ErrorState tone="info" title="Inscription enregistree" description={success} style={{ marginTop: 16 }} /> : null}
              <form onSubmit={handleRegister} style={{ marginTop: 22 }}>
                <Input label="Prenom ou nom d usage" type="text" value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="Lucas" required={configured} />
                <Input label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="vous@dealer-school.com" required={configured} style={{ marginTop: 14 }} />
                <Input label="Mot de passe" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="6 caracteres minimum" required={configured} style={{ marginTop: 14 }} />
                <Button type="submit" block style={{ marginTop: 20, opacity: loading ? 0.75 : 1 }} disabled={loading || !configured}>{loading ? "Creation..." : configured ? "Creer mon espace" : "Configuration requise"}</Button>
              </form>
              <div className="cp-auth-note">Deja membre ? <Link href="/auth/login" className="cp-gold" style={{ fontWeight: 700, textDecoration: "none" }}>Se connecter</Link></div>
            </Card>
          </div>
        </div>
      </div>
    </AppShell>
  );
}

export default function RegisterPage() { return <Suspense fallback={<div className="cp-shell" />}><RegisterContent /></Suspense>; }
