import {
  AVAILABLE_GAMES,
  CERTIFICATION_GAMES,
  DASHBOARD_GAMES,
  GAME_FAMILY_LABELS,
  getGameById,
  normalizeGameId,
} from "@/lib/game-registry";
import { SKILL_LABELS } from "@/lib/constants";

const EMPTY_PROGRESS = Object.freeze({
  progress: 0,
  accuracy: 0,
  sessions_count: 0,
  best_streak: 0,
  certified: false,
  cert_level: null,
  unlocked: false,
});

const SKILL_CARD_NOTES = {
  rules_knowledge: "lecture des regles et justesse de procedure",
  sequencing: "enchainement des actions sans rupture",
  payout_calculation: "fiabilite sur les paiements et controles",
  speed: "exposition cumulative aux situations de table",
};

const CERTIFICATION_TRACKS = [
  {
    id: "bronze",
    name: "Bronze",
    color: "#CD7F32",
    tagline: "Bases installees",
    description: "Socle procedurel sur les jeux classiques et premieres repetitions stabilisees.",
    gameIds: ["roulette", "blackjack", "baccarat"],
    minGameProgress: 20,
    minTotalSessions: 8,
    minAverageAccuracy: 70,
    minCertifiedGames: 0,
    criticalSkills: ["rules_knowledge", "sequencing"],
    minCriticalSkillScore: 35,
  },
  {
    id: "silver",
    name: "Silver",
    color: "#C0C0C0",
    tagline: "Autonomie encadree",
    description: "Les tables classiques tiennent avec plus de regularite et les premieres tables poker-casino sont engagees.",
    gameIds: ["roulette", "blackjack", "baccarat", "three-card-poker"],
    minGameProgress: 45,
    minTotalSessions: 24,
    minAverageAccuracy: 78,
    minCertifiedGames: 2,
    criticalSkills: ["rules_knowledge", "sequencing", "payout_calculation"],
    minCriticalSkillScore: 55,
  },
  {
    id: "gold",
    name: "Gold",
    color: "#C9A84C",
    tagline: "Pret pour la table",
    description: "La plateforme attend une tenue plus stable sur les jeux principaux et une lecture solide des paiements.",
    gameIds: AVAILABLE_GAMES.map((game) => game.id),
    minGameProgress: 65,
    minTotalSessions: 60,
    minAverageAccuracy: 85,
    minCertifiedGames: 4,
    criticalSkills: ["rules_knowledge", "sequencing", "payout_calculation", "speed"],
    minCriticalSkillScore: 70,
  },
  {
    id: "platinum",
    name: "Platinum",
    color: "#E5E4E2",
    tagline: "Jeux complexes et densite de table",
    description: "Le niveau vise la polyvalence sur toutes les tables ouvertes et une execution plus dense.",
    gameIds: AVAILABLE_GAMES.map((game) => game.id),
    minGameProgress: 80,
    minTotalSessions: 100,
    minAverageAccuracy: 90,
    minCertifiedGames: 6,
    criticalSkills: ["rules_knowledge", "sequencing", "payout_calculation", "speed"],
    minCriticalSkillScore: 82,
  },
  {
    id: "elite",
    name: "Elite",
    color: "#FFD700",
    tagline: "Reference multi-jeux",
    description: "La cible haute combine volume, precision et regularite sur tout le spectre de jeux disponibles.",
    gameIds: AVAILABLE_GAMES.map((game) => game.id),
    minGameProgress: 90,
    minTotalSessions: 140,
    minAverageAccuracy: 94,
    minCertifiedGames: AVAILABLE_GAMES.length,
    criticalSkills: ["rules_knowledge", "sequencing", "payout_calculation", "speed"],
    minCriticalSkillScore: 90,
  },
];

function clamp(value, min = 0, max = 100) {
  return Math.min(max, Math.max(min, value));
}

function toPercent(current, target) {
  if (!target || target <= 0) return 100;
  return clamp(Math.round((current / target) * 100));
}

