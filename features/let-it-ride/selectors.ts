export function getPullDecisionLabel(canPull: boolean): string { return canPull ? "Retrait autorise" : "Retrait impossible"; }
export function getQualificationLabel(qualifies: boolean): string { return qualifies ? "Main qualifiante" : "Main non qualifiante"; }
