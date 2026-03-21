import { PUBLIC_SITE_URL } from "@/lib/config";

export const AUTH_BOOT_TIMEOUT_MS = 8000;

export function sanitizeAuthRedirect(value, fallback = "/dashboard") {
  if (!value || typeof value !== "string") return fallback;
  if (!value.startsWith("/")) return fallback;
  if (value.startsWith("//")) return fallback;
  if (value.startsWith("/auth/callback")) return fallback;
  return value;
}

function sanitizeOrigin(value) {
  if (!value || typeof value !== "string") return "";

  try {
    return new URL(value).origin;
  } catch {
    return "";
  }
}

export function buildEmailRedirectUrl(next = "/dashboard", origin = "") {
  const safeNext = sanitizeAuthRedirect(next);
  const baseOrigin = sanitizeOrigin(PUBLIC_SITE_URL) || sanitizeOrigin(origin);

  if (!baseOrigin) return null;

  return `${baseOrigin}/auth/callback?next=${encodeURIComponent(safeNext)}`;
}

export function getSupabaseAuthErrorMessage(error, context = "default") {
  const fallback =
    context === "register"
      ? "L'inscription n'a pas pu etre finalisee."
      : context === "login"
        ? "La connexion n'a pas pu etre finalisee."
        : "Impossible de finaliser l'authentification.";
  const message = String(error?.message || "").trim();
  const normalizedMessage = message.toLowerCase();
  const code = String(error?.code || "").toLowerCase();
  const status = Number(error?.status || 0);

  if (
    status === 429 ||
    code.includes("rate_limit") ||
    normalizedMessage.includes("rate limit") ||
    normalizedMessage.includes("security purposes")
  ) {
    return context === "register"
      ? "Supabase bloque temporairement l'inscription. Attends environ 60 secondes avant de reessayer. Si cela arrive souvent, augmente les limites email/auth dans Supabase."
      : "Supabase bloque temporairement la connexion apres trop de tentatives. Attends un peu avant de reessayer.";
  }

  if (code === "email_address_not_authorized" || normalizedMessage.includes("email address not authorized")) {
    return "Cette adresse email est refusee par Supabase. Avec le SMTP par defaut, seuls certains emails sont acceptes. Configure un SMTP personnalise dans Supabase Auth > Email.";
  }

  if (code === "email_provider_disabled" || normalizedMessage.includes("email provider is disabled")) {
    return "Le provider Email n'est pas active dans Supabase Auth. Active Email dans Authentication > Providers.";
  }

  if (code === "user_already_exists" || normalizedMessage.includes("user already registered")) {
    return "Un compte existe deja avec cette adresse email. Connecte-toi ou reinitialise le mot de passe.";
  }

  if (normalizedMessage.includes("invalid login credentials")) {
    return "Adresse email ou mot de passe incorrect.";
  }

  if (
    normalizedMessage.includes("redirect") ||
    normalizedMessage.includes("redirect url") ||
    normalizedMessage.includes("email link is invalid")
  ) {
    return "L'URL de retour d'authentification n'est pas acceptee par Supabase. Ajoute ton domaine et /auth/callback dans Authentication > URL Configuration.";
  }

  if (normalizedMessage.includes("password should be at least")) {
    return "Le mot de passe doit contenir au moins 6 caracteres.";
  }

  return message || fallback;
}

export function getAuthErrorMessage(code, fallback = "Impossible de finaliser la connexion.") {
  switch (code) {
    case "auth":
      return "La connexion n'a pas pu etre finalisee. Reessaie depuis l'ecran de connexion.";
    case "auth_unavailable":
      return "Le service d'authentification est indisponible. L'espace membre reste verrouille tant que la configuration n'est pas complete.";
    case "callback_failed":
      return "Le retour de connexion a echoue. Reessaie depuis l'ecran de connexion.";
    default:
      return fallback;
  }
}
