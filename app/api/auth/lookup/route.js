import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { isSupabaseConfigured } from "@/lib/config";

// Use service role to bypass RLS for username lookup
function getServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

export async function POST(request) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Non configure" }, { status: 500 });
  }

  const { username } = await request.json();
  if (!username || typeof username !== "string") {
    return NextResponse.json({ error: "Username requis" }, { status: 400 });
  }

  const adminClient = getServiceClient();
  if (!adminClient) {
    return NextResponse.json({ error: "Configuration serveur manquante" }, { status: 500 });
  }

  const { data, error } = await adminClient
    .from("profiles")
    .select("email")
    .eq("username", username.trim().toLowerCase())
    .single();

  if (error || !data) {
    return NextResponse.json({ email: null });
  }

  return NextResponse.json({ email: data.email });
}
