"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import AppShell from "@/components/AppShell";
import { useAuth } from "@/lib/auth-context";
import { AVAILABLE_GAMES } from "@/lib/game-registry";
import { Badge, Button, Card, EmptyState, ErrorState, SectionHeader } from "@/components/ui";

const TOPIC_MAP = {
  roulette: ["Paiements simples", "Annonces", "Gestion du tapis"],
  blackjack: ["Hit / Stand", "Split", "Insurance"],
  baccarat: ["Troisieme carte", "Naturels", "Commission"],
  "ultimate-texas": ["Blind", "Trips", "Showdown"],
  "three-card-poker": ["Ante / Play", "Pair Plus", "Q-high"],
  "caribbean-stud": ["Qualification du dealer", "Raise", "A-K ou mieux"],
  "casino-holdem": ["Ante / Call", "Pair of 4s+", "Board reading"],
  "let-it-ride": ["Retrait des mises", "Paytable", "Pair de 10+"],
};

const GAME_TOPICS = [
  ...AVAILABLE_GAMES.map((game) => ({
    id: game.id,
    name: game.shortName,
    icon: game.icon,
    topics: TOPIC_MAP[game.id] || [game.tagline],
  })),
  { id: "general", name: "Metier croupier", icon: "🎓", topics: ["Posture", "Rythme", "Gestion d'un litige"] },
];

const QUICK_PROMPTS = [
  "Explique les paiements roulette avec trois exemples.",
  "Fais-moi un quiz court de blackjack niveau debutant.",
  "Rappelle la regle de la troisieme carte au baccarat.",
  "Comment reagir si un joueur conteste un paiement ?",
];

export default function AITutor() {
  const { isDemoMode } = useAuth();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [selectedGame, setSelectedGame] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const listRef = useRef(null);
  const inputRef = useRef(null);

  const topicSuggestions = useMemo(() => selectedGame?.topics || [], [selectedGame]);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, loading]);

  async function sendMessage(text = null) {
    const message = (text ?? input).trim();
    if (!message || loading) return;

    const userMessage = { role: "user", content: message };
    const nextMessages = [...messages, userMessage];
    setMessages(nextMessages);
    setInput("");
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/tutor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message,
          selectedGame: selectedGame?.name || "",
          messages: nextMessages.slice(-8),
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.error || "Impossible de joindre le coach.");
      }

      setMessages((current) => [...current, { role: "assistant", content: data.reply || "Aucune reponse disponible." }]);
    } catch (err) {
      setError(err?.message || "Le coach n'a pas pu repondre.");
      setMessages((current) => [
        ...current,
        { role: "assistant", content: "Je n'ai pas pu formuler une reponse exploitable. Reessaie dans un instant ou reformule la question plus precisement." },
      ]);
    } finally {
      setLoading(false);
      setTimeout(() => inputRef.current?.focus(), 60);
    }
  }

  return (
    <AppShell badge="Coach IA" containerStyle={{ paddingTop: 24, paddingBottom: 40 }} density="comfortable">
      <Card tone="elevated"
        style={{
          minHeight: "calc(100vh - 140px)",
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 320px), 1fr))",
          overflow: "hidden",
        }}
      >
        <aside className="cp-panel-lg" style={{ borderRight: "1px solid rgba(255,255,255,0.06)" }}>
          <SectionHeader
            eyebrow="Preparation guidee"
            title="Choisir un angle de travail"
            description="Le coach aide a revoir une regle, verifier une procedure ou se preparer a une situation de table."
            style={{ marginBottom: 0 }}
          />

          {isDemoMode ? (
            <ErrorState tone="info" description="Le mode local reste utilisable pour tester le coach, meme sans configuration complete." style={{ marginTop: 16 }} />
          ) : null}
          {error ? <ErrorState description={error} style={{ marginTop: 16 }} /> : null}

          <div className="cp-grid" style={{ marginTop: 18 }}>
            {GAME_TOPICS.map((game) => {
              const active = selectedGame?.id === game.id;
              return (
                <Card
                  key={game.id}
                  padded="md"
                  style={{
                    textAlign: "left",
                    cursor: "pointer",
                    borderColor: active ? "rgba(201,168,76,0.28)" : undefined,
                    background: active ? "rgba(201,168,76,0.08)" : undefined,
                  }}
                  onClick={() => setSelectedGame(game)}
                >
                  <div style={{ fontSize: 26 }}>{game.icon}</div>
                  <div style={{ marginTop: 10, fontWeight: 800 }}>{game.name}</div>
                  <div className="cp-muted" style={{ marginTop: 6, fontSize: 13 }}>{game.topics.join(" · ")}</div>
                </Card>
              );
            })}
          </div>
        </aside>

        <section style={{ display: "grid", gridTemplateRows: "auto minmax(320px, 1fr) auto", minWidth: 0 }}>
          <div className="cp-panel-lg" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 16, flexWrap: "wrap", alignItems: "center" }}>
              <div>
                <div className="cp-section-eyebrow">Conversation</div>
                <h2 className="cp-section-title" style={{ marginTop: 8 }}>
                  {selectedGame ? `${selectedGame.icon} ${selectedGame.name}` : "Assistant pedagogique general"}
                </h2>
              </div>
              <Button type="button" variant="ghost" onClick={() => { setMessages([]); setError(null); }}>
                Nouvelle conversation
              </Button>
            </div>

            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 16 }}>
              {(topicSuggestions.length ? topicSuggestions : QUICK_PROMPTS).map((topic) => (
                <Badge
                  key={topic}
                  tone="pill"
                  style={{ cursor: "pointer" }}
                  onClick={() => sendMessage(selectedGame ? `Explique ${topic} au ${selectedGame.name}.` : topic)}
                >
                  {topic}
                </Badge>
              ))}
            </div>
          </div>

          <div ref={listRef} className="cp-panel-lg cp-chat-scroll" style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {messages.length === 0 ? (
              <EmptyState description="Commence par une question concrete. Exemple : un joueur conteste un paiement roulette, quelle procedure faut-il tenir ?" />
            ) : null}

            {messages.map((message, index) => (
              <div
                key={`${message.role}-${index}`}
                className={`cp-chat-bubble ${message.role === "user" ? "cp-chat-user" : "cp-chat-assistant"}`}
              >
                {message.content}
              </div>
            ))}

            {loading ? <div className="cp-chat-bubble cp-chat-assistant">Le coach prepare une reponse claire et exploitable...</div> : null}
          </div>

          <div className="cp-panel-lg" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 220px), 1fr))", gap: 12 }}>
              <textarea
                ref={inputRef}
                className="cp-textarea"
                rows={3}
                value={input}
                placeholder="Pose une question precise sur une regle, une annonce, un paiement ou une situation de table..."
                onChange={(event) => setInput(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" && !event.shiftKey) {
                    event.preventDefault();
                    sendMessage();
                  }
                }}
              />
              <Button type="button" style={{ minWidth: 0 }} onClick={() => sendMessage()} disabled={loading}>
                Envoyer
              </Button>
            </div>
          </div>
        </section>
      </Card>
    </AppShell>
  );
}
