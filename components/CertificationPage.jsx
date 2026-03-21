"use client";

import { useEffect, useMemo, useState } from "react";
import AppShell from "@/components/AppShell";
import AssetPanel from "@/components/AssetPanel";
import { fetchCertifications, fetchProgress, fetchSessions, fetchSkills } from "@/lib/api";
import { AVAILABLE_GAMES, getGameById } from "@/lib/game-registry";
import { buildCertificationSnapshot } from "@/lib/member-analytics";
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

function ProgressBar({ value, color = "#C9A84C", height = 8 }) {
  return (
    <div className="cp-progress" style={{ height }}>
      <span style={{ width: `${Math.min(100, value)}%`, background: color }} />
    </div>
  );
}

function formatEarnedDate(dateString) {
  if (!dateString) return null;
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return null;

  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

export default function CertificationPage() {
  const [progress, setProgress] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [skills, setSkills] = useState([]);
  const [certifications, setCertifications] = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let active = true;

    const loadData = async () => {
      setLoading(true);
      const [progressRes, sessionsRes, skillsRes, certificationsRes] = await Promise.all([
        fetchProgress(),
        fetchSessions(24),
        fetchSkills(),
        fetchCertifications(),
      ]);

      if (!active) return;

      if (!progressRes.ok || !sessionsRes.ok || !skillsRes.ok || !certificationsRes.ok) {
        setError(
          progressRes.error ||
            sessionsRes.error ||
            skillsRes.error ||
            certificationsRes.error ||
            "Impossible de charger les donnees de certification."
        );
      } else {
        setProgress(progressRes.data || []);
        setSessions(sessionsRes.data || []);
        setSkills(skillsRes.data || []);
        setCertifications(certificationsRes.data || []);
        setError(null);
      }

      setLoading(false);
    };

    loadData();
    return () => {
      active = false;
    };
  }, []);

  const snapshot = useMemo(
    () =>
      buildCertificationSnapshot({
        progressRecords: progress,
        sessionRecords: sessions,
        skillRecords: skills,
        certificationRecords: certifications,
      }),
    [progress, sessions, skills, certifications]
  );
  const levels = snapshot.levels;

  useEffect(() => {
    if (!levels.length) return;
    if (!selected || !levels.some((item) => item.id === selected)) {
      setSelected(snapshot.currentLevelId);
    }
  }, [levels, selected, snapshot.currentLevelId]);

  const level = useMemo(
    () => levels.find((item) => item.id === selected) || levels[0] || null,
    [levels, selected]
  );
  const levelGames = useMemo(
    () => (level?.gameIds || []).map((gameId) => getGameById(gameId)?.shortName || gameId),
    [level]
  );
  const totalSessions = level?.stats?.sessions || 0;
  const hasTrainingData = totalSessions > 0 || progress.some((item) => (item.sessions_count || 0) > 0);
  const formattedDate = formatEarnedDate(level?.date);

  return (
    <AppShell badge="Certification" containerStyle={{ color: "var(--text)" }} density="comfortable">
      <Card tone="elevated">
        <div className="cp-product-hero">
          <div className="cp-product-hero-main">
            <SectionHeader
              eyebrow="Referentiel de certification"
              title="Un parcours progressif pour objectiver le niveau de preparation"
              description="Le parcours s'appuie maintenant sur la progression reelle enregistree par jeu, les sessions deja pratiquees et les certifications deja acquises."
            />

            <div className="cp-metric-strip">
              <StatCard value={levels.length} label="paliers de progression" />
              <StatCard value={snapshot.achievedLevels} label="niveau(x) valide(s)" accent />
              <StatCard value={`${level?.progress || 0}%`} label="avancement du palier courant" />
              <StatCard value={AVAILABLE_GAMES.length} label="jeux actifs" />
            </div>
          </div>

          <div className="cp-product-hero-aside">
            {level ? (
              <>
                <ProgressCard
                  title={level.name}
                  subtitle={level.tagline}
                  progress={level.progress}
                  status={level.achieved ? "Valide" : "En cours"}
                  value={level.achieved ? "Acquis" : `${level.progress}%`}
                  meta={formattedDate ? `Valide le ${formattedDate}` : "Palier actuellement suivi"}
                >
                  <div className="cp-muted">{level.description}</div>
                </ProgressCard>

                <AssetPanel
                  src="/visuals/certification-atelier.svg"
                  alt="Visuel premium du parcours de certification Dealer School."
                  eyebrow="Insignes"
                  title="Le parcours se lit comme un atelier de validation"
                  description="Badges, niveaux et progression sont mis en scene avec un visuel sobre, inspire des standards premium de table."
                  badges={["Bronze", "Silver", "Gold", "Platinum", "Elite"]}
                  ratio="certification"
                  className="cp-cert-visual-panel"
                />
              </>
            ) : (
              <Card padded="md">
                <LoadingState title="Preparation du parcours..." />
              </Card>
            )}
          </div>
        </div>
      </Card>

      {error ? <ErrorState description={error} style={{ marginTop: 20 }} /> : null}

      {!error && loading ? (
        <Card style={{ marginTop: 20 }}>
          <LoadingState title="Chargement de la certification..." />
        </Card>
      ) : null}

      {!error && !loading && !hasTrainingData ? (
        <Card style={{ marginTop: 20 }}>
          <EmptyState
            description="Aucune progression exploitable pour le moment. Lance quelques sessions sur les simulateurs pour alimenter automatiquement le parcours."
            action={<Button href="/simulateur">Ouvrir les simulateurs</Button>}
          />
        </Card>
      ) : null}

      {level && !error ? (
        <>
          <section>
            <SectionHeader
              eyebrow="Niveaux"
              title="Lecture rapide des paliers"
              description="Chaque niveau correspond a un degre d'autonomie plus exigeant sur la procedure, la cadence et la qualite d'execution."
            />

            <div className="cp-cert-badge-strip">
              {levels.map((item) => (
                <div key={item.id} className="cp-cert-badge-card" style={{ borderColor: `${item.color}66` }}>
                  <div className="cp-cert-badge-mark" style={{ color: item.color, borderColor: `${item.color}66` }}>
                    {item.name.slice(0, 1)}
                  </div>
                  <div>
                    <div style={{ fontWeight: 800 }}>{item.name}</div>
                    <div className="cp-muted" style={{ fontSize: 12 }}>{item.tagline}</div>
                  </div>
                </div>
              ))}
            </div>

            <div className="cp-cert-level-grid">
              {levels.map((item) => (
                <Card
                  key={item.id}
                  padded="md"
                  className="cp-cert-level-card"
                  onClick={() => setSelected(item.id)}
                  style={{
                    borderColor: selected === item.id ? item.color : undefined,
                    background: selected === item.id ? `${item.color}12` : undefined,
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "start" }}>
                    <div>
                      <div style={{ fontWeight: 800, fontSize: 20, color: item.color }}>{item.name}</div>
                      <div className="cp-muted" style={{ marginTop: 6 }}>{item.tagline}</div>
                    </div>
                    <Badge tone="pill">{item.achieved ? "Valide" : `${item.progress}%`}</Badge>
                  </div>
                  <div className="cp-muted">{item.description}</div>
                </Card>
              ))}
            </div>
          </section>

          <div className="cp-stack-wide">
            <Card>
              <SectionHeader
                eyebrow="Portee du palier"
                title={`Ce que couvre ${level.name}`}
                description="Le niveau selectionne est detaille a partir des jeux concernes, des signaux reels de performance et des exigences de validation."
              />

              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 18 }}>
                {levelGames.map((game) => <Badge key={game} tone="pill">{game}</Badge>)}
              </div>

              <div className="cp-kpi-row">
                <StatCard value={`${level.stats.accuracy}%`} label="precision observee" accent />
                <StatCard value={level.stats.sessions} label="sessions exploitees" />
                <StatCard value={level.stats.certifiedGames} label="jeux certifies" />
              </div>
            </Card>

            <Card>
              <SectionHeader
                eyebrow="Progression"
                title="Etat du palier"
                description="Lecture synthese de l'avancement du niveau selectionne."
              />

              <div style={{ display: "flex", justifyContent: "space-between", gap: 12, marginBottom: 8 }}>
                <span className="cp-muted">Progression actuelle</span>
                <span style={{ color: level.color, fontWeight: 700 }}>{level.progress}%</span>
              </div>
              <ProgressBar value={level.progress} color={level.color} />

              <div className="cp-kpi-row" style={{ marginTop: 18 }}>
                <StatCard value={`${level.completedRequirements}/${level.requirements.length}`} label="conditions remplies" />
                <StatCard value={level.achieved ? "Oui" : "Non"} label="niveau valide" />
              </div>
            </Card>
          </div>

          <div className="cp-stack-wide">
            <Card>
              <SectionHeader
                eyebrow="Exigences"
                title="Ce qu'il reste a valider"
                description="Les exigences sont calculees a partir des vraies donnees utilisateur disponibles aujourd'hui."
              />

              <div className="cp-check-list">
                {level.requirements.map((requirement, index) => {
                  const done = (level.requirementRatios[index] || 0) >= 100;

                  return (
                    <div key={requirement} className="cp-check-item">
                      <Badge
                        style={{
                          minWidth: 34,
                          justifyContent: "center",
                          background: done ? "rgba(46,125,70,0.12)" : "var(--surface-2)",
                          borderColor: done ? "rgba(46,125,70,0.24)" : "var(--line)",
                          color: done ? "#2E7D46" : "var(--muted)",
                        }}
                      >
                        {done ? "OK" : "..."}
                      </Badge>
                      <div className="cp-muted" style={{ paddingTop: 4 }}>{requirement}</div>
                    </div>
                  );
                })}
              </div>
            </Card>

            <Card>
              <SectionHeader
                eyebrow="Orientation"
                title="Suite recommandee"
                description="La page doit aider a se situer et a choisir l'action la plus logique pour continuer."
              />

              <div className="cp-card-stack">
                <div className="cp-muted">
                  {level.achieved
                    ? "Le palier est valide. La suite logique est d'ouvrir le niveau suivant pour elargir le spectre de jeux et monter en autonomie."
                    : level.progress > 0
                      ? "Le palier est engage. La priorite est de completer les exigences encore ouvertes et d'augmenter le volume de pratique utile."
                      : "Le palier n'est pas encore ouvert. Il depend des validations anterieures et d'un socle de pratique suffisant."}
                </div>

                {level.achieved ? (
                  <Button variant="secondary" href="/simulateur">Consulter le niveau suivant</Button>
                ) : level.progress > 0 ? (
                  <Button href="/simulateur">Poursuivre la preparation</Button>
                ) : (
                  <Button variant="ghost" disabled>Palier non ouvert</Button>
                )}
              </div>
            </Card>
          </div>
        </>
      ) : null}
    </AppShell>
  );
}
