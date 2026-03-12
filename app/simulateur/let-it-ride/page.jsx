"use client";

import PokerRoundSimulator from "@/components/PokerRoundSimulator";
import { buildTrainingRound } from "@/features/let-it-ride/engine";
import { getQualificationLabel } from "@/features/let-it-ride/selectors";
import { getGameBySlug } from "@/lib/game-registry";

const game = getGameBySlug("let-it-ride");
const OPTIONS = [
  { value: "qualifies", label: "Main qualifiante" },
  { value: "not_qualifies", label: "Main non qualifiante" },
];

export default function LetItRidePage() {
  return (
    <PokerRoundSimulator
      game={game}
      intro="Lecture rapide d'une main finale Let It Ride et de sa qualification pair de 10 ou mieux."
      buildRound={buildTrainingRound}
      question="La main finale qualifie-t-elle le paiement principal ?"
      answerOptions={OPTIONS}
      getCorrectAnswer={(round) => (round.result.qualifies ? "qualifies" : "not_qualifies")}
      getAnswerLabel={(answer) => getQualificationLabel(answer === "qualifies")}
      renderScenario={(round, CardGroup) => (
        <div className="cp-card-stack">
          <CardGroup title="Cartes joueur" cards={round.playerCards} />
          <CardGroup title="Cartes communes" cards={round.communityCards} />
        </div>
      )}
      getResolutionLines={(round) => [
        `${getQualificationLabel(round.result.qualifies)}.`,
        `Main finale: ${round.result.hand.label}.`,
        `Paytable appliquee: x${round.result.payoutMultiplier}.`,
        `Montant resolu: ${round.result.amount}.`,
      ]}
    />
  );
}
