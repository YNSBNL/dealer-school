"use client";

import AppShell from "@/components/AppShell";
import { useAuth } from "@/lib/auth-context";
import { AVAILABLE_GAMES, LANDING_GAMES } from "@/lib/game-registry";
import { buildLoginHref, buildProtectedHref, buildRegisterHref } from "@/lib/platform-access";
import { Badge, Button, Card, ProgressCard, SectionHeader, StatCard } from "@/components/ui";

const steps = [
  {
    title: "Prendre en main les fondamentaux",
    copy: "Le candidat travaille les regles, les annonces, les paiements et la logique de procedure sur des tables interactives.",
  },
  {
    title: "Mesurer la progression",
    copy: "Chaque session alimente un suivi clair: volume de pratique, precision, regularite et progression par jeu.",
  },
  {
    title: "Monter en exigence",
    copy: "Le parcours enchaine les niveaux, les jeux et les situations jusqu'a un niveau de tenue de table plus stable.",
  },
];

const learningModes = [
  {
    title: "Simulation guidee",
    subtitle: "Apprendre le bon enchainement",
    progress: 72,
    status: "Demarrage",
    value: "Procedure",
    meta: "Annonces, placement, paiements",
    details: [
      "Prise en main des mecanismes de table",
      "Rythme progressif pour memoriser les standards",
    ],
  },
  {
    title: "Entrainement rythme",
    subtitle: "Gagner en regularite",
    progress: 84,
    status: "Consolidation",
    value: "Execution",
    meta: "Cadence, fiabilite, repetitions",
    details: [
      "Repetition des scenarii les plus frequents",
      "Lecture immediate du score et de la precision",
    ],
  },
  {
    title: "Revision et certification",
    subtitle: "Verifier ce qui tient vraiment",
    progress: 58,
    status: "Validation",
    value: "Evaluation",
    meta: "Paliers, criteres, suivi",
    details: [
      "Debrief, auto-evaluation et preparation du niveau suivant",
      "Vision plus objective du niveau atteint par jeu",
    ],
  },
];

const audienceBlocks = [
  {
    title: "Pour les candidats",
    points: [
      "S'entrainer a son rythme, sans attendre une table disponible.",
      "Comprendre les standards avant l'entretien ou la prise de poste.",
      "Visualiser ses points forts et les zones a retravailler.",
    ],
    cta: { href: "/auth/register", label: "Creer mon espace" },
  },
  {
    title: "Pour les casinos et centres de formation",
    points: [
      "Structurer une base commune de revision et de preparation.",
      "Suivre une progression plus lisible sur les jeux prioritaires.",
      "Completer la formation terrain par un environnement de repetition.",
    ],
    cta: { href: "/catalogue", label: "Voir les jeux couverts" },
  },
];

