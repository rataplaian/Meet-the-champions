import { useState, useCallback, useEffect, type ComponentProps } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as ImagePicker from "expo-image-picker";
import { router, useFocusEffect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useAuth } from "../../src/context/auth";
import { radius, spacing, useTheme } from "../../src/theme";
import { readMtcBalance, spendMtcBalance } from "../../src/config/mtcWallet";
import { bookings as bStore, type User as DemoUser } from "../../src/store";
import { hap } from "../../src/utils/haptics";
import { useOnboarding } from "../../src/context/onboarding";
import { MtcCoin } from "../../src/components/MtcCoin";
import { runtimeConfig, storage } from "../../src/services";

const USER_SETTINGS_BACKGROUND = require("../../assets/images/user-settings-bg.jpg");
const PROFILE_CUSTOMIZATION_KEY = "@mc/profile-customization@1:";

type IoniconName = ComponentProps<typeof Ionicons>["name"];
type UnlockType = "free" | "mtc" | "event" | "premium";
type CustomizationKind = "badge" | "frame";

type CustomizationItem = {
  id: string;
  label: string;
  icon: IoniconName;
  accent: string;
  colors: readonly [string, string, string];
  unlock: UnlockType;
  cost?: number;
};

type ProfileCustomization = {
  badgeId: string;
  frameId: string;
  unlockedItemIds: string[];
};

type PendingUnlock = {
  kind: CustomizationKind;
  item: CustomizationItem;
};

const BADGES: readonly CustomizationItem[] = [
  {
    id: "badge-star",
    label: "Stella MTC",
    icon: "star",
    accent: "#F5C451",
    colors: ["#FFF3B0", "#F5C451", "#A86E00"],
    unlock: "free",
  },
  {
    id: "badge-fair-play",
    label: "Fair Play",
    icon: "shield-checkmark",
    accent: "#4FD69C",
    colors: ["#D8FFF0", "#4FD69C", "#08734D"],
    unlock: "free",
  },
  {
    id: "badge-supporter",
    label: "Tifoso",
    icon: "football",
    accent: "#62A7FF",
    colors: ["#D9EBFF", "#62A7FF", "#155EEF"],
    unlock: "free",
  },
  {
    id: "badge-founder",
    label: "Fondatore",
    icon: "ribbon",
    accent: "#F5C451",
    colors: ["#FFF3B0", "#F5C451", "#A86E00"],
    unlock: "mtc",
    cost: 240,
  },
  {
    id: "badge-event",
    label: "Vincitore",
    icon: "trophy",
    accent: "#FF8A45",
    colors: ["#FFE2CB", "#FF8A45", "#A63B00"],
    unlock: "event",
  },
  {
    id: "badge-elite",
    label: "Elite",
    icon: "diamond",
    accent: "#C99CFF",
    colors: ["#F0DEFF", "#C99CFF", "#7030A0"],
    unlock: "premium",
  },
];

const FRAMES: readonly CustomizationItem[] = [
  {
    id: "frame-gold",
    label: "Oro MTC",
    icon: "ellipse-outline",
    accent: "#F5C451",
    colors: ["#FFF3B0", "#F5C451", "#9B6200"],
    unlock: "free",
  },
  {
    id: "frame-blue",
    label: "Blu Arena",
    icon: "ellipse-outline",
    accent: "#62A7FF",
    colors: ["#A9D1FF", "#155EEF", "#062B75"],
    unlock: "free",
  },
  {
    id: "frame-silver",
    label: "Argento",
    icon: "ellipse-outline",
    accent: "#D9E2EC",
    colors: ["#FFFFFF", "#AAB8C8", "#566474"],
    unlock: "free",
  },
  {
    id: "frame-crown",
    label: "Corona",
    icon: "ellipse-outline",
    accent: "#F5C451",
    colors: ["#FFF8CB", "#FFD34E", "#C57A00"],
    unlock: "mtc",
    cost: 420,
  },
  {
    id: "frame-event",
    label: "Campione evento",
    icon: "ellipse-outline",
    accent: "#FF764D",
    colors: ["#FFE3D9", "#FF764D", "#A62800"],
    unlock: "event",
  },
  {
    id: "frame-elite",
    label: "Notte Elite",
    icon: "ellipse-outline",
    accent: "#C99CFF",
    colors: ["#F0DEFF", "#8D5FDB", "#35135E"],
    unlock: "premium",
  },
];

const DEFAULT_CUSTOMIZATION: ProfileCustomization = {
  badgeId: "badge-star",
  frameId: "frame-gold",
  unlockedItemIds: [],
};

