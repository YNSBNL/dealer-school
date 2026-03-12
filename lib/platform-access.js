import { sanitizeAuthRedirect } from "@/lib/auth-utils";

export const PUBLIC_ROUTE_PATHS = [
  "/",
  "/catalogue",
  "/auth/login",
  "/auth/register",
  "/auth/callback",
];

export const PRIVATE_ROUTE_PREFIXES = [
  "/dashboard",
  "/profil",
  "/tuteur",
  "/certification",
  "/simulateur",
];

export function isPrivateRoute(pathname = "") {
  return PRIVATE_ROUTE_PREFIXES.some((route) => pathname === route || pathname.startsWith(`${route}/`));
}

export function isAuthRoute(pathname = "") {
  return pathname === "/auth/login" || pathname === "/auth/register" || pathname.startsWith("/auth/");
}

export function buildLoginHref(redirect = "/dashboard") {
  const safeRedirect = sanitizeAuthRedirect(redirect);
  return safeRedirect === "/dashboard"
    ? "/auth/login"
    : `/auth/login?redirect=${encodeURIComponent(safeRedirect)}`;
}

export function buildRegisterHref(redirect = "/dashboard") {
  const safeRedirect = sanitizeAuthRedirect(redirect);
  return safeRedirect === "/dashboard"
    ? "/auth/register"
    : `/auth/register?redirect=${encodeURIComponent(safeRedirect)}`;
}

export function buildProtectedHref(isAuthenticated, route) {
  return isAuthenticated ? route : buildLoginHref(route);
}