export default function Home() {
  const { user, loading, isDemoMode } = useAuth();

  return (
    <AppShell
      badge="Plateforme de formation croupier"
      containerStyle={{ paddingTop: 36, paddingBottom: 72 }}
      density="comfortable"
      showSecondaryNav={false}
    >
      <Card tone="elevated" className="cp-landing-hero-card" style={{ overflow: "hidden", position: "relative" }}>
        <div className="cp-orb cp-orb-gold" style={{ width: 360, height: 360, top: -90, right: -60 }} />
        <div className="cp-orb cp-orb-green" style={{ width: 260, height: 260, bottom: -90, left: -30 }} />

        <div className="cp-landing-hero">
          <div className="cp-page-hero">
            <Badge style={{ marginBottom: 4 }}>
              <span className="cp-badge-dot" /> Formation, procedure et repetition metier
            </Badge>
            <h1 className="cp-page-title">
              Former un croupier ne devrait pas reposer uniquement sur le <span className="cp-gold">temps de table disponible</span>.
            </h1>
            <p className="cp-page-copy">
              CroupierPro propose un environnement de formation premium pour travailler les reflexes de table, la
              procedure et la regularite d'execution. La plateforme combine simulateurs, suivi de progression, coach
              de revision et parcours de certification dans une experience pensee pour un usage serieux, avec un
              espace membre au centre des outils les plus utiles.
            </p>

            <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
              <Button href={user ? "/dashboard" : buildRegisterHref("/dashboard")}>
                {user ? "Ouvrir mon espace" : "Creer un espace membre"}
              </Button>
              <Button href={user ? "/simulateur" : buildLoginHref("/dashboard")} variant="secondary">
                {user ? "Ouvrir les simulateurs" : "Se connecter"}
              </Button>
              <Button href="/catalogue" variant="ghost">Voir les jeux couverts</Button>
            </div>

            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <Badge tone="pill">{AVAILABLE_GAMES.length} modules membres disponibles</Badge>
              <Badge tone="pill">Compte requis pour debloquer les outils membres</Badge>
              <Badge tone="pill">Suivi de progression par jeu</Badge>
              <Badge tone="pill">Certification structuree</Badge>
              {isDemoMode ? <Badge tone="pill">Configuration locale detectee</Badge> : null}
            </div>
          </div>

          <div className="cp-landing-hero-side">
            <div className="cp-surface-strip">
              {[
                { value: String(AVAILABLE_GAMES.length), label: "jeux membres disponibles" },
                { value: "5", label: "niveaux de certification" },
                { value: "24/7", label: "acces plateforme" },
                { value: loading ? "..." : user ? "Compte actif" : "Acces decouverte", label: "statut session" },
              ].map((item) => (
                <StatCard key={item.label} value={item.value} label={item.label} accent />
              ))}
            </div>

            <Card padded="md" tone="muted">
              <div className="cp-section-eyebrow">Positionnement produit</div>
              <div className="cp-landing-proof-title">Une couche de repetition avant, pendant et apres la formation terrain.</div>
              <div className="cp-muted" style={{ marginTop: 10 }}>
                La plateforme ne remplace pas la table. Elle professionnalise la preparation, la revision et le suivi
                entre les mises en situation reelles.
              </div>
            </Card>
          </div>
        </div>
      </Card>

      <section>
        <SectionHeader
          eyebrow="Comment ca marche"
          title="Une progression en trois temps, lisible par le candidat comme par l'encadrant"
          description="La plateforme est construite pour apprendre, repeter puis verifier. Chaque couche a un role clair dans le parcours."
        />

        <div className="cp-card-grid">
          {steps.map((step, index) => (
            <Card key={step.title} padded="md">
              <Badge tone="pill">Etape {index + 1}</Badge>
              <div style={{ marginTop: 14, fontWeight: 800, fontSize: 20 }}>{step.title}</div>
              <div className="cp-muted" style={{ marginTop: 10 }}>{step.copy}</div>
            </Card>
          ))}
        </div>
      </section>

      <section>
        <SectionHeader
          eyebrow="Jeux couverts"
          title="Les jeux disponibles sont relies a la meme registry produit"
          description="Tous les simulateurs affiches ici ont une route active, une fiche catalogue et un point d'entree visible dans le site."
          action={<Button href="/catalogue" variant="ghost">Catalogue complet</Button>}
        />

        <div className="cp-card-grid">
          {LANDING_GAMES.map((game) => (
            <Card key={game.id} padded="md" tone="elevated">
              <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "start" }}>
                <div className="cp-dashboard-game-icon" style={{ width: 48, height: 48, fontSize: 16 }}>{game.icon}</div>
                <Badge tone="pill">{user ? "Disponible" : "Compte requis"}</Badge>
              </div>
              <div style={{ marginTop: 16, fontWeight: 800, fontSize: 20 }}>{game.name}</div>
              <div className="cp-muted" style={{ marginTop: 10 }}>
                {game.tagline}. Entrainement centre sur la procedure, la resolution, les paiements et la tenue generale du jeu.
              </div>
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 18 }}>
                <Button href={buildProtectedHref(Boolean(user), game.route)}>
                  {user ? "Ouvrir le simulateur" : "Se connecter pour debloquer"}
                </Button>
                {!user ? <Button href={buildRegisterHref(game.route)} variant="ghost">Creer un compte</Button> : null}
              </div>
            </Card>
          ))}
        </div>
      </section>

      <section>
        <SectionHeader
          eyebrow="Modes d'apprentissage"
          title="Une meme plateforme pour pratiquer, revoir et structurer la montee en competence"
          description="Chaque mode repond a un usage different: prise en main, repetition, revision, suivi ou validation."
        />

        <div className="cp-card-grid">
          {learningModes.map((mode) => (
            <ProgressCard
              key={mode.title}
              title={mode.title}
              subtitle={mode.subtitle}
              progress={mode.progress}
              status={mode.status}
              value={mode.value}
              meta={mode.meta}
            >
              {mode.details.map((detail) => (
                <div key={detail} className="cp-muted">{detail}</div>
              ))}
            </ProgressCard>
          ))}
        </div>
      </section>

      <section className="cp-stack-wide">
        <Card tone="elevated">
          <SectionHeader
            eyebrow="Certification"
            title="Un referentiel progressif, du socle technique a l'autonomie de table"
            description="La certification donne une lecture plus claire du niveau atteint, sans promettre artificiellement une employabilite instantanee."
            action={
              <Button href={user ? "/certification" : buildRegisterHref("/certification")} variant="secondary">
                {user ? "Voir le parcours" : "Creer un compte pour suivre le parcours"}
              </Button>
            }
          />

          <div className="cp-surface-strip">
            <StatCard value="Bronze" label="bases et procedures tenues avec accompagnement" />
            <StatCard value="Silver" label="autonomie encadree sur les tables classiques" />
            <StatCard value="Gold" label="niveau vise pour une tenue de table plus stable" accent />
          </div>
        </Card>

        <Card>
          <SectionHeader
            eyebrow="Valeur produit"
            title="Ce que CroupierPro apporte vraiment"
            description="Un environnement plus rigoureux que du simple contenu e-learning, et plus disponible qu'une formation uniquement dependante de la table."
          />

          <div className="cp-card-grid">
            <StatCard value="Suivi" label="historique de sessions consultable" />
            <StatCard value="Revision" label="coach pour les regles, paiements et incidents" />
            <StatCard value="Cadre" label="navigation, progression et parcours unifies" />
          </div>
        </Card>
      </section>

      <section>
        <SectionHeader
          eyebrow="Publics"
          title="Une plateforme utile aux candidats comme aux structures qui encadrent la formation"
          description="Le discours, les usages et les attentes ne sont pas les memes. La landing les distingue explicitement."
        />

        <div className="cp-card-grid">
          {audienceBlocks.map((block) => (
            <Card key={block.title} padded="lg">
              <div style={{ fontWeight: 800, fontSize: 22 }}>{block.title}</div>
              <div className="cp-grid" style={{ gap: 12, marginTop: 18 }}>
                {block.points.map((point) => (
                  <div key={point} className="cp-muted">{point}</div>
                ))}
              </div>
              <div style={{ marginTop: 20 }}>
                <Button href={block.cta.href} variant={block.title === "Pour les candidats" ? "primary" : "ghost"}>
                  {block.cta.label}
                </Button>
              </div>
            </Card>
          ))}
        </div>
      </section>

      <Card tone="elevated" className="cp-landing-final-cta">
        <div className="cp-page-hero" style={{ marginBottom: 0 }}>
          <div className="cp-page-kicker">Pret a tester la plateforme</div>
          <h2 className="cp-page-title" style={{ fontSize: "clamp(2rem, 3vw, 3rem)" }}>
            Un premier niveau de decouverte est deja accessible. L'espace membre ouvre ensuite le suivi complet.
          </h2>
          <p className="cp-page-copy">
            Explorez d'abord le catalogue public, puis ouvrez un compte pour retrouver vos sessions, votre
            progression, les simulateurs complets et le parcours de certification.
          </p>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            <Button href={user ? "/dashboard" : buildRegisterHref("/dashboard")}>
              {user ? "Acceder a mon dashboard" : "Ouvrir un espace membre"}
            </Button>
            <Button href={user ? "/simulateur" : buildLoginHref("/dashboard")} variant="secondary">
              {user ? "Ouvrir les simulateurs" : "Se connecter"}
            </Button>
            <Button href="/catalogue" variant="ghost">Explorer le catalogue</Button>
          </div>
        </div>
      </Card>
    </AppShell>
  );
}
