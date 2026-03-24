/**
 * Seed admin + 10 test accounts
 *
 * Usage:
 *   node scripts/seed-test-accounts.mjs
 *
 * Requires SUPABASE_SERVICE_ROLE_KEY in .env.local (or set as env var).
 * The service role key is found in Supabase Dashboard > Settings > API > service_role (secret).
 */

import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";

// Load .env.local
try {
  const envFile = readFileSync(".env.local", "utf-8");
  for (const line of envFile.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIdx = trimmed.indexOf("=");
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    const val = trimmed.slice(eqIdx + 1).trim();
    if (!process.env[key]) process.env[key] = val;
  }
} catch { /* no .env.local */ }

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error("Erreur: NEXT_PUBLIC_SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY sont requis.");
  console.error("Ajoute SUPABASE_SERVICE_ROLE_KEY=... dans .env.local");
  console.error("(Dashboard Supabase > Settings > API > service_role secret)");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// Admin account
const ADMIN_ACCOUNT = {
  email: "admin@dealer-school.com",
  password: "Cr0up!3r#Adm1n$2025",
  display_name: "Admin",
  role: "admin",
};

// 10 dealer test accounts
const DEALER_PASSWORD = "Dealer2025!";
const DEALER_ACCOUNTS = Array.from({ length: 10 }, (_, i) => {
  const num = String(i + 1).padStart(2, "0");
  return {
    email: `dealer${num}@dealer-school.com`,
    password: DEALER_PASSWORD,
    display_name: `Dealer ${num}`,
    role: "user",
  };
});

const ALL_ACCOUNTS = [ADMIN_ACCOUNT, ...DEALER_ACCOUNTS];

async function createAccount(account) {
  const { data, error } = await supabase.auth.admin.createUser({
    email: account.email,
    password: account.password,
    email_confirm: true,
    user_metadata: { display_name: account.display_name },
  });

  if (error) {
    if (error.message?.includes("already been registered") || error.message?.includes("already exists")) {
      console.log(`  [existe] ${account.email}`);

      // Still update role if needed (for existing accounts)
      if (account.role === "admin") {
        const { data: users } = await supabase.auth.admin.listUsers();
        const existingUser = users?.users?.find((u) => u.email === account.email);
        if (existingUser) {
          await supabase
            .from("profiles")
            .update({ role: "admin" })
            .eq("id", existingUser.id);
          console.log(`  [role]   ${account.email} -> admin`);
        }
      }
      return "skipped";
    }
    console.error(`  [erreur] ${account.email}: ${error.message}`);
    return "error";
  }

  // Create/update profile row with role
  if (data.user) {
    try {
      await supabase
        .from("profiles")
        .upsert(
          {
            id: data.user.id,
            display_name: account.display_name,
            email: account.email,
            role: account.role,
            xp: 0,
            level: 1,
            rank: "Bronze",
          },
          { onConflict: "id" }
        );
    } catch { /* profile created by trigger */ }
  }

  console.log(`  [cree]   ${account.email} (${account.role})`);
  return "created";
}

async function main() {
  console.log(`\nCreation de ${ALL_ACCOUNTS.length} comptes (1 admin + 10 dealers)...\n`);

  let created = 0;
  let skipped = 0;

  for (const account of ALL_ACCOUNTS) {
    const result = await createAccount(account);
    if (result === "created") created++;
    if (result === "skipped") skipped++;
  }

  console.log(`\nTermine: ${created} crees, ${skipped} existants.\n`);
  console.log("Compte admin:");
  console.log(`  Email:       ${ADMIN_ACCOUNT.email}`);
  console.log(`  Mot de passe: ${ADMIN_ACCOUNT.password}`);
  console.log("");
  console.log("Comptes test:");
  console.log("  Email:       dealer01@dealer-school.com ... dealer10@dealer-school.com");
  console.log(`  Mot de passe: ${DEALER_PASSWORD}`);
  console.log("");
}

main().catch((err) => {
  console.error("Erreur fatale:", err);
  process.exit(1);
});
