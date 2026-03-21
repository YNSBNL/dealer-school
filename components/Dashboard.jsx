"use client";

import { useEffect, useMemo, useState } from "react";
import AppShell from "@/components/AppShell";
import { useAuth } from "@/lib/auth-context";
import { fetchProgress, fetchSessions, fetchSkills } from "@/lib/api";
import { MODE_LABELS } from "@/lib/constants";
import { buildDashboardGames, buildSkillCards, normalizeSessionRecords } from "@/lib/member-analytics";
import {
  Badge,
  Button,
  Card,
  EmptyState,
  ErrorState,
  LoadingState,
  ProgressCard,
  SectionHeader,
  StatCard,
} from "@/components/ui";

function niceDate(dateString) {
  if (!dateString) return "-";
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return "-";

  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function sessionMood(score) {
  if (score >= 85) return { label: "Solide", className: "cp-status-success" };
  if (score >= 70) return { label: "Correct", className: "cp-status-warning" };
  return { label: "A reprendre", className: "cp-status-danger" };
}

function progressionTone(progress) {
  if (progress >= 85) return { label: "Pret pour validation", color: "var(--green)" };
  if (progress >= 50) return { label: "En consolidation", color: "var(--gold)" };
  return { label: "Debut de parcours", color: "var(--muted)" };
}

export default function Dashboard() {
  const { profile, loading: authLoading, error: authError, isDemoMode, demoReason } = useAuth();
  const [progress, setProgress] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [skills, setSkills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let active = true;

    const loadData = async () => {
      if (authLoading && !isDemoMode) return;

      setLoading(true);
      const [progressRes, sessionsRes, skillsRes] = await Promise.all([
        fetchProgress(),
        fetchSessions(12),
        fetchSkills(),
      ]);

      if (!active) return;

      if (!progressRes.ok || !sessionsRes.ok || !skillsRes.ok) {
        setError(
          progressRes.error ||
            sessionsRes.error ||
            skillsRes.error ||
            "Impossible de charger les donnees du dashboard."
        );
      } else {
        setProgress(progressRes.data || []);
        setSessions(normalizeSessionRecords(sessionsRes.data || []));
        setSkills(skillsRes.data || []);
        setError(null);
      }

      setLoading(false);
    };

    loadData();
    return () => {
      active = false;
    };
  }, [authLoading, isDemoMode]);

  const mergedGames = useMemo(() => buildDashboardGames(progress), [progress]);
  const skillCards = useMemo(
    () => buildSkillCards({ skillRecords: skills, progressRecords: progress, sessionRecords: sessions }),
    [skills, progress, sessions]
  );

  const totalSessions = sessions.length || mergedGames.reduce((sum, game) => sum + (game.sessions_count || 0), 0);
  const gamesWithAccuracy = mergedGames.filter((game) => game.accuracy > 0);
  const avgAccuracy = gamesWithAccuracy.length
    ? Math.round(gamesWithAccuracy.reduce((sum, game) => sum + (game.accuracy || 0), 0) / gamesWithAccuracy.length)
    : 0;
  const certifiedGames = mergedGames.filter((game) => game.certified).length;
  const activeGames = mergedGames.filter((game) => (game.sessions_count || 0) > 0).length;
  const bestGame = [...mergedGames]
    .filter((game) => (game.accuracy || 0) > 0 || (game.sessions_count || 0) > 0)
    .sort((a, b) => (b.accuracy || 0) - (a.accuracy || 0))[0] || null;
  const latestSession = sessions[0] || null;
  const xp = profile?.xp || 0;
  const level = profile?.level || 1;
  const rank = profile?.rank || "Bronze";
  const currentLevelBase = Math.floor(xp / 500) * 500;
  const nextLevelXp = currentLevelBase + 500;
  const progressPct = Math.min(100, Math.round(((xp - currentLevelBase) / 500) * 100));
  const recommendation = bestGame?.route || "/simulateur";
  const recommendationLabel = bestGame?.shortName
    ? `Continuer ${bestGame.shortName}`
    : "Ouvrir les simulateurs";
  const hasMemberData = totalSessions > 0 || activeGames > 0 || avgAccuracy > 0;

  return (
    <AppShell badge="Dashboard" containerStyle={{ paddingTop: 36, paddingBottom: 72 }} density="comfortable">
      <Card className="cp-dashboard-hero" style={{ overflow: "hidden" }}>
        <div className="cp-product-hero">
          <div className="cp-product-hero-main">
            <div className="cp-section-eyebrow">Tableau de bord</div>
            <h1 className="cp-section-title" style={{ fontSize: "clamp(2.2rem, 4vw, 3.6rem)" }}>
              {profile?.display_name
                ? `Bonjour, ${profile.display_name}.`
                : "Votre espace de formation."}
            </h1>
            <p className="cp-subtitle" style={{ maxWidth: 640 }}>
              Progression par jeu, sessions enregistrées et indicateurs de préparation
              regroupés pour orienter la suite du travail.
            </p>

            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <Badge tone="pill">{totalSessions} sessions</Badge>
              <Badge tone="pill">{activeGames} jeux travaillés</Badge>
              <Badge tone="pill">{avgAccuracy}% précision moyenne</Badge>
              {certifiedGames > 0 && <Badge tone="pill">{certifiedGames} validation(s)</Badge>}
              {isDemoMode ? <Badge tone="pill">Mode démo</Badge> : null}
            </div>

            <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
              <Button href={recommendation}>{recommendationLabel}</Button>
              <Button href="/tuteur" variant="secondary">Coach IA</Button>
              <Button href="/catalogue" variant="ghost">Catalogue</Button>
            </div>

            {isDemoMode ? (
              <ErrorState
                tone="info"
                title="Mode démo actif"
                description={demoReason || "Le dashboard fonctionne en mode local tant que Supabase n'est pas configuré."}
              />
            ) : null}
            {authError ? <ErrorState description={authError} /> : null}
            {error ? <ErrorState description={error} /> : null}
          </div>

          <div className="cp-product-hero-aside">
            <Card padded="md" className="cp-dashboard-profile-card">
              <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "start" }}>
                <div>
                  <div className="cp-muted" style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.12em" }}>
                    Niveau actuel
                  </div>
                  <div style={{ fontSize: "clamp(1.8rem, 3.5vw, 2.6rem)", fontWeight: 800, marginTop: 6 }}>{rank}</div>
                </div>
                <Badge>Niveau {level}</Badge>
              </div>

              <div style={{ marginTop: 20 }}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 12, fontSize: 12, marginBottom: 8 }}>
                  <span className="cp-muted">{xp} XP</span>
                  <span className="cp-muted">Prochain palier : {nextLevelXp} XP</span>
                </div>
                <div className="cp-progress">
                  <span style={{ width: `${progressPct}%` }} />
                </div>
              </div>

              <div className="cp-card-stack" style={{ marginTop: 20 }}>
                <div className="cp-dashboard-mini-stat">
                  <strong>{bestGame?.shortName || "Aucune table dominante"}</strong>
                  <span>Jeu le plus travaillé</span>
                </div>
                <div className="cp-dashboard-mini-stat">
                  <strong>{latestSession ? niceDate(latestSession.created_at) : "—"}</strong>
                  <span>Dernière session</span>
                </div>
              </div>
            </Card>

            <div className="cp-kpi-row">
              <StatCard value={totalSessions} label="sessions" />
              <StatCard value={`${avgAccuracy}%`} label="précision" accent />
              <StatCard value={activeGames} label="jeux actifs" />
            </div>
          </div>
        </div>
      </Card>

      <section className="cp-dashboard-main">
        <Card>
          <SectionHeader
            eyebrow="Progression par jeu"
            title="Avancement par simulateur"
            description="Volume de pratique, précision et état de validation pour chaque jeu travaillé. Priorisez les modules en consolidation."
            action={<Button href="/catalogue" variant="ghost">Catalogue</Button>}
          />

          {loading && !hasMemberData ? (
            <LoadingState title="Chargement de la progression..." />
          ) : (
            <div className="cp-dashboard-game-grid">
              {mergedGames.map((game) => {
                const tone = progressionTone(game.progress || 0);

                return (
                  <ProgressCard
                    key={game.id}
                    title={game.shortName}
                    subtitle={game.familyLabel}
                    progress={game.progress || 0}
                    status={game.certified ? `Validé ${game.cert_level}` : "En cours"}
                    value={`${game.progress || 0}%`}
                    meta={(
                      <div>
                        <div style={{ fontWeight: 700, color: tone.color }}>{tone.label}</div>
                        <div>{game.sessions_count || 0} session(s)</div>
                      </div>
                    )}
                    className="cp-dashboard-game-card"
                    action={<Button href={game.route} variant="ghost" block>Ouvrir {game.shortName}</Button>}
                  >
                    <div style={{ display: "flex", gap: 14, alignItems: "center", minWidth: 0 }}>
                      <div className="cp-dashboard-game-icon">{game.icon}</div>
                      <div className="cp-dashboard-game-stats">
                        <div>
                          <strong>{game.accuracy || 0}%</strong>
                          <span>précision</span>
                        </div>
                        <div>
                          <strong>{game.best_streak || 0}</strong>
                          <span>série max</span>
                        </div>
                        <div>
                          <strong>{game.certified ? game.cert_level : "—"}</strong>
                          <span>niveau</span>
                        </div>
                      </div>
                    </div>
                  </ProgressCard>
                );
              })}
            </div>
          )}
        </Card>

        <div className="cp-card-stack">
          <Card>
            <SectionHeader
              eyebrow="Activité récente"
              title="Dernières sessions enregistrées"
              description="Résultats par jeu et par session. Score, précision et lecture qualitative de chaque passage."
            />

            {loading ? (
              <LoadingState title="Chargement des sessions..." />
            ) : sessions.length === 0 ? (
              <EmptyState description="Aucune session enregistrée. Lancez un simulateur pour alimenter le suivi." />
            ) : (
              <div className="cp-dashboard-session-list">
                {sessions.map((session) => {
                  const game = mergedGames.find((item) => item.id === session.game_id);
                  const mood = sessionMood(session.score || 0);

                  return (
                    <article key={session.id} className="cp-dashboard-session-row">
                      <div style={{ display: "flex", gap: 14, alignItems: "center", minWidth: 0 }}>
                        <div className="cp-dashboard-session-icon">{game?.icon || "?"}</div>
                        <div style={{ minWidth: 0 }}>
                          <div style={{ fontWeight: 700 }}>{game?.shortName || session.game_id}</div>
                          <div className="cp-muted" style={{ fontSize: 13, marginTop: 4 }}>
                            {(MODE_LABELS[session.mode] || session.mode)} · {niceDate(session.created_at)}
                          </div>
                        </div>
                      </div>

                      <div className="cp-dashboard-session-meta">
                        <div>
                          <strong>{session.score || 0}</strong>
                          <span>score</span>
                        </div>
                        <div>
                          <strong>{session.accuracy || 0}%</strong>
                          <span>précision</span>
                        </div>
                        <div>
                          <strong>{session.rounds_correct || 0}/{session.rounds_played || 0}</strong>
                          <span>réponses</span>
                        </div>
                        <div className={mood.className} style={{ fontWeight: 700, fontSize: 12 }}>
                          {mood.label}
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </Card>

          <Card>
            <SectionHeader
              eyebrow="Compétences"
              title="Axes de progression identifiés"
              description="Indicateurs calculés à partir des sessions enregistrées. Mis à jour automatiquement après chaque pratique."
            />

            {loading && !skillCards.length ? (
              <LoadingState title="Chargement des compétences..." />
            ) : skillCards.length === 0 ? (
              <EmptyState description="Les indicateurs apparaîtront ici à mesure que les sessions s'accumulent." />
            ) : (
              <div className="cp-dashboard-skill-grid">
                {skillCards.map((skill) => (
                  <div key={skill.key} className="cp-dashboard-skill-card">
                    <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center" }}>
                      <strong>{skill.label}</strong>
                      <span className="cp-gold" style={{ fontWeight: 700 }}>{skill.score}%</span>
                    </div>
                    <div className="cp-progress" style={{ marginTop: 12 }}>
                      <span style={{ width: `${skill.score}%` }} />
                    </div>
                    <div className="cp-muted" style={{ fontSize: 12, marginTop: 10 }}>{skill.note}</div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </section>
    </AppShell>
  );
}