export default function ProfileScreen() {
  const { user, signOut } = useAuth();
  const { tokens } = useTheme();
  const { reset: resetOnboarding } = useOnboarding();
  const [stats, setStats] = useState({ upcoming: 0, past: 0, total: 0 });
  const [customization, setCustomization] = useState(DEFAULT_CUSTOMIZATION);
  const [customizationOpen, setCustomizationOpen] = useState(false);
  const [profileEditorOpen, setProfileEditorOpen] = useState(false);
  const [pendingUnlock, setPendingUnlock] = useState<PendingUnlock | null>(null);
  const [unlocking, setUnlocking] = useState(false);
  const [mtcBalance, setMtcBalance] = useState(0);
  const panelColor = tokens.surface + "F2";
  const signOutLabel = user?.role === "champion"
    ? "Esci dall'account Champion"
    : "Esci dall'account utente";
  const activeBadge = BADGES.find((item) => item.id === customization.badgeId) ?? BADGES[0]!;
  const activeFrame = FRAMES.find((item) => item.id === customization.frameId) ?? FRAMES[0]!;

  const loadStats = useCallback(async () => {
    if (!user) return;
    const list = await bStore.listForUser(user.id, user.role === "champion" ? "champion" : "fan");
    const now = Date.now();
    let up = 0, pa = 0;
    for (const b of list) {
      const end = new Date(b.scheduledStart).getTime() + b.durationMinutes * 60_000;
      const isPast =
        end < now || b.status === "completed" || b.status === "cancelled" || b.status === "refunded";
      if (isPast) pa++; else up++;
    }
    setStats({ upcoming: up, past: pa, total: list.length });
  }, [user]);

  const loadCustomization = useCallback(async () => {
    if (!user) return;

    try {
      const stored = await AsyncStorage.getItem(`${PROFILE_CUSTOMIZATION_KEY}${user.id}`);
      if (!stored) {
        setCustomization(DEFAULT_CUSTOMIZATION);
        return;
      }

      const parsed = JSON.parse(stored) as Partial<ProfileCustomization>;
      const badgeId = BADGES.some((item) => item.id === parsed.badgeId)
        ? parsed.badgeId!
        : DEFAULT_CUSTOMIZATION.badgeId;
      const frameId = FRAMES.some((item) => item.id === parsed.frameId)
        ? parsed.frameId!
        : DEFAULT_CUSTOMIZATION.frameId;

      setCustomization({
        badgeId,
        frameId,
        unlockedItemIds: Array.isArray(parsed.unlockedItemIds)
          ? parsed.unlockedItemIds.filter((id): id is string => typeof id === "string")
          : [],
      });
    } catch {
      setCustomization(DEFAULT_CUSTOMIZATION);
    }
  }, [user]);

  const persistCustomization = useCallback(async (next: ProfileCustomization) => {
    setCustomization(next);
    if (!user) return;

    try {
      await AsyncStorage.setItem(
        `${PROFILE_CUSTOMIZATION_KEY}${user.id}`,
        JSON.stringify(next),
      );
    } catch {
      Alert.alert("Salvataggio non riuscito", "La personalizzazione resta attiva fino alla chiusura dell'app.");
    }
  }, [user]);

  const selectCustomization = useCallback((
    kind: CustomizationKind,
    item: CustomizationItem,
  ) => {
    const unlocked = item.unlock === "free"
      || customization.unlockedItemIds.includes(item.id);

    if (unlocked) {
      hap.select();
      const next = kind === "badge"
        ? { ...customization, badgeId: item.id }
        : { ...customization, frameId: item.id };
      void persistCustomization(next);
      return;
    }

    if (item.unlock === "mtc") {
      hap.light();
      setPendingUnlock({ kind, item });
      return;
    }

    hap.warning();
    Alert.alert(
      item.unlock === "event" ? "Ricompensa evento" : "Ricompensa Premium",
      item.unlock === "event"
        ? "Questo elemento si ottiene partecipando agli eventi speciali Meet the Champion."
        : "Questo elemento sara disponibile nelle collezioni Premium.",
    );
  }, [customization, persistCustomization]);

  const confirmMtcUnlock = useCallback(async () => {
    if (!pendingUnlock?.item.cost || unlocking) return;

    setUnlocking(true);
    const result = await spendMtcBalance(pendingUnlock.item.cost);
    setMtcBalance(result.balance);

    if (!result.success) {
      hap.warning();
      setUnlocking(false);
      Alert.alert(
        "MTC insufficienti",
        `Servono ${pendingUnlock.item.cost} MTC per sbloccare ${pendingUnlock.item.label}.`,
      );
      return;
    }

    const unlockedItemIds = Array.from(new Set([
      ...customization.unlockedItemIds,
      pendingUnlock.item.id,
    ]));
    const next = pendingUnlock.kind === "badge"
      ? { ...customization, badgeId: pendingUnlock.item.id, unlockedItemIds }
      : { ...customization, frameId: pendingUnlock.item.id, unlockedItemIds };

    await persistCustomization(next);
    hap.success();
    setUnlocking(false);
    setPendingUnlock(null);
  }, [customization, pendingUnlock, persistCustomization, unlocking]);

  useFocusEffect(useCallback(() => {
    void loadStats();
    void loadCustomization();
    void readMtcBalance().then(setMtcBalance);
  }, [loadCustomization, loadStats]));

  return (
    <View style={styles.screen}>
      <Image
        source={USER_SETTINGS_BACKGROUND}
        resizeMode="cover"
        style={StyleSheet.absoluteFill}
      />
      <LinearGradient
        colors={["#02071108", "#02071111", "#02071133"]}
        locations={[0, 0.5, 1]}
        style={[StyleSheet.absoluteFill, styles.noPointerEvents]}
      />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
      {/* Profile card with gradient border */}
      <LinearGradient
        colors={[tokens.accent + "aa", tokens.primary + "aa"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ borderRadius: radius.lg, padding: 2 }}
      >
        <View style={[styles.card, { backgroundColor: panelColor }]}>
          <TouchableOpacity
            accessibilityLabel="Modifica foto e nickname"
            testID="profile-avatar-edit"
            onPress={() => {
              hap.light();
              setProfileEditorOpen(true);
            }}
          >
            <LinearGradient
              colors={activeFrame.colors}
              style={[styles.avatarFrame, { shadowColor: activeFrame.accent }]}
            >
              <View style={[styles.avatar, { backgroundColor: tokens.bgElevated }]}>
                {user?.avatarUrl ? (
                  <Image
                    accessibilityLabel={`Foto profilo di ${user.displayName}`}
                    source={{ uri: user.avatarUrl }}
                    style={styles.avatarImage}
                    resizeMode="cover"
                  />
                ) : (
                  <Ionicons name="person" size={40} color={tokens.accent} />
                )}
              </View>
              <View style={styles.avatarEditMark}>
                <Ionicons name="camera" size={14} color="#07111F" />
              </View>
              <LinearGradient colors={activeBadge.colors} style={styles.profileBadge}>
                <Ionicons name={activeBadge.icon} size={18} color="#07111F" />
              </LinearGradient>
            </LinearGradient>
          </TouchableOpacity>
          <Text style={[styles.name, { color: tokens.text }]}>{user?.displayName ?? "—"}</Text>
          <Text style={{ color: tokens.textMuted, marginTop: 4 }}>{user?.email}</Text>
          <View style={[styles.roleBadge, { backgroundColor: tokens.primary + "22", borderColor: tokens.primary }]}>
            <Text style={{ color: tokens.primary, fontSize: 11, fontWeight: "700", letterSpacing: 1 }}>
              {(user?.role === "fan" ? "UTENTE" : (user?.role ?? "fan")).toUpperCase()}
            </Text>
          </View>
        </View>
      </LinearGradient>

      {/* Stats */}
      <View style={styles.statsRow}>
        <StatBox label="Prossime" value={stats.upcoming} color={tokens.accent} tokens={tokens} panelColor={panelColor} />
        <StatBox label="Passate" value={stats.past} color={tokens.primary} tokens={tokens} panelColor={panelColor} />
        <StatBox label="Totale" value={stats.total} color="#2ED47A" tokens={tokens} panelColor={panelColor} />
      </View>

      <TouchableOpacity
        testID="profile-edit-details"
        onPress={() => {
          hap.light();
          setProfileEditorOpen(true);
        }}
        style={[styles.actionBtn, { backgroundColor: panelColor, borderColor: tokens.primary + "88" }]}
      >
        <View style={styles.editProfileActionIcon}>
          <Ionicons name="person-circle-outline" size={22} color="#FFFFFF" />
        </View>
        <View style={styles.actionCopy}>
          <Text style={[styles.actionText, { color: tokens.text }]}>Modifica nickname e foto</Text>
          <Text style={[styles.actionMeta, { color: tokens.textMuted }]}>
            Aggiorna come appari nel tuo profilo
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={18} color={tokens.textMuted} />
      </TouchableOpacity>

      <TouchableOpacity
        testID="profile-customization"
        onPress={() => {
          hap.light();
          setCustomizationOpen(true);
        }}
        style={[styles.actionBtn, { backgroundColor: panelColor, borderColor: tokens.accent + "88" }]}
      >
        <View style={styles.customizationActionIcon}>
          <Ionicons name="shield-half-outline" size={20} color="#07111F" />
        </View>
        <View style={styles.actionCopy}>
          <Text style={[styles.actionText, { color: tokens.text }]}>Personalizza il profilo</Text>
          <Text style={[styles.actionMeta, { color: tokens.textMuted }]}>
            {activeBadge.label} · {activeFrame.label}
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={18} color={tokens.textMuted} />
      </TouchableOpacity>

      {user?.role === "champion" && (
        <TouchableOpacity
          testID="profile-manage-performance"
          onPress={() => {
            hap.light();
            router.push("/settings/performance" as never);
          }}
          style={[styles.actionBtn, { backgroundColor: panelColor, borderColor: "#F5C45188" }]}
        >
          <View style={styles.performanceActionIcon}>
            <Ionicons name="options" size={20} color="#07111F" />
          </View>
          <View style={styles.actionCopy}>
            <Text style={[styles.actionText, { color: tokens.text }]}>
              Profilo pubblico e performance
            </Text>
            <Text style={[styles.actionMeta, { color: tokens.textMuted }]}>
              Bio, messaggi ai fan, servizi, prezzi e orari
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={tokens.textMuted} />
        </TouchableOpacity>
      )}

      <TouchableOpacity testID="profile-appearance"
        onPress={() => { hap.light(); router.push("/settings/appearance" as never); }}
        style={[styles.actionBtn, { backgroundColor: panelColor, borderColor: tokens.border }]}>
        <Ionicons name="color-palette-outline" size={20} color={tokens.accent} />
        <Text style={[styles.actionText, { color: tokens.text }]}>Aspetto — Tema della tua squadra</Text>
        <Ionicons name="chevron-forward" size={18} color={tokens.textMuted} />
      </TouchableOpacity>

      <TouchableOpacity testID="profile-onboarding"
        onPress={async () => {
          hap.light();
          await resetOnboarding();
          router.replace("/onboarding" as never);
        }}
        style={[styles.actionBtn, { backgroundColor: panelColor, borderColor: tokens.border }]}>
        <Ionicons name="sparkles-outline" size={20} color={tokens.primary} />
        <Text style={[styles.actionText, { color: tokens.text }]}>Rivedi introduzione</Text>
        <Ionicons name="chevron-forward" size={18} color={tokens.textMuted} />
      </TouchableOpacity>

      <TouchableOpacity testID="profile-sign-out"
        onPress={async () => {
          hap.warning();
          await signOut();
          router.replace("/(auth)/sign-in" as never);
        }}
        style={[styles.actionBtn, { backgroundColor: panelColor, borderColor: tokens.danger + "44" }]}>
        <Ionicons name="log-out-outline" size={20} color={tokens.danger} />
        <Text style={[styles.actionText, { color: tokens.danger }]}>{signOutLabel}</Text>
        <View style={{ width: 18 }} />
      </TouchableOpacity>

      <Text style={styles.footer}>
        Meet Champion · Demo v1.0
      </Text>
      </ScrollView>

      <ProfileEditorModal
        visible={profileEditorOpen}
        user={user}
        onClose={() => setProfileEditorOpen(false)}
      />

      <CustomizationModal
        visible={customizationOpen}
        balance={mtcBalance}
        customization={customization}
        onClose={() => setCustomizationOpen(false)}
        onSelect={selectCustomization}
      />

      <MtcUnlockModal
        pending={pendingUnlock}
        balance={mtcBalance}
        loading={unlocking}
        onClose={() => {
          if (!unlocking) setPendingUnlock(null);
        }}
        onConfirm={() => {
          void confirmMtcUnlock();
        }}
      />
    </View>
  );
}

