/**
 * Seed 10 test accounts: dealer01@dealer-school.com ... dealer10@dealer-school.com
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

const PASSWORD = "Dealer2025!";
const ACCOUNTS = Array.from({ length: 10 }, (_, i) => {
  const num = String(i + 1).padStart(2, "0");
  return {
    email: `dealer${num}@dealer-school.com`,
    display_name: `Dealer ${num}`,
  };
});

async function main() {
  console.log(`\nCreation de ${ACCOUNTS.length} comptes test...\n`);
  console.log(`Mot de passe commun: ${PASSWORD}\n`);

  let created = 0;
  let skipped = 0;

  for (const account of ACCOUNTS) {
    const { data, error } = await supabase.auth.admin.createUser({
      email: account.email,
      password: PASSWORD,
      email_confirm: true, // skip email verification
      user_metadata: { display_name: account.display_name },
    });

    if (error) {
      if (error.message?.includes("already been registered") || error.message?.includes("already exists")) {
        console.log(`  [existe] ${account.email}`);
        skipped++;
      } else {
        console.error(`  [erreur] ${account.email}: ${error.message}`);
      }
      continue;
    }

    // Create profile row
    if (data.user) {
      await supabase.from("profiles").upsert({
        id: data.user.id,
        display_name: account.display_name,
        email: account.email,
        xp: 0,
        level: 1,
        rank: "Bronze",
      }, { onConflict: "id" }).catch(() => null);
    }

    console.log(`  [cree]   ${account.email}`);
    created++;
  }

  console.log(`\nTermine: ${created} crees, ${skipped} existants.\n`);
  console.log("Identifiants:");
  console.log("  Email:    dealer01@dealer-school.com ... dealer10@dealer-school.com");
  console.log(`  Mot de passe: ${PASSWORD}`);
  console.log("");
}

main().catch((err) => {
  console.error("Erreur fatale:", err);
  process.exit(1);
});
