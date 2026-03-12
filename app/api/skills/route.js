import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { isSupabaseConfigured } from "@/lib/config";

function unauthorized() {
  return NextResponse.json({ error: "Authentification requise" }, { status: 401 });
}

export async function GET() {
  if (!isSupabaseConfigured()) {
    return NextResponse.json([]);
  }

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return unauthorized();

  const { data, error } = await supabase
    .from("user_skills")
    .select("*")
    .eq("user_id", user.id)
    .order("skill_name");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data || []);
}