function ProfileEditorModal({
  visible,
  user,
  onClose,
}: {
  visible: boolean;
  user: DemoUser | null;
  onClose: () => void;
}) {
  const { tokens } = useTheme();
  const { updateProfile } = useAuth();
  const [displayName, setDisplayName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [selectedAsset, setSelectedAsset] = useState<ImagePicker.ImagePickerAsset | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!visible) return;
    setDisplayName(user?.displayName ?? "");
    setAvatarUrl(user?.avatarUrl ?? null);
    setSelectedAsset(null);
  }, [user, visible]);

  const choosePhoto = useCallback(async () => {
    if (Platform.OS !== "web") {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert(
          "Permesso necessario",
          "Consenti l'accesso alle foto per scegliere l'immagine del profilo.",
        );
        return;
      }
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.55,
      base64: runtimeConfig.isDemo,
    });
    if (result.canceled) return;

    const asset = result.assets[0];
    if (!asset) return;
    if (runtimeConfig.isDemo && asset.base64 && asset.base64.length > 2_000_000) {
      Alert.alert(
        "Immagine troppo grande",
        "Scegli una foto più leggera per salvarla nella preview demo.",
      );
      return;
    }

    const previewUri = runtimeConfig.isDemo && asset.base64
      ? `data:${asset.mimeType ?? "image/jpeg"};base64,${asset.base64}`
      : asset.uri;
    setAvatarUrl(previewUri);
    setSelectedAsset(asset);
    hap.select();
  }, []);

  const saveProfile = useCallback(async () => {
    const nextDisplayName = displayName.trim();
    if (!user || saving) return;
    if (nextDisplayName.length < 2) {
      Alert.alert("Nickname troppo corto", "Inserisci almeno 2 caratteri.");
      return;
    }
    if (nextDisplayName.length > 32) {
      Alert.alert("Nickname troppo lungo", "Usa al massimo 32 caratteri.");
      return;
    }

    setSaving(true);
    try {
      let nextAvatarUrl = avatarUrl;
      if (selectedAsset && !runtimeConfig.isDemo) {
        const response = await fetch(selectedAsset.uri);
        const file = await response.blob();
        const contentType = selectedAsset.mimeType || file.type || "image/jpeg";
        const extension = contentType.includes("png")
          ? "png"
          : contentType.includes("webp")
            ? "webp"
            : "jpg";
        const uploaded = await storage.upload({
          bucket: "avatars",
          path: `${user.id}/profile.${extension}`,
          file,
          contentType,
          upsert: true,
        });
        nextAvatarUrl = uploaded.publicUrl;
      }

      await updateProfile({
        displayName: nextDisplayName,
        avatarUrl: nextAvatarUrl,
      });
      hap.success();
      onClose();
    } catch (error) {
      hap.warning();
      Alert.alert(
        "Salvataggio non riuscito",
        error instanceof Error ? error.message : "Riprova tra poco.",
      );
    } finally {
      setSaving(false);
    }
  }, [avatarUrl, displayName, onClose, saving, selectedAsset, updateProfile, user]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={() => {
        if (!saving) onClose();
      }}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.modalBackdrop}
      >
        <View
          testID="profile-editor-modal"
          style={[styles.profileEditorSheet, { backgroundColor: tokens.surface }]}
        >
          <View style={[styles.profileEditorHeader, { borderBottomColor: tokens.border }]}>
            <View style={styles.sheetTitleGroup}>
              <Text style={[styles.sheetEyebrow, { color: tokens.accent }]}>IL TUO PROFILO</Text>
              <Text style={[styles.sheetTitle, { color: tokens.text }]}>Nickname e foto</Text>
            </View>
            <TouchableOpacity
              accessibilityLabel="Chiudi modifica profilo"
              testID="profile-editor-close"
              disabled={saving}
              onPress={onClose}
              style={[styles.closeButton, { borderColor: tokens.border }]}
            >
              <Ionicons name="close" size={20} color={tokens.text} />
            </TouchableOpacity>
          </View>

          <ScrollView
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.profileEditorContent}
          >
            <View style={styles.editorAvatarArea}>
              <View style={[styles.editorAvatarShell, { borderColor: tokens.accent }]}>
                {avatarUrl ? (
                  <Image source={{ uri: avatarUrl }} style={styles.editorAvatarImage} resizeMode="cover" />
                ) : (
                  <Ionicons name="person" size={48} color={tokens.accent} />
                )}
              </View>
              <TouchableOpacity
                accessibilityLabel="Scegli foto profilo"
                testID="profile-photo-picker"
                onPress={() => {
                  void choosePhoto();
                }}
                style={styles.photoPickerButton}
              >
                <Ionicons name="images-outline" size={18} color="#07111F" />
                <Text style={styles.photoPickerText}>Scegli foto</Text>
              </TouchableOpacity>
              {avatarUrl ? (
                <TouchableOpacity
                  testID="profile-photo-remove"
                  onPress={() => {
                    setAvatarUrl(null);
                    setSelectedAsset(null);
                  }}
                  style={styles.removePhotoButton}
                >
                  <Text style={[styles.removePhotoText, { color: tokens.textMuted }]}>
                    Rimuovi foto
                  </Text>
                </TouchableOpacity>
              ) : null}
            </View>

            <View>
              <Text style={[styles.editorLabel, { color: tokens.text }]}>Nickname</Text>
              <TextInput
                accessibilityLabel="Nickname"
                testID="profile-nickname-input"
                value={displayName}
                onChangeText={setDisplayName}
                autoCapitalize="words"
                autoCorrect={false}
                maxLength={32}
                placeholder="Il tuo nickname"
                placeholderTextColor={tokens.textMuted}
                style={[
                  styles.editorInput,
                  {
                    color: tokens.text,
                    borderColor: tokens.border,
                    backgroundColor: tokens.bgElevated,
                  },
                ]}
              />
              <Text style={[styles.editorHint, { color: tokens.textMuted }]}>
                Sarà visibile nel profilo e nelle attività della community.
              </Text>
            </View>

            <TouchableOpacity
              testID="profile-editor-save"
              disabled={saving}
              onPress={() => {
                void saveProfile();
              }}
              style={[styles.editorSaveButton, { opacity: saving ? 0.6 : 1 }]}
            >
              {saving ? (
                <ActivityIndicator color="#07111F" />
              ) : (
                <>
                  <Ionicons name="checkmark" size={20} color="#07111F" />
                  <Text style={styles.editorSaveText}>Salva modifiche</Text>
                </>
              )}
            </TouchableOpacity>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

