import { createServerClient } from "@supabase/ssr";
import { NextResponse } from "next/server";
import { isSupabaseConfigured, SUPABASE_ANON_KEY, SUPABASE_URL } from "@/lib/config";
import { sanitizeAuthRedirect } from "@/lib/auth-utils";
import { buildLoginHref, isAuthRoute, isPrivateRoute } from "@/lib/platform-access";

function createLoginRedirect(request, pathname, errorCode = null) {
  const redirectPath = sanitizeAuthRedirect(`${pathname}${request.nextUrl.search}`);
  const loginUrl = new URL(buildLoginHref(redirectPath), request.url);

  if (errorCode) {
    loginUrl.searchParams.set("error", errorCode);
  }

  return loginUrl;
}

export async function middleware(request) {
  const pathname = request.nextUrl.pathname;
  const isProtected = isPrivateRoute(pathname);
  const isAdminRoute = pathname === "/admin" || pathname.startsWith("/admin/");
  const isAuthPage = isAuthRoute(pathname);
  const isCallbackRoute = pathname.startsWith("/auth/callback");

  if (!isSupabaseConfigured()) {
    if (isProtected) {
      return NextResponse.redirect(createLoginRedirect(request, pathname, "auth_unavailable"));
    }
    return NextResponse.next();
  }

  let response = NextResponse.next({ request: { headers: request.headers } });

  try {
    const supabase = createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      cookies: {
        get(name) {
          return request.cookies.get(name)?.value;
        },
        set(name, value, options) {
          response.cookies.set({ name, value, ...options });
        },
        remove(name, options) {
          response.cookies.set({
            name,
            value: "",
            ...options,
            expires: new Date(0),
            maxAge: 0,
          });
        },
      },
    });

    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error) {
      throw error;
    }

    if (isProtected && !user) {
      return NextResponse.redirect(createLoginRedirect(request, pathname));
    }

    // Admin route: check role in profiles table
    if (isAdminRoute && user) {
      let isAdmin = false;

      // Try service role client first (bypasses RLS, most reliable)
      const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
      if (serviceKey) {
        const { createClient: createServiceClient } = await import("@supabase/supabase-js");
        const adminClient = createServiceClient(SUPABASE_URL, serviceKey, {
          auth: { autoRefreshToken: false, persistSession: false },
        });
        const { data: profile } = await adminClient
          .from("profiles")
          .select("role")
          .eq("id", user.id)
          .single();
        isAdmin = profile?.role === "admin";
      } else {
        // Fallback: use user session (requires RLS to allow reading own profile)
        const { data: profile } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", user.id)
          .single();
        isAdmin = profile?.role === "admin";
      }

      if (!isAdmin) {
        return NextResponse.redirect(new URL("/dashboard", request.url));
      }
    }

    if (user && isAuthPage && !isCallbackRoute) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }

    return response;
  } catch (_error) {
    if (isProtected) {
      return NextResponse.redirect(createLoginRedirect(request, pathname, "auth_unavailable"));
    }
    return response;
  }
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
