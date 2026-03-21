import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { isSupabaseConfigured } from "@/lib/config";
import { computeCertification, validateProgressPayload } from "@/lib/validation";

function unauthorized() { return NextResponse.json({ error: "Authentification requise" }, { status: 401 }); }

export async function GET() {
  if (!isSupabaseConfigured()) return NextResponse.json([]);
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return unauthorized();
  const { data, error } = await supabase.from("game_progress").select("*").eq("user_id", user.id).order("game_id");
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data || []);
}

export async function POST(request) {
  if (!isSupabaseConfigured()) return NextResponse.json({ success: true, demo: true });
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return unauthorized();
  const body = await request.json();
  const validation = validateProgressPayload(body);
  if (!validation.ok) return NextResponse.json({ error: validation.error }, { status: 400 });
  const payload = validation.value;
  const createdAt = new Date().toISOString();
  const certification = computeCertification(payload);
  const { data, error } = await supabase.from("game_progress").upsert({ user_id: user.id, game_id: payload.game_id, progress: payload.progress, accuracy: payload.accuracy, sessions_count: payload.sessions_count, best_streak: payload.best_streak, total_score: Math.round(payload.progress * payload.sessions_count), certified: certification.certified, cert_level: certification.cert_level, unlocked: true, updated_at: createdAt }, { onConflict: "user_id,game_id" }).select();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (certification.certified && certification.cert_level) { await supabase.from("certifications").upsert({ user_id: user.id, cert_level: certification.cert_level, game_id: payload.game_id, earned_at: createdAt, exam_score: payload.accuracy }, { onConflict: "user_id,cert_level,game_id" }); }
  return NextResponse.json({ success: true, data, certification });
}
