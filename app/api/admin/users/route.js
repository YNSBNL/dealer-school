import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { isSupabaseConfigured } from "@/lib/config";

function unauthorized() {
  return NextResponse.json({ error: "Acces refuse" }, { status: 403 });
}

async function requireAdmin(supabase) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { user: null, profile: null };

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") return { user, profile: null };
  return { user, profile };
}

function getServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createAdminClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

// GET: list all users with their profiles
export async function GET() {
  if (!isSupabaseConfigured()) return NextResponse.json([]);

  const supabase = createClient();
  const { profile } = await requireAdmin(supabase);
  if (!profile) return unauthorized();

  const { data, error } = await supabase
    .from("profiles")
    .select("id, email, display_name, role, level, rank, xp, created_at, last_active_at")
    .order("created_at", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data || []);
}

// POST: create a new user
export async function POST(request) {
  if (!isSupabaseConfigured()) return NextResponse.json({ error: "Non configure" }, { status: 500 });

  const supabase = createClient();
  const { profile } = await requireAdmin(supabase);
  if (!profile) return unauthorized();

  const body = await request.json();
  const { email, password, display_name } = body;

  if (!email || !password) {
    return NextResponse.json({ error: "Email et mot de passe requis" }, { status: 400 });
  }

  if (password.length < 8) {
    return NextResponse.json({ error: "Le mot de passe doit contenir au moins 8 caracteres" }, { status: 400 });
  }

  const adminClient = getServiceClient();
  if (!adminClient) {
    return NextResponse.json({ error: "SUPABASE_SERVICE_ROLE_KEY non configure" }, { status: 500 });
  }

  const { data, error } = await adminClient.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { display_name: display_name || email.split("@")[0] },
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  // Update profile with display_name
  if (data.user) {
    await adminClient
      .from("profiles")
      .update({ display_name: display_name || email.split("@")[0] })
      .eq("id", data.user.id);
  }

  return NextResponse.json({ success: true, user_id: data.user?.id });
}

// DELETE: remove a user
export async function DELETE(request) {
  if (!isSupabaseConfigured()) return NextResponse.json({ error: "Non configure" }, { status: 500 });

  const supabase = createClient();
  const { user: adminUser, profile } = await requireAdmin(supabase);
  if (!profile) return unauthorized();

  const { searchParams } = new URL(request.url);
  const userId = searchParams.get("id");

  if (!userId) {
    return NextResponse.json({ error: "ID utilisateur requis" }, { status: 400 });
  }

  // Prevent self-deletion
  if (userId === adminUser.id) {
    return NextResponse.json({ error: "Impossible de supprimer votre propre compte" }, { status: 400 });
  }

  const adminClient = getServiceClient();
  if (!adminClient) {
    return NextResponse.json({ error: "SUPABASE_SERVICE_ROLE_KEY non configure" }, { status: 500 });
  }

  const { error } = await adminClient.auth.admin.deleteUser(userId);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
