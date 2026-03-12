"use client";

import { DEMO_PROGRESS, DEMO_SESSIONS } from "@/lib/constants";
import { getAppMode } from "@/lib/config";

function shouldUseDemoApi() {
  return getAppMode() === "demo";
}

async function requestJson(url, options = {}, fallback = null) {
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(options.headers || {}),
      },
      cache: "no-store",
    });

    const data = await response.json();
    if (!response.ok) {
      return { ok: false, error: data?.error || "Erreur serveur", data: fallback };
    }

    return { ok: true, error: null, data };
  } catch (error) {
    return { ok: false, error: error?.message || "Erreur reseau", data: fallback };
  }
}

export async function saveSession(payload) {
  if (shouldUseDemoApi()) {
    return { ok: true, data: { success: true, session: payload, xp_gained: 0, demo: true } };
  }

  return requestJson("/api/sessions", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function updateProgress(payload) {
  if (shouldUseDemoApi()) {
    return { ok: true, data: { success: true, data: payload, demo: true } };
  }

  return requestJson("/api/progress", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function fetchProgress() {
  if (shouldUseDemoApi()) {
    return { ok: true, data: DEMO_PROGRESS };
  }

  return requestJson("/api/progress", {}, []);
}

export async function fetchSessions(limit = 20, game_id = null) {
  if (shouldUseDemoApi()) {
    return { ok: true, data: DEMO_SESSIONS.slice(0, limit) };
  }

  const query = new URLSearchParams({ limit: String(limit) });
  if (game_id) query.set("game_id", game_id);

  return requestJson(`/api/sessions?${query.toString()}`, {}, []);
}

export async function fetchSkills() {
  if (shouldUseDemoApi()) {
    return { ok: true, data: [] };
  }

  return requestJson("/api/skills", {}, []);
}

export async function fetchCertifications() {
  if (shouldUseDemoApi()) {
    return { ok: true, data: [] };
  }

  return requestJson("/api/certifications", {}, []);
}