function average(values) {
  if (!values.length) return 0;
  return Math.round(values.reduce((sum, value) => sum + value, 0) / values.length);
}

function buildProgressMap(progressRecords = []) {
  return normalizeProgressRecords(progressRecords).reduce((map, record) => {
    const existing = map.get(record.game_id);
    if (!existing) {
      map.set(record.game_id, record);
      return map;
    }

    map.set(record.game_id, {
      ...existing,
      ...record,
      progress: Math.max(existing.progress || 0, record.progress || 0),
      accuracy: Math.max(existing.accuracy || 0, record.accuracy || 0),
      sessions_count: Math.max(existing.sessions_count || 0, record.sessions_count || 0),
      best_streak: Math.max(existing.best_streak || 0, record.best_streak || 0),
      certified: Boolean(existing.certified || record.certified),
      cert_level: record.cert_level || existing.cert_level || null,
      unlocked: Boolean(existing.unlocked || record.unlocked),
    });

    return map;
  }, new Map());
}

function buildSkillMap(skillRecords = []) {
  return new Map(
    (Array.isArray(skillRecords) ? skillRecords : [])
      .filter((record) => record?.skill_name)
      .map((record) => [record.skill_name, record])
  );
}

function getTotalSessionsFromProgress(progressRecords = []) {
  return normalizeProgressRecords(progressRecords).reduce(
    (sum, record) => sum + (record.sessions_count || 0),
    0
  );
}

export function normalizeProgressRecords(progressRecords = []) {
  if (!Array.isArray(progressRecords)) return [];

  return progressRecords
    .map((record) => {
      const normalizedId = normalizeGameId(record?.game_id);
      if (!normalizedId) return null;

      return {
        ...record,
        game_id: normalizedId,
      };
    })
    .filter(Boolean);
}

export function normalizeSessionRecords(sessionRecords = []) {
  if (!Array.isArray(sessionRecords)) return [];

  return sessionRecords
    .map((record) => {
      const normalizedId = normalizeGameId(record?.game_id);
      if (!normalizedId) return null;

      return {
        ...record,
        game_id: normalizedId,
      };
    })
    .filter(Boolean);
}

export function buildDashboardGames(progressRecords = []) {
  const progressMap = buildProgressMap(progressRecords);

  return DASHBOARD_GAMES.map((game) => ({
    ...game,
    name: game.shortName,
    familyLabel: GAME_FAMILY_LABELS[game.family],
    href: game.route,
    ...EMPTY_PROGRESS,
    ...(progressMap.get(game.id) || {}),
  }));
}

export function buildSkillCards({
  skillRecords = [],
  progressRecords = [],
  sessionRecords = [],
} = {}) {
  const progress = normalizeProgressRecords(progressRecords);
  const sessions = normalizeSessionRecords(sessionRecords);
  const skillMap = buildSkillMap(skillRecords);
  const averageAccuracy = average(
    progress.filter((item) => item.accuracy > 0).map((item) => Math.round(item.accuracy))
  );
  const averageProgress = average(progress.map((item) => item.progress || 0));
  const totalSessions = sessions.length || getTotalSessionsFromProgress(progress);
  const topStreak = progress.reduce(
    (best, item) => Math.max(best, item.best_streak || 0),
    0
  );

  return ["rules_knowledge", "sequencing", "payout_calculation", "speed"].map((key) => {
    const persistedScore = Number(skillMap.get(key)?.score || 0);
    const computedScore = key === "rules_knowledge"
      ? clamp(Math.round((averageAccuracy * 0.65) + (averageProgress * 0.35)))
      : key === "sequencing"
        ? clamp(Math.round((averageAccuracy * 0.4) + (averageProgress * 0.3) + (topStreak * 4)))
        : key === "payout_calculation"
          ? clamp(Math.round((averageAccuracy * 0.7) + (topStreak * 3)))
          : clamp(Math.round(Math.min(100, totalSessions * 4.5)));

    return {
      key,
      label: SKILL_LABELS[key],
      score: persistedScore > 0 ? persistedScore : computedScore,
      note: SKILL_CARD_NOTES[key],
      source: persistedScore > 0 ? "supabase" : "derived",
    };
  });
}

