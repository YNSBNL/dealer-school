export function getOutcomeLabel(outcome: string): string {
  switch (outcome) {
    case "dealer_not_qualified": return "Banque non qualifiee";
    case "player_win": return "Joueur gagnant";
    case "dealer_win": return "Banque gagnante";
    case "tie": return "Egalite";
    default: return outcome;
  }
}
