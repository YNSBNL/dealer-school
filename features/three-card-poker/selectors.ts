import type { EvaluatedThreeCardHand } from "./types";
export function getDealerQualificationLabel(qualified: boolean): string { return qualified ? "Banque qualifiee" : "Banque non qualifiee"; }
export function getHandLabel(hand: EvaluatedThreeCardHand): string { return hand.label; }
export function getAntePlayOutcomeLabel(outcome: string): string {
  switch (outcome) {
    case "dealer_not_qualified": return "Banque non qualifiee";
    case "player_win": return "Joueur gagnant";
    case "dealer_win": return "Banque gagnante";
    case "tie": return "Egalite";
    case "fold": return "Main abandonnee";
    default: return outcome;
  }
}
