import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { isSupabaseConfigured } from "@/lib/config";
import { computeCertification, computeProfileFromXp, computeXpGain, validateProgressPayload, validateSessionPayload } from "@/lib/validation";

function unauthorized() { return NextResponse.json({ error: "Authentification requise" }, { status: 401 }); }

export async function GET(request) {
  if (!isSupabaseConfigured()) return NextResponse.json([]);
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return unauthorized();
  const { searchParams } = new URL(request.url);
  const limit = Math.min(Math.max(parseInt(searchParams.get("limit") || "20", 10), 1), 50);
  const gameId = searchParams.get("game_id");
  let query = supabase.from("training_sessions").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(limit);
  if (gameId) query = query.eq("game_id", gameId);
  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data || []);
}

export async function POST(request) {
  if (!isSupabaseConfigured()) return NextResponse.json({ success: true, demo: true, xp_gained: 0 });
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return unauthorized();
  const body = await request.json();
  const validation = validateSessionPayload(body);
  if (!validation.ok) return NextResponse.json({ error: validation.error }, { status: 400 });
  const payload = validation.value;
  const createdAt = new Date().toISOString();
  const { data: session, error: sessionError } = await supabase.from("training_sessions").insert({ user_id: user.id, ...payload, created_at: createdAt }).select().single();
  if (sessionError) return NextResponse.json({ error: sessionError.message }, { status: 500 });
  const xpGained = computeXpGain(payload);
  const { data: profile } = await supabase.from("profiles").select("xp").eq("id", user.id).single();
  if (profile) {
    const derived = computeProfileFromXp((profile.xp || 0) + xpGained);
    await supabase.from("profiles").update({ ...derived, last_active_at: createdAt, updated_at: createdAt }).eq("id", user.id);
  }
  const { data: existing } = await supabase.from("game_progress").select("progress, accuracy, sessions_count, best_streak").eq("user_id", user.id).eq("game_id", payload.game_id).single();
  const sc = (existing?.sessions_count || 0) + 1;
  const aa = Math.round((((existing?.accuracy || 0) * (sc - 1)) + payload.accuracy) / sc);
  const np = Math.min(100, Math.max(existing?.progress || 0, Math.round((payload.accuracy * 0.6) + Math.min(sc * 3, 30))));
  const bs = Math.max(existing?.best_streak || 0, payload.rounds_correct || 0);
  const progressPayload = { game_id: payload.game_id, progress: np, accuracy: aa, sessions_count: sc, best_streak: bs };
  const certification = computeCertification(progressPayload);
  await supabase.from("game_progress").upsert({ user_id: user.id, game_id: payload.game_id, progress: np, accuracy: aa, sessions_count: sc, best_streak: bs, total_score: Math.round(np * sc), certified: certification.certified, cert_level: certification.cert_level, unlocked: true, updated_at: createdAt }, { onConflict: "user_id,game_id" }).catch(() => null);
  if (certification.certified && certification.cert_level) { await supabase.from("certifications").upsert({ user_id: user.id, cert_level: certification.cert_level, game_id: payload.game_id, earned_at: createdAt, exam_score: aa }, { onConflict: "user_id,cert_level,game_id" }).catch(() => null); }
  return NextResponse.json({ success: true, session, xp_gained: xpGained });
}