function CustomizationModal({
  visible,
  balance,
  customization,
  onClose,
  onSelect,
}: {
  visible: boolean;
  balance: number;
  customization: ProfileCustomization;
  onClose: () => void;
  onSelect: (kind: CustomizationKind, item: CustomizationItem) => void;
}) {
  const { tokens } = useTheme();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalBackdrop}>
        <View
          testID="profile-customization-modal"
          style={[styles.customizationSheet, { backgroundColor: tokens.surface }]}
        >
          <View style={[styles.sheetHeader, { borderBottomColor: tokens.border }]}>
            <View style={styles.sheetTitleGroup}>
              <Text style={[styles.sheetEyebrow, { color: tokens.accent }]}>IL TUO STILE</Text>
              <Text style={[styles.sheetTitle, { color: tokens.text }]}>Personalizza profilo</Text>
            </View>
            <View style={styles.sheetHeaderActions}>
              <View style={styles.sheetBalance}>
                <MtcCoin size={22} />
                <Text style={styles.sheetBalanceValue}>{balance}</Text>
              </View>
              <TouchableOpacity
                accessibilityLabel="Chiudi personalizzazione"
                testID="profile-customization-close"
                onPress={onClose}
                style={[styles.closeButton, { borderColor: tokens.border }]}
              >
                <Ionicons name="close" size={20} color={tokens.text} />
              </TouchableOpacity>
            </View>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.customizationContent}
          >
            <CustomizationSection
              title="Badge"
              subtitle="Uno stemma accanto alla foto profilo."
              kind="badge"
              items={BADGES}
              selectedId={customization.badgeId}
              unlockedItemIds={customization.unlockedItemIds}
              onSelect={onSelect}
              tokens={tokens}
            />

            <CustomizationSection
              title="Cornice"
              subtitle="Scegli il bordo che rappresenta il tuo profilo."
              kind="frame"
              items={FRAMES}
              selectedId={customization.frameId}
              unlockedItemIds={customization.unlockedItemIds}
              onSelect={onSelect}
              tokens={tokens}
            />

            <View style={[styles.unlockLegend, { borderColor: tokens.border }]}>
              <Ionicons name="lock-closed-outline" size={17} color={tokens.accent} />
              <Text style={[styles.unlockLegendText, { color: tokens.textMuted }]}>
                Le collezioni speciali si sbloccano con eventi, MTC o accessi Premium.
              </Text>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

