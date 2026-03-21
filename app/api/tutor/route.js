import { NextResponse } from "next/server";
import { isTutorConfigured } from "@/lib/config";

const SYSTEM_PROMPT = "Tu es le coach IA de Dealer School, une plateforme de formation pour dealers de casino en ligne. Enseigne les regles, procedures et techniques du metier de croupier. Sois precis, pedagogique et encourageant. Reponds en francais. Sois concis mais complet.";

function demoReply(message, selectedGame) {
  return { reply: "Mode demo active. Ajoute ANTHROPIC_API_KEY pour activer le vrai coach IA.", demo: true };
}

export async function POST(request) {
  const body = await request.json();
  const message = typeof body?.message === "string" ? body.message.trim() : "";
  const selectedGame = typeof body?.selectedGame === "string" ? body.selectedGame.trim() : "";
  const history = Array.isArray(body?.messages) ? body.messages.slice(-10) : [];
  if (!message) return NextResponse.json({ error: "Message requis" }, { status: 400 });
  if (!isTutorConfigured()) return NextResponse.json(demoReply(message, selectedGame));
  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-api-key": process.env.ANTHROPIC_API_KEY, "anthropic-version": "2023-06-01" },
      body: JSON.stringify({ model: process.env.ANTHROPIC_MODEL || "claude-3-5-sonnet-latest", max_tokens: 900, system: SYSTEM_PROMPT + (selectedGame ? "\nL apprenant travaille sur : " + selectedGame : ""), messages: [...history, { role: "user", content: message }] }),
    });
    const data = await response.json();
    if (!response.ok) return NextResponse.json({ error: data?.error?.message || "Erreur Anthropic" }, { status: 500 });
    const reply = Array.isArray(data?.content) ? data.content.map((b) => b?.text || "").join("\n").trim() : "";
    return NextResponse.json({ reply: reply || "Je n ai pas pu generer de reponse exploitable." });
  } catch (error) { return NextResponse.json({ error: error?.message || "Erreur reseau vers le coach IA" }, { status: 500 }); }
}
