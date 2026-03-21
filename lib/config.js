export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
export const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
export const PUBLIC_SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "";

export function isSupabaseConfigured() {
  return Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);
}

export function getSupabaseConfigStatus() {
  if (SUPABASE_URL && SUPABASE_ANON_KEY) {
    return { configured: true, reason: null };
  }

  if (!SUPABASE_URL && !SUPABASE_ANON_KEY) {
    return {
      configured: false,
      reason: "Les variables NEXT_PUBLIC_SUPABASE_URL et NEXT_PUBLIC_SUPABASE_ANON_KEY sont absentes.",
    };
  }

  if (!SUPABASE_URL) {
    return {
      configured: false,
      reason: "La variable NEXT_PUBLIC_SUPABASE_URL est absente.",
    };
  }

  return {
    configured: false,
    reason: "La variable NEXT_PUBLIC_SUPABASE_ANON_KEY est absente.",
  };
}

export function isTutorConfigured() {
  return Boolean(process.env.ANTHROPIC_API_KEY);
}

export function getAppMode() {
  if (!isSupabaseConfigured()) return "demo";
  return process.env.NEXT_PUBLIC_APP_MODE || "live";
}

export function getLocalDevFallbackReason() {
  const status = getSupabaseConfigStatus();
  if (!status.configured) {
    return `${status.reason} L'application bascule automatiquement en mode local.`;
  }

  if (getAppMode() === "demo") {
    return "NEXT_PUBLIC_APP_MODE=demo force le mode local.";
  }

  return null;
}
