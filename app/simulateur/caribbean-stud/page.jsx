"use client";

import PokerRoundSimulator from "@/components/PokerRoundSimulator";
import { buildTrainingRound } from "@/features/caribbean-stud/engine";
import { getRoundOutcomeLabel } from "@/features/caribbean-stud/selectors";
import { getGameBySlug } from "@/lib/game-registry";

const game = getGameBySlug("caribbean-stud");
const OPTIONS = [
  { value: "player_win", label: "Joueur gagnant" },
  { value: "dealer_not_qualified", label: "Banque non qualifiée" },
  { value: "dealer_win", label: "Banque gagnante" },
  { value: "tie", label: "Égalité" },
];

export default function CaribbeanStudPage() {
  return (
    <PokerRoundSimulator
      game={game}
      intro="Lecture guidée d'une resolution Caribbean Stud a partir des mains ouvertes."
      buildRound={buildTrainingRound}
      question="Quelle est l'issue principale de cette donne ?"
      answerOptions={OPTIONS}
      getCorrectAnswer={(round) => round.result.outcome}
      getAnswerLabel={(answer) => getRoundOutcomeLabel(answer)}
      renderScenario={(round, CardGroup) => (
        <div className="cp-card-stack">
          <CardGroup title="Main joueur" cards={round.playerHand} />
          <CardGroup title="Main banque" cards={round.dealerHand} />
        </div>
      )}
      getResolutionLines={(round) => [
        `Issue: ${getRoundOutcomeLabel(round.result.outcome)}.`,
        `Qualification banque: ${round.result.dealerQualified ? "oui" : "non"}.`,
        `Ante: ${round.result.ante.result} (${round.result.ante.amount}).`,
        `Raise: ${round.result.raise.result} (${round.result.raise.amount}).`,
        `Progressive: ${round.result.progressive.result} (${round.result.progressive.amount}).`,
      ]}
    />
  );
}

