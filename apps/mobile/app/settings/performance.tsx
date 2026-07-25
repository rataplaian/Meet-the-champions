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

const SCHEDULED_SERVICES: PerformanceServiceKey[] = ["video", "voice", "training", "tip"];
const LIVE_SLOT_DURATIONS = [30, 45, 60] as const;
const SESSION_DURATIONS = [900, 1800, 2700] as const;

function durationLabel(seconds: PerformanceAvailabilityWindow["slotDurationSeconds"]) {
  return seconds < 60 ? `${seconds} sec` : `${seconds / 60} min`;
}

export default function PerformanceSettingsScreen() {
  const { user } = useAuth();
  const { tokens } = useTheme();
  const [profile, setProfile] = useState<ChampionPerformanceProfile | null>(null);
  const [saving, setSaving] = useState(false);
  const [availabilityService, setAvailabilityService] =
    useState<PerformanceServiceKey>("video");

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

  useEffect(() => {
    if (!profile) return;
    const current = profile.services.find((service) => service.key === availabilityService);
    if (current?.enabled && SCHEDULED_SERVICES.includes(current.key)) return;
    const firstEnabled = profile.services.find(
      (service) => service.enabled && SCHEDULED_SERVICES.includes(service.key),
    );
    if (firstEnabled) setAvailabilityService(firstEnabled.key);
  }, [availabilityService, profile]);

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

  const enabledScheduledServices = profile.services.filter(
    (service) => service.enabled && SCHEDULED_SERVICES.includes(service.key),
  );
  const selectedWindows = profile.availability.filter(
    (window) => window.serviceKey === availabilityService,
  );
  const slotDurations =
    availabilityService === "video" || availabilityService === "voice"
      ? LIVE_SLOT_DURATIONS
      : SESSION_DURATIONS;
  const enabledServices = profile.services.filter((service) => service.enabled);
  const previewFromPrice =
    enabledServices.length > 0
      ? Math.min(...enabledServices.map((service) => service.priceCents))
      : 0;

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

  const updatePublicProfile = (
    key: keyof ChampionPerformanceProfile["publicProfile"],
    value: string,
  ) => {
    setProfile({
      ...profile,
      publicProfile: { ...profile.publicProfile, [key]: value },
    });
  };

  const addWindow = () => {
    hap.light();
    const isLive = availabilityService === "video" || availabilityService === "voice";
    setProfile({
      ...profile,
      availability: [
        ...profile.availability,
        {
          id: `availability-${Date.now()}`,
          serviceKey: availabilityService,
          weekday: 1,
          startTime: "18:00",
          endTime: "18:30",
          slotDurationSeconds: isLive ? 60 : 1800,
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
          Personalizza ciò che vedono i fan, scegli le proposte da mostrare e indica
          con pochi passaggi prezzo, durata e disponibilità.
        </Text>

        <Text style={styles.sectionTitle}>1 · PROFILO PUBBLICO</Text>
        <View style={styles.editorCard}>
          <Text style={styles.editorLabel}>TITOLO BREVE</Text>
          <TextInput
            testID="performance-headline"
            value={profile.publicProfile.headline}
            onChangeText={(value) => updatePublicProfile("headline", value)}
            maxLength={80}
            placeholder="Es. Campione del mondo · Mentor"
            placeholderTextColor="#8491A5"
            style={styles.editorInput}
          />

          <Text style={styles.editorLabel}>BIO</Text>
          <TextInput
            testID="performance-bio"
            value={profile.publicProfile.bio}
            onChangeText={(value) => updatePublicProfile("bio", value)}
            maxLength={600}
            multiline
            placeholder="Racconta chi sei e la tua storia."
            placeholderTextColor="#8491A5"
            style={[styles.editorInput, styles.editorTextArea]}
          />

          <Text style={styles.editorLabel}>MESSAGGIO AI FAN</Text>
          <TextInput
            testID="performance-fan-message"
            value={profile.publicProfile.fanMessage}
            onChangeText={(value) => updatePublicProfile("fanMessage", value)}
            maxLength={280}
            multiline
            placeholder="Scrivi qualcosa che vuoi dire ai tuoi fan."
            placeholderTextColor="#8491A5"
            style={[styles.editorInput, styles.editorTextAreaSmall]}
          />

          <Text style={styles.editorLabel}>COME FUNZIONANO LE MIE PROPOSTE</Text>
          <TextInput
            testID="performance-offer-note"
            value={profile.publicProfile.offerNote}
            onChangeText={(value) => updatePublicProfile("offerNote", value)}
            maxLength={280}
            multiline
            placeholder="Aggiungi una delucidazione utile prima della scelta."
            placeholderTextColor="#8491A5"
            style={[styles.editorInput, styles.editorTextAreaSmall]}
          />
        </View>

        <Text style={styles.sectionTitle}>2 · SERVIZI E PREZZI</Text>
        <View style={styles.serviceList}>
          {profile.services.map((service) => {
            const copy = SERVICE_COPY[service.key];
            return (
              <View
                key={service.key}
                testID={`performance-service-${service.key}`}
                style={[styles.serviceRow, { borderColor: tokens.border }]}
              >
                <View style={styles.serviceMainRow}>
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
                          updateService(service.key, {
                            priceCents: Math.max(0, Math.round(parsed * 100)),
                          });
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
                      if (enabled && SCHEDULED_SERVICES.includes(service.key)) {
                        setAvailabilityService(service.key);
                      }
                    }}
                    trackColor={{ false: "#465369", true: "#D49B22" }}
                    thumbColor={service.enabled ? "#FFE27A" : "#D5DEEB"}
                  />
                </View>
                <TextInput
                  testID={`performance-description-${service.key}`}
                  value={service.publicDescription}
                  editable={service.enabled}
                  onChangeText={(publicDescription) =>
                    updateService(service.key, { publicDescription })
                  }
                  maxLength={160}
                  multiline
                  placeholder="Spiega ai fan cosa riceveranno."
                  placeholderTextColor="#8491A5"
                  style={[
                    styles.serviceDescriptionInput,
                    !service.enabled && styles.disabledInput,
                  ]}
                />
              </View>
            );
          })}
        </View>

        <View style={styles.sectionHeader}>
          <View style={{ flex: 1 }}>
            <Text style={styles.sectionTitle}>3 · QUANDO SONO DISPONIBILE</Text>
            <Text style={styles.sectionMeta}>Imposta giorni e durata per ogni proposta</Text>
          </View>
          {enabledScheduledServices.length > 0 && (
            <TouchableOpacity
              testID="performance-add-window"
              accessibilityLabel="Aggiungi fascia oraria"
              onPress={addWindow}
              style={styles.addButton}
            >
              <Ionicons name="add" size={21} color="#07111F" />
            </TouchableOpacity>
          )}
        </View>

        {enabledScheduledServices.length === 0 ? (
          <View style={styles.emptyAvailability}>
            <Ionicons name="calendar-outline" size={22} color="#AAB7C8" />
            <Text style={styles.emptyAvailabilityText}>
              Attiva almeno un servizio con appuntamento per aggiungere gli orari.
            </Text>
          </View>
        ) : (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.servicePicker}
          >
            {enabledScheduledServices.map((item) => {
              const copy = SERVICE_COPY[item.key];
              const selected = item.key === availabilityService;
              return (
                <TouchableOpacity
                  key={item.key}
                  testID={`availability-service-${item.key}`}
                  onPress={() => {
                    hap.select();
                    setAvailabilityService(item.key);
                  }}
                  style={[styles.servicePill, selected && styles.servicePillSelected]}
                >
                  <Ionicons
                    name={copy.icon}
                    size={15}
                    color={selected ? "#07111F" : "#D5DEEB"}
                  />
                  <Text style={[styles.servicePillText, selected && styles.servicePillTextSelected]}>
                    {copy.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        )}

        {enabledScheduledServices.length > 0 && selectedWindows.length === 0 && (
          <TouchableOpacity onPress={addWindow} style={styles.firstWindowButton}>
            <Ionicons name="add-circle-outline" size={19} color="#F5C451" />
            <Text style={styles.firstWindowText}>
              Aggiungi il primo orario per {SERVICE_COPY[availabilityService].label}
            </Text>
          </TouchableOpacity>
        )}

        {selectedWindows.map((window, index) => (
          <View
            key={window.id}
            testID={`performance-window-${index}`}
            style={[styles.windowCard, { borderColor: tokens.border }]}
          >
            <View style={styles.windowTopRow}>
              <View>
                <Text style={styles.windowTitle}>Fascia {index + 1}</Text>
                <Text style={styles.windowService}>
                  {SERVICE_COPY[window.serviceKey].label}
                </Text>
              </View>
              {selectedWindows.length > 0 && (
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
              {slotDurations.map((seconds) => {
                const selected = window.slotDurationSeconds === seconds;
                return (
                  <TouchableOpacity
                    key={seconds}
                    testID={`performance-duration-${index}-${seconds}`}
                    onPress={() => updateWindow(window.id, { slotDurationSeconds: seconds })}
                    style={[styles.durationButton, selected && styles.durationButtonSelected]}
                  >
                    <Text style={[styles.durationText, selected && styles.durationTextSelected]}>
                      {durationLabel(seconds)}
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

        <Text style={styles.sectionTitle}>ANTEPRIMA PUBBLICA</Text>
        <View testID="performance-public-preview" style={styles.previewCard}>
          <Text style={styles.previewEyebrow}>IL TUO PROFILO</Text>
          <Text style={styles.previewHeadline}>
            {profile.publicProfile.headline || "Aggiungi un titolo breve"}
          </Text>
          <Text style={styles.previewBio} numberOfLines={4}>
            {profile.publicProfile.bio || "La tua bio comparirà qui."}
          </Text>
          {profile.publicProfile.fanMessage ? (
            <View style={styles.previewFanMessage}>
              <Ionicons name="megaphone-outline" size={16} color="#F5C451" />
              <Text style={styles.previewFanMessageText}>
                {profile.publicProfile.fanMessage}
              </Text>
            </View>
          ) : null}
          <View style={styles.previewSummary}>
            <Text style={styles.previewSummaryText}>
              {enabledServices.length} {enabledServices.length === 1 ? "servizio attivo" : "servizi attivi"}
            </Text>
            <Text style={styles.previewPrice}>
              da ${(previewFromPrice / 100).toFixed(2)}
            </Text>
          </View>
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
  screen: { flex: 1, backgroundColor: "#0A1830" },
  scroll: { flex: 1 },
  darkOverlay: { backgroundColor: "#02071188" },
  content: { padding: spacing.lg, paddingBottom: spacing.xxl, gap: spacing.md },
  centered: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12, padding: spacing.xl },
  centeredText: { fontSize: 15, fontWeight: "700", textAlign: "center" },
  eyebrow: { color: "#F5C451", fontSize: 11, fontWeight: "900", letterSpacing: 2 },
  title: { color: "#FFFFFF", fontSize: 25, fontWeight: "900" },
  intro: { color: "#D5DEEB", fontSize: 13, lineHeight: 19 },
  sectionTitle: { color: "#F5C451", fontSize: 12, fontWeight: "900", letterSpacing: 1.5 },
  sectionMeta: { color: "#AAB7C8", fontSize: 11, marginTop: 2 },
  editorCard: {
    padding: spacing.md,
    borderRadius: radius.md,
    backgroundColor: "#F8FBFFF2",
    gap: 7,
  },
  editorLabel: {
    color: "#526176",
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 1,
    marginTop: 3,
  },
  editorInput: {
    minHeight: 42,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#C7D1DE",
    backgroundColor: "#FFFFFF",
    color: "#07111F",
    fontSize: 13,
    lineHeight: 18,
    paddingHorizontal: 11,
    paddingVertical: 9,
  },
  editorTextArea: { minHeight: 104, textAlignVertical: "top" },
  editorTextAreaSmall: { minHeight: 72, textAlignVertical: "top" },
  serviceList: { gap: 8 },
  serviceRow: {
    minHeight: 76,
    padding: 10,
    borderRadius: radius.md,
    borderWidth: 1,
    backgroundColor: "#F8FBFFF2",
    gap: 9,
  },
  serviceMainRow: {
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
  serviceDescriptionInput: {
    minHeight: 54,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#C7D1DE",
    backgroundColor: "#FFFFFF",
    color: "#07111F",
    fontSize: 11,
    lineHeight: 16,
    paddingHorizontal: 10,
    paddingVertical: 8,
    textAlignVertical: "top",
  },
  disabledInput: { opacity: 0.45, backgroundColor: "#E7ECF3" },
  sectionHeader: { flexDirection: "row", alignItems: "center", marginTop: spacing.sm },
  addButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F5C451",
  },
  servicePicker: { gap: 8, paddingRight: spacing.md },
  servicePill: {
    minHeight: 38,
    paddingHorizontal: 13,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#526176",
    backgroundColor: "#101B2C",
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
  },
  servicePillSelected: { backgroundColor: "#F5C451", borderColor: "#FFE27A" },
  servicePillText: { color: "#D5DEEB", fontSize: 11, fontWeight: "800" },
  servicePillTextSelected: { color: "#07111F" },
  emptyAvailability: {
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: "#465369",
    backgroundColor: "#101B2CEE",
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  emptyAvailabilityText: { flex: 1, color: "#D5DEEB", fontSize: 12, lineHeight: 17 },
  firstWindowButton: {
    minHeight: 48,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: "#F5C45188",
    backgroundColor: "#151B25EE",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  firstWindowText: { color: "#FFE27A", fontSize: 12, fontWeight: "800" },
  windowCard: {
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    backgroundColor: "#F8FBFFF2",
    gap: 12,
  },
  windowTopRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  windowTitle: { color: "#07111F", fontSize: 14, fontWeight: "900" },
  windowService: { color: "#526176", fontSize: 10, fontWeight: "700", marginTop: 2 },
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
  previewCard: {
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: "#F5C45188",
    backgroundColor: "#07111FF5",
    gap: 8,
  },
  previewEyebrow: { color: "#F5C451", fontSize: 9, fontWeight: "900", letterSpacing: 1.4 },
  previewHeadline: { color: "#FFFFFF", fontSize: 17, fontWeight: "900" },
  previewBio: { color: "#C7D1DE", fontSize: 12, lineHeight: 18 },
  previewFanMessage: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    padding: 10,
    borderRadius: 8,
    backgroundColor: "#17243A",
  },
  previewFanMessageText: { flex: 1, color: "#FFFFFF", fontSize: 11, lineHeight: 16 },
  previewSummary: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: "#34435A",
    paddingTop: 9,
  },
  previewSummaryText: { color: "#AAB7C8", fontSize: 11, fontWeight: "700" },
  previewPrice: { color: "#FFE27A", fontSize: 13, fontWeight: "900" },
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
