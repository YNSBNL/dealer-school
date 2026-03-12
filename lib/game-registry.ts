export type GameId =
  | "roulette"
  | "blackjack"
  | "baccarat"
  | "ultimate-texas"
  | "three-card-poker"
  | "caribbean-stud"
  | "casino-holdem"
  | "let-it-ride";

export type GameFamily = "classiques" | "poker-casino";
export type GameAvailability = "available" | "beta" | "coming-soon";

export interface GameRegistryItem {
  id: GameId;
  slug: string;
  name: string;
  shortName: string;
  family: GameFamily;
  icon: string;
  difficulty: number;
  availability: GameAvailability;
  route: string;
  description: string;
  tagline: string;
  visibleInCatalogue: boolean;
  visibleInDashboard: boolean;
  visibleInLanding: boolean;
  visibleInCertification: boolean;
}

export const GAME_REGISTRY: GameRegistryItem[] = [
  {
    id: "roulette",
    slug: "roulette",
    name: "Roulette Anglaise",
    shortName: "Roulette",
    family: "classiques",
    icon: "RT",
    difficulty: 2,
    availability: "available",
    route: "/simulateur/roulette",
    description: "Annonces, paiements et resolution complete d'un coup de roulette.",
    tagline: "Le fondamental du metier",
    visibleInCatalogue: true,
    visibleInDashboard: true,
    visibleInLanding: true,
    visibleInCertification: true,
  },
  {
    id: "blackjack",
    slug: "blackjack",
    name: "Blackjack",
    shortName: "Blackjack",
    family: "classiques",
    icon: "BJ",
    difficulty: 2,
    availability: "available",
    route: "/simulateur/blackjack",
    description: "Distribution, decisions joueurs, regles dealer et paiements.",
    tagline: "Hit, stand, double, split",
    visibleInCatalogue: true,
    visibleInDashboard: true,
    visibleInLanding: true,
    visibleInCertification: true,
  },
  {
    id: "baccarat",
    slug: "baccarat",
    name: "Baccarat",
    shortName: "Baccarat",
    family: "classiques",
    icon: "BA",
    difficulty: 3,
    availability: "available",
    route: "/simulateur/baccarat",
    description: "Naturels, troisieme carte, rythme de table et resolution.",
    tagline: "Precision et cadence",
    visibleInCatalogue: true,
    visibleInDashboard: true,
    visibleInLanding: true,
    visibleInCertification: true,
  },
  {
    id: "ultimate-texas",
    slug: "ultimate-texas",
    name: "Ultimate Texas Hold'em",
    shortName: "Ultimate Texas",
    family: "poker-casino",
    icon: "UTH",
    difficulty: 3,
    availability: "available",
    route: "/simulateur/ultimate-texas",
    description: "Blind, ante, trips, decisions de mise et showdown.",
    tagline: "Le poker casino phare",
    visibleInCatalogue: true,
    visibleInDashboard: true,
    visibleInLanding: true,
    visibleInCertification: true,
  },
  {
    id: "three-card-poker",
    slug: "three-card-poker",
    name: "Three Card Poker",
    shortName: "Three Card Poker",
    family: "poker-casino",
    icon: "3CP",
    difficulty: 2,
    availability: "available",
    route: "/simulateur/three-card-poker",
    description: "Ante/play, pair plus et qualification du dealer.",
    tagline: "Procedure simple, resolution rigoureuse",
    visibleInCatalogue: true,
    visibleInDashboard: true,
    visibleInLanding: true,
    visibleInCertification: true,
  },
  {
    id: "caribbean-stud",
    slug: "caribbean-stud",
    name: "Caribbean Stud",
    shortName: "Caribbean Stud",
    family: "poker-casino",
    icon: "CS",
    difficulty: 2,
    availability: "available",
    route: "/simulateur/caribbean-stud",
    description: "Qualification du dealer, raise et paiements selon paytable.",
    tagline: "Cinq cartes contre la maison",
    visibleInCatalogue: true,
    visibleInDashboard: true,
    visibleInLanding: true,
    visibleInCertification: true,
  },
  {
    id: "casino-holdem",
    slug: "casino-holdem",
    name: "Casino Hold'em",
    shortName: "Casino Hold'em",
    family: "poker-casino",
    icon: "CH",
    difficulty: 3,
    availability: "available",
    route: "/simulateur/casino-holdem",
    description: "Ante/call, flop visible et qualification pair of 4s+.",
    tagline: "Hold'em contre le dealer",
    visibleInCatalogue: true,
    visibleInDashboard: true,
    visibleInLanding: true,
    visibleInCertification: true,
  },
  {
    id: "let-it-ride",
    slug: "let-it-ride",
    name: "Let It Ride",
    shortName: "Let It Ride",
    family: "poker-casino",
    icon: "LIR",
    difficulty: 2,
    availability: "available",
    route: "/simulateur/let-it-ride",
    description: "Trois mises initiales, retraits progressifs et paytable finale.",
    tagline: "Lecture de main et gestion des mises",
    visibleInCatalogue: true,
    visibleInDashboard: true,
    visibleInLanding: true,
    visibleInCertification: true,
  },
];

export const GAME_FAMILY_LABELS: Record<GameFamily, string> = {
  classiques: "Classiques casino",
  "poker-casino": "Poker casino",
};

export const GAME_AVAILABILITY_LABELS: Record<GameAvailability, string> = {
  available: "Disponible",
  beta: "Beta",
  "coming-soon": "Bientot",
};

export const GAME_ID_ALIASES: Record<string, GameId> = {
  ultimate: "ultimate-texas",
  "ultimate-texas-holdem": "ultimate-texas",
  threecard: "three-card-poker",
  caribbean: "caribbean-stud",
  holdem: "casino-holdem",
};

export const GAME_IDS = GAME_REGISTRY.map((game) => game.id);
export const AVAILABLE_GAMES = GAME_REGISTRY.filter(
  (game) => game.availability === "available" || game.availability === "beta"
);
export const CATALOGUE_GAMES = GAME_REGISTRY.filter((game) => game.visibleInCatalogue);
export const DASHBOARD_GAMES = GAME_REGISTRY.filter((game) => game.visibleInDashboard);
export const LANDING_GAMES = GAME_REGISTRY.filter((game) => game.visibleInLanding);
export const CERTIFICATION_GAMES = GAME_REGISTRY.filter((game) => game.visibleInCertification);

export function normalizeGameId(id: string): GameId | null {
  if (GAME_IDS.includes(id as GameId)) {
    return id as GameId;
  }

  return GAME_ID_ALIASES[id] || null;
}

export function getGameById(id: string) {
  const normalizedId = normalizeGameId(id);
  return normalizedId ? GAME_REGISTRY.find((game) => game.id === normalizedId) || null : null;
}

export function getGameBySlug(slug: string) {
  return GAME_REGISTRY.find((game) => game.slug === slug) || null;
}
