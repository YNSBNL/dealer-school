import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { isSupabaseConfigured } from "@/lib/config";
import { sanitizeAuthRedirect } from "@/lib/auth-utils";

export async function GET(request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = sanitizeAuthRedirect(searchParams.get("next") ?? "/dashboard");

  if (!isSupabaseConfigured()) {
    return NextResponse.redirect(`${origin}${next}`);
  }

  try {
    if (code) {
      const supabase = createClient();
      if (!supabase) {
        return NextResponse.redirect(`${origin}${next}`);
      }

      const { error } = await supabase.auth.exchangeCodeForSession(code);
      if (!error) {
        return NextResponse.redirect(`${origin}${next}`);
      }
    }
  } catch (_error) {
    const loginUrl = new URL("/auth/login", origin);
    loginUrl.searchParams.set("error", "callback_failed");
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.redirect(`${origin}/auth/login?error=auth`);
}
