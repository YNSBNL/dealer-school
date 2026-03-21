"use client";
import PokerRoundSimulator from "@/components/PokerRoundSimulator";
import { buildTrainingRound } from "@/features/casino-holdem/engine";
import { getOutcomeLabel } from "@/features/casino-holdem/selectors";
import { getGameBySlug } from "@/lib/game-registry";

const game = getGameBySlug("casino-holdem");
const OPTIONS = [
  { value: "player_win", label: "Joueur gagnant" },
  { value: "dealer_not_qualified", label: "Banque non qualifiee" },
  { value: "dealer_win", label: "Banque gagnante" },
  { value: "tie", label: "Egalite" },
];

export default function CasinoHoldemPage() {
  return (
    <PokerRoundSimulator
      game={game}
      intro="Scenario holdem contre la maison avec board commun et resolution ante/call."
      buildRound={buildTrainingRound}
      question="Quelle est l issue de cette donne Casino Holdem ?"
      answerOptions={OPTIONS}
      getCorrectAnswer={(round) => round.result.outcome}
      getAnswerLabel={(answer) => getOutcomeLabel(answer)}
      renderScenario={(round, CardGroup) => (
        <div className="cp-card-stack">
          <CardGroup title="Main joueur" cards={round.playerCards} />
          <CardGroup title="Board" cards={round.board} />
          <CardGroup title="Main banque" cards={round.dealerCards} />
        </div>
      )}
      getResolutionLines={(round) => [
        `Issue: ${getOutcomeLabel(round.result.outcome)}.`,
        `Qualification banque: ${round.result.dealerQualified ? "oui" : "non"}.`,
        `Ante: ${round.result.ante.result} (${round.result.ante.amount}).`,
        `Call: ${round.result.call.result} (${round.result.call.amount}).`,
        `Bonus: ${round.result.bonus.result} (${round.result.bonus.amount}).`,
      ]}
    />
  );
}
