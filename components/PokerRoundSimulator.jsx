"use client";

import { useMemo, useState } from "react";
import AppShell from "@/components/AppShell";
import { saveSession } from "@/lib/api";
import { formatCardLabel, SUIT_COLORS } from "@/lib/card-utils";
import { Badge, Button, Card, SectionHeader, StatCard } from "@/components/ui";

function PlayingCard({ card }) {
  return (
    <div
      style={{
        width: 68,
        minHeight: 94,
        borderRadius: 10,
        border: "1px solid rgba(10,10,10,0.12)",
        background: "#fff",
        color: SUIT_COLORS[card.suit],
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "'Playfair Display', serif",
        fontWeight: 900,
        fontSize: 22,
        boxShadow: "0 10px 28px rgba(0,0,0,0.18)",
      }}
    >
      {formatCardLabel(card)}
    </div>
  );
}

function CardGroup({ title, cards }) {
  return (
    <Card padded="md">
      <div className="cp-section-eyebrow">{title}</div>
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 12 }}>
        {cards.map((card, index) => <PlayingCard key={`${title}-${index}-${card.rank}-${card.suit}`} card={card} />)}
      </div>
    </Card>
  );
}

export default function PokerRoundSimulator({
  game,
  intro,
  buildRound,
  question,
  answerOptions,
  getCorrectAnswer,
  getAnswerLabel,
  renderScenario,
  getResolutionLines,
}) {
  const [round, setRound] = useState(() => buildRound());
  const [selectedAnswer, setSelectedAnswer] = useState("");
  const [feedback, setFeedback] = useState(null);
  const [stats, setStats] = useState({ played: 0, correct: 0 });

  const accuracy = stats.played > 0 ? Math.round((stats.correct / stats.played) * 100) : 0;
  const correctAnswer = useMemo(() => getCorrectAnswer(round), [getCorrectAnswer, round]);

  async function submitAnswer() {
    if (!selectedAnswer) return;

    const isCorrect = selectedAnswer === correctAnswer;
    const nextStats = {
      played: stats.played + 1,
      correct: stats.correct + (isCorrect ? 1 : 0),
    };

    setStats(nextStats);
    setFeedback({
      isCorrect,
      expected: getAnswerLabel(correctAnswer, round),
    });

    await saveSession({
      game_id: game.id,
      mode: "guidee",
      score: isCorrect ? 100 : 0,
      accuracy: Math.round(((nextStats.correct) / nextStats.played) * 100),
      duration_seconds: 0,
      rounds_played: 1,
      rounds_correct: isCorrect ? 1 : 0,
      errors: isCorrect ? [] : [`Reponse donnee: ${selectedAnswer}`],
      details: {
        route: game.route,
        expected: correctAnswer,
        selected: selectedAnswer,
      },
    }).catch(() => null);
  }

  function nextRound() {
    setRound(buildRound());
    setSelectedAnswer("");
    setFeedback(null);
  }

  return (
    <AppShell badge={`Simulateur · ${game.shortName}`} density="comfortable">
      <Card tone="elevated">
        <div className="cp-product-hero">
          <div className="cp-product-hero-main">
            <SectionHeader
              eyebrow={game.family === "classiques" ? "Classiques casino" : "Poker casino"}
              title={game.name}
              description={intro || game.description}
            />
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <Badge tone="pill">Difficulté {game.difficulty}/5</Badge>
              <Badge tone="pill">{game.tagline}</Badge>
            </div>
          </div>
          <div className="cp-product-hero-aside">
            <div className="cp-kpi-row">
              <StatCard value={stats.played} label="donnes" />
              <StatCard value={`${accuracy}%`} label="precision" accent />
              <StatCard value={game.difficulty} label="difficulte / 5" />
            </div>
          </div>
        </div>
      </Card>

      <div className="cp-card-grid">
        <Card padded="md">
          <SectionHeader
            eyebrow="Situation"
            title={question}
            description="Choisissez l'issue correcte, puis verifiez le detail de resolution produit par le moteur."
          />

          {renderScenario(round, CardGroup)}

          <div style={{ display: "grid", gap: 10, marginTop: 18 }}>
            {answerOptions.map((option) => {
              const active = selectedAnswer === option.value;
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setSelectedAnswer(option.value)}
                  style={{
                    textAlign: "left",
                    padding: "14px 16px",
                    borderRadius: 12,
                    border: active ? "1px solid rgba(201,168,76,0.45)" : "1px solid var(--line)",
                    background: active ? "rgba(201,168,76,0.1)" : "var(--surface)",
                    color: "var(--text)",
                    cursor: "pointer",
                    fontWeight: 700,
                  }}
                >
                  {option.label}
                </button>
              );
            })}
          </div>

          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 18 }}>
            <Button onClick={submitAnswer} disabled={!selectedAnswer || Boolean(feedback)}>Valider</Button>
            <Button variant="ghost" onClick={nextRound}>Nouvelle donne</Button>
          </div>
        </Card>

        <Card padded="md">
          <SectionHeader
            eyebrow="Resolution"
            title={feedback ? (feedback.isCorrect ? "Bonne lecture" : "Correction") : "En attente de validation"}
            description={feedback ? `Réponse attendue : ${feedback.expected}` : "Le detail de reglement apparait apres validation."}
          />

          <div className="cp-card-stack">
            {(feedback ? getResolutionLines(round) : ["Validez votre choix pour afficher le detail de resolution."]).map((line) => (
              <div key={line} className="cp-muted">{line}</div>
            ))}
          </div>
        </Card>
      </div>
    </AppShell>
  );
}
