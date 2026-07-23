// =============================================================================
// Meet Champion — Emergent preview stub.
//
// This screen exists only so the Emergent preview shows a friendly landing
// page. The REAL mobile app lives at `apps/mobile/` and is a fully
// standalone Expo project. Nothing in the portable monorepo depends on
// this file.
//
// To run the real app locally:
//   cd apps/mobile && npm install && npm start
// =============================================================================
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function PreviewLanding() {
  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text testID="project-brand" style={styles.brand}>Meet Champion</Text>
        <Text style={styles.subtitle}>
          Fans book 1:1 video calls with verified Champions.
        </Text>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Emergent preview note</Text>
          <Text style={styles.cardBody}>
            This project is 100% platform-independent. The Emergent preview
            container ships FastAPI + MongoDB, but the real project uses
            Supabase + Next.js + Expo. To try the app, export the repo and
            run it locally.
          </Text>
        </View>

        <Text style={styles.h2}>Repository layout</Text>
        <View style={styles.codeBlock}>
          <Text style={styles.code}>{`meet-champion/
├── apps/
│   ├── mobile/          # Expo + React Native
│   └── admin/           # Next.js 14
├── packages/
│   └── shared/          # Types + service adapters
├── supabase/
│   ├── migrations/      # DB schema + RLS + storage
│   ├── functions/       # Edge functions (Stripe / Video / Email)
│   └── seed.sql
└── docs/
    ├── ARCHITECTURE.md
    └── CODEX_HANDOFF.md`}</Text>
        </View>

        <Text style={styles.h2}>Run locally</Text>
        <View style={styles.codeBlock}>
          <Text style={styles.code}>{`git clone <repo>
cd meet-champion
npm install
cp .env.example .env         # add Supabase, Stripe, Daily, Resend keys
supabase db push             # apply migrations
node supabase/scripts/create_demo_users.mjs
npm run mobile               # Expo dev server
npm run admin                # Next.js dev server`}</Text>
        </View>

        <Text style={styles.h2}>Portable stack</Text>
        <View style={styles.list}>
          <Text style={styles.li}>• Mobile: Expo + React Native + TypeScript</Text>
          <Text style={styles.li}>• Admin: Next.js 14 + Tailwind + TypeScript</Text>
          <Text style={styles.li}>• DB / Auth / Storage: Supabase (PostgreSQL)</Text>
          <Text style={styles.li}>• Payments: Stripe (Connect-ready)</Text>
          <Text style={styles.li}>• Video: Daily (adapter interface — Agora/Twilio pluggable)</Text>
          <Text style={styles.li}>• Email: Resend (adapter interface — SendGrid/SMTP pluggable)</Text>
        </View>

        <Text style={styles.footer}>
          See `docs/CODEX_HANDOFF.md` for the full handoff guide.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const COLORS = {
  bg: "#0B0D12",
  surface: "#141821",
  border: "#252B3B",
  primary: "#F5C518",
  text: "#F4F5F7",
  muted: "#9AA3B2",
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.bg },
  container: { padding: 24, gap: 8 },
  brand: { fontSize: 32, fontWeight: "700", color: COLORS.primary, letterSpacing: -0.5 },
  subtitle: { color: COLORS.muted, fontSize: 15, marginBottom: 24 },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.primary + "44",
    padding: 16,
    marginBottom: 24,
  },
  cardTitle: { color: COLORS.primary, fontWeight: "700", marginBottom: 6 },
  cardBody: { color: COLORS.text, fontSize: 14, lineHeight: 20 },
  h2: { color: COLORS.text, fontSize: 18, fontWeight: "700", marginTop: 16, marginBottom: 8 },
  codeBlock: {
    backgroundColor: "#000",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 12,
  },
  code: { color: "#9EFF9E", fontFamily: "monospace", fontSize: 12, lineHeight: 18 },
  list: { gap: 6, marginTop: 4 },
  li: { color: COLORS.text, fontSize: 14 },
  footer: { color: COLORS.muted, fontSize: 12, marginTop: 24, textAlign: "center" },
});
