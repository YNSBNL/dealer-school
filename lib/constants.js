import { AVAILABLE_GAMES, GAME_IDS, normalizeGameId } from "@/lib/game-registry";

export { GAME_IDS };

export const MODE_LABELS = {
  decouverte: "Decouverte",
  guidee: "Table guidee",
  simulation: "Simulation",
  examen: "Examen",
  incidents: "Incidents",
  custom: "Casino custom",
};

export const TRAINING_MODES = Object.keys(MODE_LABELS);

export const SKILL_LABELS = {
  rules_knowledge: "Connaissance des regles",
  sequencing: "Sequencage operatoire",
  voice_clarity: "Annonces vocales",
  payout_calculation: "Calcul paiements",
  incident_handling: "Gestion incidents",
  speed: "Rapidite",
  procedure_compliance: "Conformite procedure",
  professional_presence: "Presence professionnelle",
};

export const CERTIFICATION_LEVELS = ["Bronze", "Silver", "Gold", "Platinum", "Elite"];

export const DEMO_PROFILE = {
  display_name: "Mode demo",
  email: "demo@dealer-school.com",
  level: 1,
  xp: 0,
  rank: "Bronze",
  streak_days: 0,
};

export const DEMO_PROGRESS = AVAILABLE_GAMES.map((game) => ({
  user_id: "demo",
  game_id: game.id,
  progress: game.id === "roulette" ? 24 : game.id === "blackjack" ? 12 : game.id === "baccarat" ? 9 : 0,
  accuracy: game.id === "roulette" ? 83 : game.id === "blackjack" ? 76 : game.id === "baccarat" ? 71 : 0,
  sessions_count: game.id === "roulette" ? 5 : game.id === "blackjack" ? 2 : game.id === "baccarat" ? 1 : 0,
  best_streak: game.id === "roulette" ? 4 : game.id === "blackjack" ? 2 : game.id === "baccarat" ? 1 : 0,
  certified: false,
  cert_level: null,
  unlocked: true,
}));

export const DEMO_SESSIONS = [
  {
    id: "demo-1",
    game_id: "roulette",
    mode: "simulation",
    score: 88,
    accuracy: 88,
    duration_seconds: 720,
    rounds_played: 12,
    rounds_correct: 10,
    created_at: new Date().toISOString(),
  },
  {
    id: "demo-2",
    game_id: "blackjack",
    mode: "guidee",
    score: 74,
    accuracy: 74,
    duration_seconds: 540,
    rounds_played: 8,
    rounds_correct: 6,
    created_at: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    id: "demo-3",
    game_id: "three-card-poker",
    mode: "guidee",
    score: 68,
    accuracy: 68,
    duration_seconds: 420,
    rounds_played: 6,
    rounds_correct: 4,
    created_at: new Date(Date.now() - 43200000).toISOString(),
  },
];

export function normalizeSessionGameId(id) {
  return normalizeGameId(id) || id;
}
