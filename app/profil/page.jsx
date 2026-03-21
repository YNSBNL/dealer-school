"use client";
import { useEffect, useState } from "react";
import AppShell from "@/components/AppShell";
import { useAuth } from "@/lib/auth-context";
import { createClient } from "@/lib/supabase-browser";
import { useRouter } from "next/navigation";
import { Button, Card, ErrorState, Input, SectionHeader, StatCard } from "@/components/ui";

export default function ProfilPage() {
  const { user, profile, signOut, refreshProfile, isDemoMode, demoReason } = useAuth();
  const [displayName, setDisplayName] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => { setDisplayName(profile?.display_name || ""); }, [profile]);

  const handleSave = async () => {
    if (!user || !supabase || isDemoMode) { setMessage("Mode local actif."); return; }
    setSaving(true); setMessage("");
    const { error } = await supabase.from("profiles").update({ display_name: displayName }).eq("id", user.id);
    setSaving(false);
    if (error) { setMessage(error.message); return; }
    await refreshProfile();
    setMessage("Le profil a ete mis a jour.");
  };

  const handleSignOut = async () => { await signOut(); router.push("/"); router.refresh(); };
  const isSuccess = message === "Le profil a ete mis a jour.";

  return (
    <AppShell badge="Profil" density="comfortable">
      <Card tone="elevated" style={{ maxWidth: 980 }}>
        <SectionHeader eyebrow="Profil" title="Votre espace personnel" description="Gérez vos informations et consultez vos indicateurs de formation." style={{ marginBottom: 0 }} />
        {isDemoMode ? <ErrorState tone="info" title="Mode local actif" description={demoReason || "Non persiste."} style={{ marginTop: 16 }} /> : null}
        {message ? <ErrorState tone={isSuccess ? "info" : "error"} description={message} style={{ marginTop: 16 }} /> : null}
        <div className="cp-grid cp-grid-2" style={{ marginTop: 22 }}>
          <Input label="Nom affiche" value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="Votre nom" />
          <Input label="Email" value={profile?.email || user?.email || ""} disabled />
        </div>
        <div className="cp-grid cp-grid-3" style={{ marginTop: 18 }}>
          <StatCard value={profile?.level || 1} label="niveau" />
          <StatCard value={profile?.xp || 0} label="xp cumules" />
          <StatCard value={profile?.rank || "Bronze"} label="rang actuel" />
        </div>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginTop: 24 }}>
          <Button onClick={handleSave} disabled={saving}>{saving ? "Enregistrement..." : "Enregistrer"}</Button>
          <Button variant="ghost" onClick={handleSignOut}>Se deconnecter</Button>
          <Button href="/dashboard" variant="secondary">Retour au dashboard</Button>
        </div>
      </Card>
    </AppShell>
  );
}
