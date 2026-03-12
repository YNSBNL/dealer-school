import { NextResponse } from "next/server";
import { isTutorConfigured } from "@/lib/config";

const SYSTEM_PROMPT = `Tu es le coach IA de CroupierPro, une plateforme de formation pour croupiers en ligne.

Ton rôle :
- Enseigner les règles, procédures et techniques du métier de croupier
- Être précis, pédagogique et encourageant
- Utiliser le vocabulaire professionnel du casino
- Donner des exemples concrets et des mises en situation
- Corriger les erreurs avec bienveillance
- Poser des questions pour vérifier la compréhension
- Adapter ton niveau au profil de l'apprenant

Jeux couverts : Roulette, Blackjack, Baccarat, Three Card Poker, Ultimate Texas Hold'em, Caribbean Stud, Texas Hold'em, Omaha/PLO, Sic Bo, Craps.

Règles importantes :
- Toujours donner les cotes/paiements exacts
- Utiliser les termes français ET anglais du casino
- Structurer tes réponses clairement
- Proposer des exercices pratiques quand c'est pertinent
- Ne jamais inventer de règles

Réponds en français. Sois concis mais complet.`;

function demoReply(message, selectedGame) {
  const gameLine = selectedGame ? `Jeu ciblé : ${selectedGame}.` : "Jeu ciblé : général métier.";
  return {
    reply: `Mode démo activé : l'API Anthropic n'est pas configurée.\n\n${gameLine}\n\nVoici une réponse de secours basée sur ta question : « ${message} ».\n\n1. Commence par rappeler la règle et le séquençage opératoire.\n2. Vérifie l'annonce, la résolution, puis le paiement.\n3. Termine par un mini exercice chronométré.\n\nAjoute la variable ANTHROPIC_API_KEY pour activer le vrai coach IA côté serveur.`,
    demo: true,
  };
}

export async function POST(request) {
  const body = await request.json();
  const message = typeof body?.message === "string" ? body.message.trim() : "";
  const selectedGame = typeof body?.selectedGame === "string" ? body.selectedGame.trim() : "";
  const history = Array.isArray(body?.messages) ? body.messages.slice(-10) : [];

  if (!message) {
    return NextResponse.json({ error: "Message requis" }, { status: 400 });
  }

  if (!isTutorConfigured()) {
    return NextResponse.json(demoReply(message, selectedGame));
  }

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: process.env.ANTHROPIC_MODEL || "claude-3-5-sonnet-latest",
        max_tokens: 900,
        system: SYSTEM_PROMPT + (selectedGame ? `\n\nL'apprenant travaille actuellement sur : ${selectedGame}. Concentre-toi sur ce jeu.` : ""),
        messages: [...history, { role: "user", content: message }],
      }),
    });

    const data = await response.json();
    if (!response.ok) {
      return NextResponse.json({ error: data?.error?.message || "Erreur Anthropic" }, { status: 500 });
    }

    const reply = Array.isArray(data?.content)
      ? data.content.map((block) => block?.text || "").join("\n").trim()
      : "";

    return NextResponse.json({ reply: reply || "Je n'ai pas pu générer de réponse exploitable." });
  } catch (error) {
    return NextResponse.json({ error: error?.message || "Erreur réseau vers le coach IA" }, { status: 500 });
  }
}
