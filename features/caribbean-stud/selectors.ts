export function getDealerQualificationLabel(qualified: boolean): string {
  return qualified ? "Banque qualifiée" : "Banque non qualifiée";
}

export function getRoundOutcomeLabel(outcome: string): string {
  switch (outcome) {
    case "dealer_not_qualified":
      return "Banque non qualifiée";
    case "player_win":
      return "Joueur gagnant";
    case "dealer_win":
      return "Banque gagnante";
    case "tie":
      return "Égalité";
    case "fold":
      return "Abandon";
    default:
      return outcome;
  }
}
