import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { isSupabaseConfigured } from "@/lib/config";

export async function POST(request) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Non configure" }, { status: 500 });
  }

  const { username } = await request.json();
  if (!username || typeof username !== "string") {
    return NextResponse.json({ error: "Username requis" }, { status: 400 });
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    return NextResponse.json({ error: "Configuration manquante" }, { status: 500 });
  }

  // Use anon client + RPC function (SECURITY DEFINER, no service role needed)
  const supabase = createClient(url, anonKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data, error } = await supabase.rpc("get_email_by_username", {
    lookup_username: username.trim().toLowerCase(),
  });

  if (error || !data) {
    return NextResponse.json({ email: null });
  }

  return NextResponse.json({ email: data });
}