function CustomizationSection({
  title,
  subtitle,
  kind,
  items,
  selectedId,
  unlockedItemIds,
  onSelect,
  tokens,
}: {
  title: string;
  subtitle: string;
  kind: CustomizationKind;
  items: readonly CustomizationItem[];
  selectedId: string;
  unlockedItemIds: string[];
  onSelect: (kind: CustomizationKind, item: CustomizationItem) => void;
  tokens: ReturnType<typeof useTheme>["tokens"];
}) {
  return (
    <View>
      <Text style={[styles.sectionTitle, { color: tokens.text }]}>{title}</Text>
      <Text style={[styles.sectionSubtitle, { color: tokens.textMuted }]}>{subtitle}</Text>
      <View style={styles.customizationGrid}>
        {items.map((item) => {
          const unlocked = item.unlock === "free" || unlockedItemIds.includes(item.id);
          return (
            <TouchableOpacity
              key={item.id}
              testID={`profile-${kind}-${item.id}`}
              accessibilityLabel={`${item.label}, ${availabilityLabel(item, unlocked)}`}
              onPress={() => onSelect(kind, item)}
              style={[
                styles.customizationTile,
                {
                  backgroundColor: selectedId === item.id ? item.accent + "18" : tokens.bgElevated,
                  borderColor: selectedId === item.id ? item.accent : tokens.border,
                },
              ]}
            >
              {kind === "badge" ? (
                <LinearGradient colors={item.colors} style={styles.badgePreview}>
                  <Ionicons name={item.icon} size={22} color="#07111F" />
                </LinearGradient>
              ) : (
                <LinearGradient colors={item.colors} style={styles.framePreview}>
                  <View style={[styles.framePreviewInner, { backgroundColor: tokens.surface }]}>
                    <Ionicons name="person" size={19} color={tokens.textMuted} />
                  </View>
                </LinearGradient>
              )}

              <Text numberOfLines={2} style={[styles.customizationLabel, { color: tokens.text }]}>
                {item.label}
              </Text>
              <View style={[
                styles.availabilityPill,
                { backgroundColor: unlocked ? "#DDF7EA" : item.accent + "18" },
              ]}>
                {!unlocked && <Ionicons name="lock-closed" size={9} color={item.accent} />}
                <Text style={[styles.availabilityText, { color: unlocked ? "#08734D" : item.accent }]}>
                  {availabilityLabel(item, unlocked)}
                </Text>
              </View>

              {selectedId === item.id && (
                <View style={[styles.selectedMark, { backgroundColor: item.accent }]}>
                  <Ionicons name="checkmark" size={12} color="#07111F" />
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

function MtcUnlockModal({
  pending,
  balance,
  loading,
  onClose,
  onConfirm,
}: {
  pending: PendingUnlock | null;
  balance: number;
  loading: boolean;
  onClose: () => void;
  onConfirm: () => void;
}) {
  const { tokens } = useTheme();
  if (!pending) return null;

  const cost = pending.item.cost ?? 0;
  const affordable = balance >= cost;

  return (
    <Modal
      visible
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.confirmBackdrop}>
        <View
          testID="profile-mtc-unlock-modal"
          style={[styles.confirmCard, { backgroundColor: tokens.surface, borderColor: tokens.accent + "88" }]}
        >
          <LinearGradient colors={pending.item.colors} style={styles.confirmIcon}>
            <Ionicons
              name={pending.kind === "badge" ? pending.item.icon : "person"}
              size={28}
              color="#07111F"
            />
          </LinearGradient>
          <Text style={[styles.confirmTitle, { color: tokens.text }]}>Sblocca {pending.item.label}</Text>
          <Text style={[styles.confirmCopy, { color: tokens.textMuted }]}>
            {"L'elemento resta disponibile nel tuo profilo dopo il riscatto."}
          </Text>
          <View style={styles.confirmBalanceRow}>
            <Text style={[styles.confirmBalanceLabel, { color: tokens.textMuted }]}>Saldo</Text>
            <View style={styles.confirmBalanceAmount}>
              <MtcCoin size={22} />
              <Text style={[styles.confirmBalanceValue, { color: tokens.text }]}>{balance} MTC</Text>
            </View>
          </View>
          <TouchableOpacity
            testID="profile-mtc-confirm"
            disabled={!affordable || loading}
            onPress={onConfirm}
            style={[
              styles.confirmPrimary,
              { opacity: affordable && !loading ? 1 : 0.48 },
            ]}
          >
            {loading ? (
              <ActivityIndicator color="#07111F" />
            ) : (
              <Text style={styles.confirmPrimaryText}>
                {affordable ? `Riscatta · ${cost} MTC` : `Servono ${cost} MTC`}
              </Text>
            )}
          </TouchableOpacity>
          <TouchableOpacity
            testID="profile-mtc-cancel"
            disabled={loading}
            onPress={onClose}
            style={[styles.confirmSecondary, { borderColor: tokens.border }]}
          >
            <Text style={[styles.confirmSecondaryText, { color: tokens.text }]}>Annulla</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

function availabilityLabel(item: CustomizationItem, unlocked: boolean) {
  if (unlocked) return item.unlock === "free" ? "INCLUSO" : "SBLOCCATO";
  if (item.unlock === "mtc") return `${item.cost} MTC`;
  if (item.unlock === "event") return "EVENTO";
  return "PREMIUM";
}

function StatBox({ label, value, color, tokens, panelColor }: any) {
  return (
    <View style={[styles.stat, { backgroundColor: panelColor, borderColor: tokens.border }]}>
      <Text style={{ color, fontSize: 26, fontWeight: "900" }}>{value}</Text>
      <Text style={{ color: tokens.textMuted, fontSize: 11, letterSpacing: 1, fontWeight: "700", marginTop: 2 }}>
        {label.toUpperCase()}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#061023",
  },
  scroll: {
    flex: 1,
    backgroundColor: "transparent",
  },
  content: {
    flexGrow: 1,
    padding: spacing.lg,
    gap: spacing.md,
  },
  noPointerEvents: {
    pointerEvents: "none",
  },
  card: { padding: spacing.lg, borderRadius: radius.lg - 2, alignItems: "center" },
  avatarFrame: {
    width: 94,
    height: 94,
    borderRadius: 47,
    padding: 4,
    alignItems: "center",
    justifyContent: "center",
    shadowOpacity: 0.58,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
  },
  avatar: {
    width: 86,
    height: 86,
    borderRadius: 43,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 3,
    borderColor: "#07111F",
    overflow: "hidden",
  },
  avatarImage: { width: "100%", height: "100%" },
  avatarEditMark: {
    position: "absolute",
    right: -5,
    top: -3,
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F5C451",
    borderWidth: 2,
    borderColor: "#FFFFFF",
    elevation: 8,
  },
  profileBadge: {
    position: "absolute",
    right: -5,
    bottom: -3,
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 3,
    borderColor: "#FFFFFF",
    shadowColor: "#000000",
    shadowOpacity: 0.4,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
    elevation: 7,
  },
  name: { fontSize: 22, fontWeight: "800", marginTop: spacing.md },
  roleBadge: { marginTop: spacing.md, paddingHorizontal: spacing.md, paddingVertical: 4, borderRadius: 999, borderWidth: 1 },
  statsRow: { flexDirection: "row", gap: 10 },
  stat: {
    flex: 1,
    padding: 14,
    borderRadius: radius.md,
    borderWidth: 1,
    alignItems: "center",
  },
  actionBtn: { flexDirection: "row", alignItems: "center", gap: spacing.md, padding: spacing.md, borderRadius: radius.md, borderWidth: 1 },
  customizationActionIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F5C451",
  },
  editProfileActionIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#155EEF",
  },
  performanceActionIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F5C451",
  },
  actionCopy: { flex: 1 },
  actionText: { fontWeight: "700" },
  actionMeta: { fontSize: 11, marginTop: 3, fontWeight: "600" },
  modalBackdrop: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "#010713B8",
  },
  customizationSheet: {
    maxHeight: "92%",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    overflow: "hidden",
  },
  profileEditorSheet: {
    width: "100%",
    maxWidth: 430,
    alignSelf: "center",
    maxHeight: "88%",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    overflow: "hidden",
  },
  profileEditorHeader: {
    minHeight: 82,
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderBottomWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  profileEditorContent: {
    padding: 20,
    paddingBottom: 34,
    gap: 24,
  },
  editorAvatarArea: {
    alignItems: "center",
  },
  editorAvatarShell: {
    width: 116,
    height: 116,
    borderRadius: 58,
    borderWidth: 3,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    backgroundColor: "#07182A",
  },
  editorAvatarImage: { width: "100%", height: "100%" },
  photoPickerButton: {
    minHeight: 42,
    marginTop: 14,
    paddingHorizontal: 16,
    borderRadius: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    backgroundColor: "#F5C451",
  },
  photoPickerText: { color: "#07111F", fontSize: 13, fontWeight: "900" },
  removePhotoButton: { minHeight: 34, paddingHorizontal: 12, justifyContent: "center" },
  removePhotoText: { fontSize: 12, fontWeight: "700" },
  editorLabel: { fontSize: 13, fontWeight: "900", marginBottom: 8 },
  editorInput: {
    minHeight: 50,
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 14,
    fontSize: 16,
    fontWeight: "700",
  },
  editorHint: { fontSize: 11, lineHeight: 16, marginTop: 7 },
  editorSaveButton: {
    minHeight: 50,
    borderRadius: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#F5C451",
  },
  editorSaveText: { color: "#07111F", fontSize: 14, fontWeight: "900" },
  sheetHeader: {
    minHeight: 82,
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderBottomWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  sheetTitleGroup: { flex: 1 },
  sheetEyebrow: { fontSize: 10, fontWeight: "900", letterSpacing: 1.5 },
  sheetTitle: { fontSize: 20, lineHeight: 25, fontWeight: "900", marginTop: 2 },
  sheetHeaderActions: { flexDirection: "row", alignItems: "center", gap: 8 },
  sheetBalance: {
    height: 38,
    paddingHorizontal: 10,
    borderRadius: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#07182A",
    borderWidth: 1,
    borderColor: "#F5C45188",
  },
  sheetBalanceValue: { color: "#FFFFFF", fontSize: 14, fontWeight: "900" },
  closeButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  customizationContent: {
    padding: 18,
    paddingBottom: 34,
    gap: 26,
  },
  sectionTitle: { fontSize: 18, fontWeight: "900" },
  sectionSubtitle: { fontSize: 12, lineHeight: 17, marginTop: 3, marginBottom: 12 },
  customizationGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  customizationTile: {
    width: "48.5%",
    minHeight: 132,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  badgePreview: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#FFFFFFCC",
  },
  framePreview: {
    width: 56,
    height: 56,
    borderRadius: 28,
    padding: 4,
    alignItems: "center",
    justifyContent: "center",
  },
  framePreviewInner: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  customizationLabel: {
    minHeight: 32,
    marginTop: 8,
    fontSize: 12,
    lineHeight: 16,
    fontWeight: "800",
    textAlign: "center",
  },
  availabilityPill: {
    minHeight: 20,
    paddingHorizontal: 7,
    borderRadius: 6,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 3,
  },
  availabilityText: { fontSize: 8, fontWeight: "900", letterSpacing: 0.6 },
  selectedMark: {
    position: "absolute",
    right: 7,
    top: 7,
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  unlockLegend: {
    paddingTop: 16,
    borderTopWidth: 1,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 9,
  },
  unlockLegendText: { flex: 1, fontSize: 12, lineHeight: 18 },
  confirmBackdrop: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    backgroundColor: "#010713D9",
  },
  confirmCard: {
    width: "100%",
    maxWidth: 360,
    padding: 22,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: "center",
  },
  confirmIcon: {
    width: 62,
    height: 62,
    borderRadius: 31,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
  },
  confirmTitle: { fontSize: 19, fontWeight: "900", textAlign: "center" },
  confirmCopy: {
    marginTop: 7,
    fontSize: 12,
    lineHeight: 18,
    textAlign: "center",
  },
  confirmBalanceRow: {
    alignSelf: "stretch",
    marginTop: 18,
    marginBottom: 14,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  confirmBalanceAmount: { flexDirection: "row", alignItems: "center", gap: 7 },
  confirmBalanceLabel: { fontSize: 12, fontWeight: "700" },
  confirmBalanceValue: { fontSize: 14, fontWeight: "900" },
  confirmPrimary: {
    width: "100%",
    minHeight: 48,
    borderRadius: 8,
    backgroundColor: "#F5C451",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 12,
  },
  confirmPrimaryText: { color: "#07111F", fontSize: 13, fontWeight: "900" },
  confirmSecondary: {
    width: "100%",
    minHeight: 44,
    marginTop: 9,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  confirmSecondaryText: { fontSize: 13, fontWeight: "800" },
  footer: {
    color: "#D5DEEB",
    textAlign: "center",
    fontSize: 11,
    marginTop: "auto",
    opacity: 0.78,
    textShadowColor: "#000000",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
});
