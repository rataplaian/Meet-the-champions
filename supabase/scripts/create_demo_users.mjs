// =============================================================================
// Create demo auth users bound to the profile rows created by seed.sql.
// Run with:
//   node --env-file=../../.env supabase/scripts/create_demo_users.mjs
// or (with the Supabase CLI):
//   SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... node create_demo_users.mjs
//
// Idempotent: skips users that already exist. Passwords are documented in
// docs/CODEX_HANDOFF.md — change them for anything other than local dev.
// =============================================================================
import { createClient } from "@supabase/supabase-js";

const url = process.env.SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !serviceRoleKey) {
  console.error("Missing SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}
const admin = createClient(url, serviceRoleKey, {
  auth: { persistSession: false },
});

const DEMO_PASSWORD = "MeetChampion!123";

const users = [
  { id: "00000000-0000-0000-0000-0000000000ad", email: "admin@meetchampion.local",   role: "admin",    display_name: "admin" },
  { id: "00000000-0000-0000-0000-0000000000f1", email: "fan1@meetchampion.local",    role: "fan",      display_name: "alex.fan" },
  { id: "00000000-0000-0000-0000-0000000000f2", email: "fan2@meetchampion.local",    role: "fan",      display_name: "sam.support" },
  { id: "00000000-0000-0000-0000-00000000c001", email: "champ1@meetchampion.local",  role: "champion", display_name: "marta.rossi" },
  { id: "00000000-0000-0000-0000-00000000c002", email: "champ2@meetchampion.local",  role: "champion", display_name: "jordan" },
  { id: "00000000-0000-0000-0000-00000000c003", email: "champ3@meetchampion.local",  role: "champion", display_name: "nina.voice" },
];

for (const u of users) {
  const { data: existing } = await admin.auth.admin.getUserById(u.id);
  if (existing?.user) {
    console.log(`✓ ${u.email} already exists`);
    continue;
  }
  const { error } = await admin.auth.admin.createUser({
    user_id: u.id,
    email: u.email,
    password: DEMO_PASSWORD,
    email_confirm: true,
    user_metadata: { display_name: u.display_name, role: u.role },
  });
  if (error) {
    console.error(`✗ ${u.email}: ${error.message}`);
    continue;
  }
  // Force role on the profiles row (the trigger sets it from metadata but be
  // explicit here in case metadata handling changes).
  await admin.from("profiles").update({ role: u.role }).eq("id", u.id);
  console.log(`✓ Created ${u.email} (${u.role})`);
}

console.log("\nDone. Sign in with the emails above and password:", DEMO_PASSWORD);