export function buildCertificationSnapshot({
  progressRecords = [],
  sessionRecords = [],
  skillRecords = [],
  certificationRecords = [],
} = {}) {
  const progress = normalizeProgressRecords(progressRecords);
  const sessions = normalizeSessionRecords(sessionRecords);
  const skillMap = buildSkillMap(skillRecords);
  const earnedCertifications = Array.isArray(certificationRecords)
    ? certificationRecords.filter((record) => !record?.game_id && record?.cert_level)
    : [];

  const totalSessions = sessions.length || getTotalSessionsFromProgress(progress);
  const averageAccuracy = average(
    progress.filter((item) => item.accuracy > 0).map((item) => Math.round(item.accuracy))
  );
  const progressMap = buildProgressMap(progress);
  const certifiedGames = progress.filter((item) => item.certified).length;

  const levels = CERTIFICATION_TRACKS.map((track) => {
    const requiredGames = track.gameIds
      .map((gameId) => getGameById(gameId))
      .filter(Boolean);
    const readyGames = requiredGames.filter((game) => {
      const item = progressMap.get(game.id);
      return item && ((item.progress || 0) >= track.minGameProgress || item.certified);
    }).length;
    const criticalSkillValues = track.criticalSkills.map(
      (skillKey) => Number(skillMap.get(skillKey)?.score || 0)
    );
    const averageCriticalSkill = average(criticalSkillValues);
    const recordedCertification = earnedCertifications.find(
      (record) => String(record.cert_level).toLowerCase() === track.id
    );

    const requirementItems = [
      {
        label: `${readyGames}/${requiredGames.length} jeux cibles engages au niveau attendu`,
        ratio: toPercent(readyGames, requiredGames.length),
      },
      {
        label: `${totalSessions}/${track.minTotalSessions} sessions utiles cumulees`,
        ratio: toPercent(totalSessions, track.minTotalSessions),
      },
      {
        label: `${averageAccuracy}% de precision moyenne ciblee`,
        ratio: toPercent(averageAccuracy, track.minAverageAccuracy),
      },
      {
        label: track.minCertifiedGames > 0
          ? `${certifiedGames}/${track.minCertifiedGames} jeux deja certifies`
          : "Premiers standards de certification prets a etre evalues",
        ratio: track.minCertifiedGames > 0 ? toPercent(certifiedGames, track.minCertifiedGames) : 100,
      },
      {
        label: `${averageCriticalSkill}% sur les competences critiques`,
        ratio: toPercent(averageCriticalSkill, track.minCriticalSkillScore),
      },
    ];

    const progressValue = average(requirementItems.map((item) => item.ratio));
    const achieved = Boolean(recordedCertification) || requirementItems.every((item) => item.ratio >= 100);
    const completedRequirements = requirementItems.filter((item) => item.ratio >= 100).length;

    return {
      ...track,
      achieved,
      progress: achieved ? 100 : progressValue,
      date: recordedCertification?.earned_at || null,
      stats: {
        accuracy: averageAccuracy,
        sessions: totalSessions,
        certifiedGames,
        criticalSkillScore: averageCriticalSkill,
      },
      requirements: requirementItems.map((item) => item.label),
      completedRequirements,
      requirementRatios: requirementItems.map((item) => item.ratio),
      gameIds: requiredGames.map((game) => game.id),
    };
  });

  const achievedLevels = levels.filter((level) => level.achieved).length;
  const currentLevel = levels.find((level) => !level.achieved) || levels[levels.length - 1];

  return {
    levels,
    achievedLevels,
    currentLevelId: currentLevel.id,
    activeGames: CERTIFICATION_GAMES.length,
  };
}
