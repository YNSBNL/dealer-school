"use client";
import PokerRoundSimulator from "@/components/PokerRoundSimulator";
import { buildTrainingRound } from "@/features/three-card-poker/engine";
import { getAntePlayOutcomeLabel } from "@/features/three-card-poker/selectors";
import { getGameBySlug } from "@/lib/game-registry";

const game = getGameBySlug("three-card-poker");
const OPTIONS = [
  { value: "player_win", label: "Joueur gagnant" },
  { value: "dealer_not_qualified", label: "Banque non qualifiee" },
  { value: "dealer_win", label: "Banque gagnante" },
  { value: "tie", label: "Egalite" },
];

export default function ThreeCardPokerPage() {
  return (
    <PokerRoundSimulator
      game={game}
      intro="Module court pour lire une donne Three Card Poker et valider la bonne issue Ante/Play."
      buildRound={buildTrainingRound}
      question="Quelle est l issue Ante / Play de cette donne ?"
      answerOptions={OPTIONS}
      getCorrectAnswer={(round) => round.result.outcome}
      getAnswerLabel={(answer) => getAntePlayOutcomeLabel(answer)}
      renderScenario={(round, CardGroup) => (
        <div className="cp-card-stack">
          <CardGroup title="Main joueur" cards={round.playerHand} />
          <CardGroup title="Main banque" cards={round.dealerHand} />
        </div>
      )}
      getResolutionLines={(round) => [
        `Issue: ${getAntePlayOutcomeLabel(round.result.outcome)}.`,
        `Qualification banque: ${round.result.dealerQualified ? "oui" : "non"}.`,
        `Ante: ${round.result.ante.result} (${round.result.ante.amount}).`,
        `Play: ${round.result.play.result} (${round.result.play.amount}).`,
        `Pair Plus: ${round.pairPlus.qualifies ? "oui x" + round.pairPlus.payoutMultiplier : "non"}.`,
        `Ante bonus: ${round.anteBonus.qualifies ? "oui x" + round.anteBonus.payoutMultiplier : "non"}.`,
      ]}
    />
  );
}
