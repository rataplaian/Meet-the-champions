import { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Alert,
} from "react-native";
import { router } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import { Ionicons } from "@expo/vector-icons";
import { supabase, storage, champions } from "../src/services";
import { useAuth } from "../src/context/auth";
import { colors, radius, spacing, typography } from "../src/theme";

// Categories match the seed data; extend as needed.
const CATEGORIES = ["athlete", "coach", "celebrity", "expert"];

export default function VipVerify() {
  const { profile, refresh } = useAuth();
  const [headline, setHeadline] = useState("");
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [rate, setRate] = useState("49");   // in USD
  const [duration, setDuration] = useState("15");
  const [documentUri, setDocumentUri] = useState<string | null>(null);
  const [selfieUri, setSelfieUri] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const pickDocument = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) return Alert.alert("Permission needed", "Please allow photo access.");
    const r = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.7,
    });
    if (!r.canceled) setDocumentUri(r.assets[0].uri);
  };

  const takeSelfie = async () => {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) return Alert.alert("Permission needed", "Please allow camera access.");
    const r = await ImagePicker.launchCameraAsync({ quality: 0.7, cameraType: ImagePicker.CameraType.front });
    if (!r.canceled) setSelfieUri(r.assets[0].uri);
  };

  const uploadFile = async (uri: string, path: string) => {
    const res = await fetch(uri);
    const blob = await res.blob();
    await storage.upload({
      bucket: "vip-verifications",
      path,
      file: blob,
      contentType: blob.type || "image/jpeg",
      upsert: true,
    });
    return path;
  };

  const onSubmit = async () => {
    if (!profile) return;
    if (!headline.trim() || !documentUri || !selfieUri) {
      setError("Please complete all fields and upload both files.");
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      const uid = profile.id;
      const docPath = await uploadFile(documentUri, `${uid}/document.jpg`);
      const selfiePath = await uploadFile(selfieUri, `${uid}/selfie.jpg`);

      // Upsert champion profile as pending
      await champions.upsertMyChampionProfile({
        headline: headline.trim(),
        category,
        hourly_rate_cents: Math.round(parseFloat(rate || "0") * 100),
        currency: "USD",
        call_duration_minutes: parseInt(duration || "15", 10),
        verification_status: "pending",
      });

      // Update profile role
      await supabase.from("profiles").update({ role: "champion" }).eq("id", uid);

      // Insert verification record
      const { error: vErr } = await supabase.from("vip_verifications").insert({
        profile_id: uid,
        document_url: docPath,
        selfie_url: selfiePath,
        status: "pending",
      });
      if (vErr) throw vErr;

      await refresh();
      Alert.alert("Submitted", "Your VIP verification is under review.");
      router.replace("/(tabs)/profile");
    } catch (e: any) {
      setError(e.message ?? "Submission failed");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.bg }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView contentContainerStyle={{ padding: spacing.lg }}>
        <Text style={styles.title}>VIP Verification</Text>
        <Text style={styles.subtitle}>
          Submit a headline, ID document and selfie. Our admins review within 48h.
        </Text>

        <Text style={styles.label}>Headline</Text>
        <TextInput
          testID="vip-headline-input"
          value={headline}
          onChangeText={setHeadline}
          placeholder="What can fans book with you?"
          placeholderTextColor={colors.textMuted}
          style={styles.input}
        />

        <Text style={styles.label}>Category</Text>
        <View style={styles.row}>
          {CATEGORIES.map((c) => (
            <TouchableOpacity
              key={c}
              testID={`vip-category-${c}-chip`}
              onPress={() => setCategory(c)}
              style={[styles.chip, category === c && styles.chipActive]}
            >
              <Text style={[styles.chipText, category === c && { color: colors.primary, fontWeight: "700" }]}>
                {c}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.row2}>
          <View style={{ flex: 1 }}>
            <Text style={styles.label}>Rate (USD)</Text>
            <TextInput
              testID="vip-rate-input"
              value={rate}
              onChangeText={setRate}
              keyboardType="numeric"
              style={styles.input}
            />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.label}>Duration (min)</Text>
            <TextInput
              testID="vip-duration-input"
              value={duration}
              onChangeText={setDuration}
              keyboardType="numeric"
              style={styles.input}
            />
          </View>
        </View>

        <TouchableOpacity
          testID="vip-pick-document-button"
          style={styles.uploadButton}
          onPress={pickDocument}
        >
          <Ionicons name={documentUri ? "checkmark-circle" : "document-outline"} size={22} color={documentUri ? colors.success : colors.primary} />
          <Text style={styles.uploadText}>{documentUri ? "ID document ready" : "Upload ID document"}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          testID="vip-take-selfie-button"
          style={styles.uploadButton}
          onPress={takeSelfie}
        >
          <Ionicons name={selfieUri ? "checkmark-circle" : "camera-outline"} size={22} color={selfieUri ? colors.success : colors.primary} />
          <Text style={styles.uploadText}>{selfieUri ? "Selfie captured" : "Take a selfie"}</Text>
        </TouchableOpacity>

        {error && <Text style={styles.error}>{error}</Text>}

        <TouchableOpacity
          testID="vip-submit-button"
          style={[styles.submitButton, submitting && { opacity: 0.5 }]}
          onPress={onSubmit}
          disabled={submitting}
        >
          <Text style={styles.submitText}>{submitting ? "Submitting…" : "Submit for review"}</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  title: { ...typography.h1, color: colors.text },
  subtitle: { color: colors.textMuted, marginTop: 4, marginBottom: spacing.lg },
  label: { color: colors.textMuted, marginTop: spacing.md, ...typography.small },
  input: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    color: colors.text,
    padding: spacing.md,
    borderWidth: 1, borderColor: colors.border,
    marginTop: 4,
  },
  row: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm, marginTop: spacing.sm },
  row2: { flexDirection: "row", gap: spacing.md },
  chip: {
    paddingHorizontal: spacing.md, paddingVertical: 8, borderRadius: radius.pill,
    borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface,
  },
  chipActive: { borderColor: colors.primary, backgroundColor: colors.primary + "22" },
  chipText: { color: colors.textMuted, textTransform: "capitalize" },
  uploadButton: {
    flexDirection: "row", gap: spacing.sm, alignItems: "center",
    backgroundColor: colors.surface, padding: spacing.md, borderRadius: radius.md,
    borderWidth: 1, borderColor: colors.border, marginTop: spacing.md,
  },
  uploadText: { color: colors.text, fontWeight: "600" },
  submitButton: {
    backgroundColor: colors.primary, padding: spacing.md, borderRadius: radius.md,
    alignItems: "center", marginTop: spacing.lg,
  },
  submitText: { color: colors.bg, fontWeight: "700", fontSize: 16 },
  error: { color: colors.danger, marginTop: spacing.sm },
});
