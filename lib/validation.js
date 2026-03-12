import { GAME_IDS, TRAINING_MODES } from "@/lib/constants";

function clampNumber(value, { min = 0, max = 100000, fallback = 0 } = {}) {
  const num = Number(value);
  if (!Number.isFinite(num)) return fallback;
  return Math.min(max, Math.max(min, num));
}

function isPlainObject(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function safeJson(input, fallback) {
  try {
    return JSON.parse(JSON.stringify(input ?? fallback));
  } catch {
    return fallback;
  }
}

export function validateSessionPayload(body = {}) {
  const game_id = typeof body.game_id === "string" ? body.game_id.trim() : "";
  if (!GAME_IDS.includes(game_id)) {
    return { ok: false, error: "game_id invalide" };
  }

  const mode = typeof body.mode === "string" && TRAINING_MODES.includes(body.mode)
    ? body.mode
    : "simulation";

  const score = clampNumber(body.score, { min: 0, max: 1000, fallback: 0 });
  const accuracy = clampNumber(body.accuracy, { min: 0, max: 100, fallback: 0 });
  const duration_seconds = clampNumber(body.duration_seconds, { min: 0, max: 7200, fallback: 0 });
  const rounds_played = clampNumber(body.rounds_played, { min: 0, max: 1000, fallback: 0 });
  const rounds_correct = clampNumber(body.rounds_correct, { min: 0, max: rounds_played || 1000, fallback: 0 });

  const rawErrors = Array.isArray(body.errors) ? body.errors.slice(0, 25) : [];
  const errors = rawErrors.map((item) => String(item).slice(0, 120));
  const details = isPlainObject(body.details) ? safeJson(body.details, {}) : {};

  return {
    ok: true,
    value: {
      game_id,
      mode,
      score,
      accuracy,
      duration_seconds,
      rounds_played,
      rounds_correct,
      errors,
      details,
    },
  };
}

export function validateProgressPayload(body = {}) {
  const game_id = typeof body.game_id === "string" ? body.game_id.trim() : "";
  if (!GAME_IDS.includes(game_id)) {
    return { ok: false, error: "game_id invalide" };
  }

  const progress = clampNumber(body.progress, { min: 0, max: 100, fallback: 0 });
  const accuracy = clampNumber(body.accuracy, { min: 0, max: 100, fallback: 0 });
  const sessions_count = clampNumber(body.sessions_count, { min: 0, max: 5000, fallback: 0 });
  const best_streak = clampNumber(body.best_streak, { min: 0, max: 10000, fallback: 0 });

  return {
    ok: true,
    value: { game_id, progress, accuracy, sessions_count, best_streak },
  };
}

export function computeXpGain({ score, accuracy, rounds_correct, duration_seconds }) {
  const qualityBonus = accuracy >= 90 ? 20 : accuracy >= 80 ? 10 : 0;
  const speedBonus = duration_seconds > 0 && duration_seconds <= 600 ? 10 : 0;
  return Math.round(score * 0.12) + rounds_correct * 4 + qualityBonus + speedBonus;
}

export function computeProfileFromXp(xp = 0) {
  const safeXp = Math.max(0, Math.round(xp));
  const level = Math.floor(safeXp / 500) + 1;
  const rank = level >= 20 ? "Elite" : level >= 15 ? "Platinum" : level >= 10 ? "Gold" : level >= 5 ? "Silver" : "Bronze";
  return { xp: safeXp, level, rank };
}

export function computeCertification({ sessions_count = 0, progress = 0, accuracy = 0 } = {}) {
  if (sessions_count >= 60 && progress >= 85 && accuracy >= 92) return { certified: true, cert_level: "Gold" };
  if (sessions_count >= 25 && progress >= 55 && accuracy >= 85) return { certified: true, cert_level: "Silver" };
  if (sessions_count >= 8 && progress >= 25 && accuracy >= 75) return { certified: true, cert_level: "Bronze" };
  return { certified: false, cert_level: null };
}
