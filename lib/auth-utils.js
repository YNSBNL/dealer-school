export const AUTH_BOOT_TIMEOUT_MS = 8000;

export function sanitizeAuthRedirect(value, fallback = "/dashboard") {
  if (!value || typeof value !== "string") return fallback;
  if (!value.startsWith("/")) return fallback;
  if (value.startsWith("//")) return fallback;
  if (value.startsWith("/auth/callback")) return fallback;
  return value;
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
