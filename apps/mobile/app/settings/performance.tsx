import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { useAuth } from "../../src/context/auth";
import {
  champions,
  performanceProfiles,
  type ChampionPerformanceProfile,
  type PerformanceAvailabilityWindow,
  type PerformanceServiceKey,
} from "../../src/store";
import { radius, spacing, useTheme } from "../../src/theme";
import { hap } from "../../src/utils/haptics";

const USER_SETTINGS_BACKGROUND = require("../../assets/images/user-settings-bg.jpg");

const SERVICE_COPY: Record<
  PerformanceServiceKey,
  { label: string; description: string; icon: keyof typeof Ionicons.glyphMap }
> = {
  video: { label: "Videochiamata", description: "Live con video", icon: "videocam" },
  voice: { label: "Chiamata", description: "Live solo audio", icon: "call" },
  training: { label: "Allenamento", description: "Sessione dedicata", icon: "barbell" },
  tip: { label: "Consiglio", description: "Contenuto personalizzato", icon: "bulb" },
  message: { label: "Messaggio", description: "Un messaggio e una risposta", icon: "chatbubble-ellipses" },
  support: { label: "Supporta", description: "Messaggio senza risposta", icon: "heart" },
};

const DAYS = [
  { value: 1, label: "Lun" },
  { value: 2, label: "Mar" },
  { value: 3, label: "Mer" },
  { value: 4, label: "Gio" },
  { value: 5, label: "Ven" },
  { value: 6, label: "Sab" },
  { value: 0, label: "Dom" },
];

const SLOT_DURATIONS = [30, 45, 60] as const;

