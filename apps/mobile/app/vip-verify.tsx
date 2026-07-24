import { useState } from "react";
import { Alert, KeyboardAvoidingView, Platform, ScrollView, Text, TextInput, TouchableOpacity, View } from "react-native";
import { router } from "expo-router";
import { champions, users as usersStore } from "../src/store";
import { useAuth } from "../src/context/auth";
import { radius, spacing, useTheme } from "../src/theme";

export default function VipVerify() {
  const { user, refresh } = useAuth();
  const { tokens } = useTheme();
  const [name, setName] = useState(user?.displayName ?? "");
  const [team, setTeam] = useState("");
  const [age, setAge] = useState("");
  const [rate, setRate] = useState("49");
  const [duration, setDuration] = useState("15");
  const [bio, setBio] = useState("");
  const [category, setCategory] = useState<"athlete" | "coach" | "expert">("athlete");
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (!user) return;
    if (!name.trim() || !team.trim() || !age || !bio.trim()) {
      Alert.alert("Compila tutti i campi"); return;
    }
    setLoading(true);
    try {
      await champions.upsertMe(user.id, {
        name: name.trim(),
        team: team.trim(),
        age: parseInt(age, 10),
        bio: bio.trim(),
        category,
        ratePerCallCents: Math.round(parseFloat(rate) * 100),
        callDurationMinutes: parseInt(duration, 10),
        photoUrl: "https://images.unsplash.com/photo-1552058544-f2b08422138a?w=800&h=1200&fit=crop&crop=faces",
        languages: ["EN"],
      });
      await usersStore.update(user.id, { role: "champion" });
      await refresh();
      Alert.alert("✓ Inviato", "La tua richiesta è in revisione.\n(In demo sei già visibile in Explore)");
      router.replace("/(tabs)/profile");
    } catch (e: any) { Alert.alert("Errore", e.message); }
    finally { setLoading(false); }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1, backgroundColor: tokens.bg }}>
      <ScrollView contentContainerStyle={{ padding: spacing.lg }}>
        <Text style={{ color: tokens.text, fontSize: 24, fontWeight: "800" }}>Diventa un Champion</Text>
        <Text style={{ color: tokens.textMuted, marginTop: 4, marginBottom: spacing.lg }}>
          Racconta la tua esperienza. I fan potranno prenotare videocall con te.
        </Text>

        <Field label="Nome" tokens={tokens} value={name} onChangeText={setName} />
        <Field label="Ultima squadra" tokens={tokens} value={team} onChangeText={setTeam} placeholder="es. Manchester City" />

        <View style={{ flexDirection: "row", gap: spacing.md }}>
          <View style={{ flex: 1 }}>
            <Field label="Età" tokens={tokens} value={age} onChangeText={setAge} keyboardType="numeric" />
          </View>
          <View style={{ flex: 1 }}>
            <Field label="Durata (min)" tokens={tokens} value={duration} onChangeText={setDuration} keyboardType="numeric" />
          </View>
          <View style={{ flex: 1 }}>
            <Field label="Prezzo $" tokens={tokens} value={rate} onChangeText={setRate} keyboardType="numeric" />
          </View>
        </View>

        <Text style={{ color: tokens.textMuted, marginTop: spacing.md, fontSize: 13 }}>Categoria</Text>
        <View style={{ flexDirection: "row", gap: 8, marginTop: 6 }}>
          {(["athlete", "coach", "expert"] as const).map((c) => (
            <TouchableOpacity key={c} onPress={() => setCategory(c)} testID={`cat-${c}`}
              style={{ flex: 1, padding: 10, borderRadius: radius.md, borderWidth: 1,
                borderColor: category === c ? tokens.primary : tokens.border,
                backgroundColor: category === c ? tokens.primary + "22" : tokens.surface, alignItems: "center" }}>
              <Text style={{ color: category === c ? tokens.primary : tokens.textMuted, fontWeight: category === c ? "700" : "500", textTransform: "capitalize" }}>
                {c === "athlete" ? "Giocatore" : c === "coach" ? "Allenatore" : "Ex Pro"}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={{ color: tokens.textMuted, marginTop: spacing.md, fontSize: 13 }}>Biografia</Text>
        <TextInput value={bio} onChangeText={setBio} multiline
          placeholder="Racconta la tua carriera in poche righe…" placeholderTextColor={tokens.textMuted}
          style={{ backgroundColor: tokens.surface, borderColor: tokens.border, borderWidth: 1, borderRadius: radius.md,
            color: tokens.text, padding: spacing.md, marginTop: 6, minHeight: 100 }} />

        <TouchableOpacity onPress={submit} disabled={loading} testID="vip-submit"
          style={{ marginTop: spacing.lg, backgroundColor: tokens.primary, padding: spacing.md, borderRadius: radius.md, alignItems: "center", opacity: loading ? 0.6 : 1 }}>
          <Text style={{ color: tokens.bg, fontWeight: "800", fontSize: 16 }}>{loading ? "Invio…" : "Invia richiesta"}</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function Field({ label, tokens, ...rest }: any) {
  return (
    <View>
      <Text style={{ color: tokens.textMuted, marginTop: spacing.md, fontSize: 13 }}>{label}</Text>
      <TextInput placeholderTextColor={tokens.textMuted}
        style={{ backgroundColor: tokens.surface, borderColor: tokens.border, borderWidth: 1, borderRadius: radius.md,
          color: tokens.text, padding: spacing.md, marginTop: 6 }} {...rest} />
    </View>
  );
}