export default function PerformanceSettingsScreen() {
  const { user } = useAuth();
  const { tokens } = useTheme();
  const [profile, setProfile] = useState<ChampionPerformanceProfile | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let active = true;
    void (async () => {
      if (!user || user.role !== "champion") return;
      const champion = await champions.getByUserId(user.id);
      if (!champion) return;
      const next = await performanceProfiles.getOrCreate(champion.id);
      if (active) setProfile(next);
    })();
    return () => {
      active = false;
    };
  }, [user]);

  if (!user || user.role !== "champion") {
    return (
      <View style={[styles.centered, { backgroundColor: tokens.bg }]}>
        <Ionicons name="lock-closed" size={28} color={tokens.textMuted} />
        <Text style={[styles.centeredText, { color: tokens.text }]}>
          Questa sezione è riservata ai Champion.
        </Text>
      </View>
    );
  }

  if (!profile) {
    return (
      <View style={[styles.centered, { backgroundColor: tokens.bg }]}>
        <ActivityIndicator color={tokens.accent} />
      </View>
    );
  }

  const updateService = (
    key: PerformanceServiceKey,
    patch: Partial<ChampionPerformanceProfile["services"][number]>,
  ) => {
    setProfile({
      ...profile,
      services: profile.services.map((service) =>
        service.key === key ? { ...service, ...patch } : service,
      ),
    });
  };

  const updateWindow = (id: string, patch: Partial<PerformanceAvailabilityWindow>) => {
    setProfile({
      ...profile,
      availability: profile.availability.map((window) =>
        window.id === id ? { ...window, ...patch } : window,
      ),
    });
  };

  const addWindow = () => {
    hap.light();
    setProfile({
      ...profile,
      availability: [
        ...profile.availability,
        {
          id: `availability-${Date.now()}`,
          weekday: 1,
          startTime: "18:00",
          endTime: "18:30",
          slotDurationSeconds: 60,
        },
      ],
    });
  };

  const save = async () => {
    setSaving(true);
    try {
      const saved = await performanceProfiles.save(profile);
      setProfile(saved);
      hap.success();
      Alert.alert(
        "Performance aggiornate",
        "Prezzi e nuovi slot sono disponibili. Tra due chiamate restano sempre almeno 10 secondi.",
      );
    } catch (error: any) {
      hap.error();
      Alert.alert("Controlla le impostazioni", error.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={styles.screen}>
      <Image source={USER_SETTINGS_BACKGROUND} resizeMode="cover" style={StyleSheet.absoluteFill} />
      <View style={[StyleSheet.absoluteFill, styles.darkOverlay]} />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.eyebrow}>AREA CHAMPION</Text>
        <Text style={styles.title}>Gestisci performance</Text>
        <Text style={styles.intro}>
          Scegli cosa offrire e imposta i prezzi. Le fasce orarie riguardano soltanto
          Videochiamata e Chiamata live.
        </Text>

        <Text style={styles.sectionTitle}>SERVIZI E PREZZI</Text>
        <View style={styles.serviceList}>
          {profile.services.map((service) => {
            const copy = SERVICE_COPY[service.key];
            return (
              <View
                key={service.key}
                testID={`performance-service-${service.key}`}
                style={[styles.serviceRow, { borderColor: tokens.border }]}
              >
                <View style={styles.serviceIcon}>
                  <Ionicons name={copy.icon} size={20} color="#F5C451" />
                </View>
                <View style={styles.serviceCopy}>
                  <Text style={styles.serviceLabel}>{copy.label}</Text>
                  <Text style={styles.serviceDescription}>{copy.description}</Text>
                </View>
                <View style={styles.priceGroup}>
                  <TextInput
                    testID={`performance-price-${service.key}`}
                    value={(service.priceCents / 100).toFixed(2)}
                    onChangeText={(value) => {
                      const parsed = Number(value.replace(",", "."));
                      if (Number.isFinite(parsed)) {
                        updateService(service.key, { priceCents: Math.max(0, Math.round(parsed * 100)) });
                      }
                    }}
                    keyboardType="decimal-pad"
                    selectTextOnFocus
                    style={styles.priceInput}
                  />
                  <Text style={styles.priceUnit}>
                    {service.pricing === "per_minute" ? "$ / MIN" : "$ FISSO"}
                  </Text>
                </View>
                <Switch
                  testID={`performance-toggle-${service.key}`}
                  value={service.enabled}
                  onValueChange={(enabled) => {
                    hap.select();
                    updateService(service.key, { enabled });
                  }}
                  trackColor={{ false: "#465369", true: "#D49B22" }}
                  thumbColor={service.enabled ? "#FFE27A" : "#D5DEEB"}
                />
              </View>
            );
          })}
        </View>

        <View style={styles.sectionHeader}>
          <View style={{ flex: 1 }}>
            <Text style={styles.sectionTitle}>DISPONIBILITÀ LIVE</Text>
            <Text style={styles.sectionMeta}>Videochiamata e Chiamata</Text>
          </View>
          <TouchableOpacity
            testID="performance-add-window"
            accessibilityLabel="Aggiungi fascia oraria"
            onPress={addWindow}
            style={styles.addButton}
          >
            <Ionicons name="add" size={21} color="#07111F" />
          </TouchableOpacity>
        </View>

        {profile.availability.map((window, index) => (
          <View
            key={window.id}
            testID={`performance-window-${index}`}
            style={[styles.windowCard, { borderColor: tokens.border }]}
          >
            <View style={styles.windowTopRow}>
              <Text style={styles.windowTitle}>Fascia {index + 1}</Text>
              {profile.availability.length > 1 && (
                <TouchableOpacity
                  accessibilityLabel={`Rimuovi fascia ${index + 1}`}
                  onPress={() => {
                    hap.warning();
                    setProfile({
                      ...profile,
                      availability: profile.availability.filter((item) => item.id !== window.id),
                    });
                  }}
                  style={styles.removeButton}
                >
                  <Ionicons name="trash-outline" size={17} color="#FF6B6B" />
                </TouchableOpacity>
              )}
            </View>

            <View style={styles.dayRow}>
              {DAYS.map((day) => {
                const selected = day.value === window.weekday;
                return (
                  <TouchableOpacity
                    key={day.value}
                    onPress={() => updateWindow(window.id, { weekday: day.value })}
                    style={[styles.dayButton, selected && styles.dayButtonSelected]}
                  >
                    <Text style={[styles.dayText, selected && styles.dayTextSelected]}>
                      {day.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <View style={styles.timeRow}>
              <View style={styles.timeField}>
                <Text style={styles.fieldLabel}>DALLE</Text>
                <TextInput
                  value={window.startTime}
                  onChangeText={(startTime) => updateWindow(window.id, { startTime })}
                  placeholder="18:00"
                  placeholderTextColor="#8491A5"
                  maxLength={5}
                  style={styles.timeInput}
                />
              </View>
              <Ionicons name="arrow-forward" size={18} color="#F5C451" />
              <View style={styles.timeField}>
                <Text style={styles.fieldLabel}>ALLE</Text>
                <TextInput
                  value={window.endTime}
                  onChangeText={(endTime) => updateWindow(window.id, { endTime })}
                  placeholder="18:30"
                  placeholderTextColor="#8491A5"
                  maxLength={5}
                  style={styles.timeInput}
                />
              </View>
            </View>

            <Text style={styles.fieldLabel}>DURATA SLOT</Text>
            <View style={styles.durationRow}>
              {SLOT_DURATIONS.map((seconds) => {
                const selected = window.slotDurationSeconds === seconds;
                return (
                  <TouchableOpacity
                    key={seconds}
                    testID={`performance-duration-${index}-${seconds}`}
                    onPress={() => updateWindow(window.id, { slotDurationSeconds: seconds })}
                    style={[styles.durationButton, selected && styles.durationButtonSelected]}
                  >
                    <Text style={[styles.durationText, selected && styles.durationTextSelected]}>
                      {seconds} sec
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        ))}

        <View style={styles.turnaroundNotice}>
          <Ionicons name="swap-horizontal" size={21} color="#F5C451" />
          <View style={{ flex: 1 }}>
            <Text style={styles.turnaroundTitle}>10 secondi tra le chiamate</Text>
            <Text style={styles.turnaroundText}>
              Il calendario inserisce automaticamente il tempo per chiudere una call e avviare la successiva.
            </Text>
          </View>
        </View>

        <View style={styles.asyncNotice}>
          <Ionicons name="chatbubbles-outline" size={20} color="#8FC6FF" />
          <Text style={styles.asyncNoticeText}>
            Messaggio e Supporta sono acquistabili in qualsiasi momento. Per Messaggio hai 7 giorni
            per rispondere, altrimenti il fan viene rimborsato.
          </Text>
        </View>

        <TouchableOpacity
          testID="performance-save"
          disabled={saving}
          onPress={save}
          style={{ opacity: saving ? 0.55 : 1 }}
        >
          <LinearGradient colors={["#FFE27A", "#D49B22"]} style={styles.saveButton}>
            {saving ? (
              <ActivityIndicator color="#07111F" />
            ) : (
              <>
                <Ionicons name="save" size={18} color="#07111F" />
                <Text style={styles.saveText}>SALVA PERFORMANCE</Text>
              </>
            )}
          </LinearGradient>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.back()} style={styles.backLink}>
          <Text style={styles.backLinkText}>Torna al profilo</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#030814" },
  scroll: { flex: 1 },
  darkOverlay: { backgroundColor: "#020711AA" },
  content: { padding: spacing.lg, paddingBottom: spacing.xxl, gap: spacing.md },
  centered: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12, padding: spacing.xl },
  centeredText: { fontSize: 15, fontWeight: "700", textAlign: "center" },
  eyebrow: { color: "#F5C451", fontSize: 11, fontWeight: "900", letterSpacing: 2 },
  title: { color: "#FFFFFF", fontSize: 25, fontWeight: "900" },
  intro: { color: "#D5DEEB", fontSize: 13, lineHeight: 19 },
  sectionTitle: { color: "#F5C451", fontSize: 12, fontWeight: "900", letterSpacing: 1.5 },
  sectionMeta: { color: "#AAB7C8", fontSize: 11, marginTop: 2 },
  serviceList: { gap: 8 },
  serviceRow: {
    minHeight: 76,
    padding: 10,
    borderRadius: radius.md,
    borderWidth: 1,
    backgroundColor: "#F8FBFFF2",
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
  },
  serviceIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#12233D",
  },
  serviceCopy: { flex: 1, minWidth: 72 },
  serviceLabel: { color: "#07111F", fontSize: 13, fontWeight: "900" },
  serviceDescription: { color: "#5D6B7E", fontSize: 10, marginTop: 2 },
  priceGroup: { width: 68, alignItems: "flex-end" },
  priceInput: {
    width: 68,
    height: 34,
    borderRadius: 7,
    borderWidth: 1,
    borderColor: "#C7D1DE",
    backgroundColor: "#FFFFFF",
    color: "#07111F",
    fontSize: 13,
    fontWeight: "800",
    textAlign: "right",
    paddingHorizontal: 7,
  },
  priceUnit: { color: "#5D6B7E", fontSize: 8, fontWeight: "800", marginTop: 2 },
  sectionHeader: { flexDirection: "row", alignItems: "center", marginTop: spacing.sm },
  addButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F5C451",
  },
  windowCard: {
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    backgroundColor: "#F8FBFFF2",
    gap: 12,
  },
  windowTopRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  windowTitle: { color: "#07111F", fontSize: 14, fontWeight: "900" },
  removeButton: {
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 16,
    backgroundColor: "#FFE7E7",
  },
  dayRow: { flexDirection: "row", gap: 4 },
  dayButton: {
    flex: 1,
    height: 30,
    borderRadius: 6,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#E7ECF3",
  },
  dayButtonSelected: { backgroundColor: "#D49B22" },
  dayText: { color: "#526176", fontSize: 9, fontWeight: "800" },
  dayTextSelected: { color: "#07111F" },
  timeRow: { flexDirection: "row", alignItems: "flex-end", gap: 10 },
  timeField: { flex: 1 },
  fieldLabel: { color: "#526176", fontSize: 9, fontWeight: "900", letterSpacing: 1, marginBottom: 4 },
  timeInput: {
    height: 40,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#C7D1DE",
    backgroundColor: "#FFFFFF",
    color: "#07111F",
    fontSize: 15,
    fontWeight: "900",
    textAlign: "center",
  },
  durationRow: { flexDirection: "row", gap: 7 },
  durationButton: {
    flex: 1,
    height: 38,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#C7D1DE",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
  },
  durationButtonSelected: { backgroundColor: "#12233D", borderColor: "#F5C451" },
  durationText: { color: "#526176", fontSize: 11, fontWeight: "800" },
  durationTextSelected: { color: "#FFE27A" },
  turnaroundNotice: {
    flexDirection: "row",
    gap: 10,
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: "#F5C45188",
    backgroundColor: "#151B25EE",
  },
  turnaroundTitle: { color: "#FFFFFF", fontSize: 13, fontWeight: "900" },
  turnaroundText: { color: "#B7C2D1", fontSize: 11, lineHeight: 16, marginTop: 2 },
  asyncNotice: {
    flexDirection: "row",
    gap: 10,
    padding: spacing.md,
    borderRadius: radius.md,
    backgroundColor: "#0A2847EE",
  },
  asyncNoticeText: { flex: 1, color: "#DDEBFA", fontSize: 11, lineHeight: 17 },
  saveButton: {
    minHeight: 50,
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 9,
  },
  saveText: { color: "#07111F", fontSize: 13, fontWeight: "900", letterSpacing: 0.8 },
  backLink: { alignItems: "center", padding: 10 },
  backLinkText: { color: "#D5DEEB", fontSize: 12, fontWeight: "700" },
});
