import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Dimensions,
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useFocusEffect, useRouter } from "expo-router";
import Animated, { FadeIn } from "react-native-reanimated";
import {
  champions as champStore,
  favorites as favoriteStore,
  type Champion,
} from "../../src/store";
import { radius, spacing } from "../../src/theme";
import { SkeletonCard } from "../../src/components/Skeleton";
import { hap } from "../../src/utils/haptics";
import { championCardPhotoUri } from "../../src/utils/championPhotos";
import { CoverflowRail } from "../../src/components/CoverflowRail";
import { MtcCoin } from "../../src/components/MtcCoin";
import { INITIAL_MTC_BALANCE, readMtcBalance } from "../../src/config/mtcWallet";

const HUB_BACKGROUND = require("../../assets/images/champions-hub-bg.jpg");

const HUB_RAILS = [
  {
    key: "all",
    label: "TUTTI",
    icon: "apps-outline" as const,
    includes: (_champion: Champion) => true,
  },
  {
    key: "coaches",
    label: "ALLENATORI",
    icon: "clipboard-outline" as const,
    includes: (champion: Champion) => champion.category === "coach",
  },
  {
    key: "serie-a",
    label: "SERIE A",
    icon: "shield-outline" as const,
    includes: (champion: Champion) => champion.italianLeagues?.includes("serie-a") ?? false,
  },
  {
    key: "serie-b",
    label: "SERIE B",
    icon: "shield-outline" as const,
    includes: (champion: Champion) => champion.italianLeagues?.includes("serie-b") ?? false,
  },
  {
    key: "serie-c",
    label: "SERIE C",
    icon: "shield-outline" as const,
    includes: (champion: Champion) => champion.italianLeagues?.includes("serie-c") ?? false,
  },
  {
    key: "serie-d",
    label: "SERIE D",
    icon: "shield-outline" as const,
    includes: (champion: Champion) => champion.italianLeagues?.includes("serie-d") ?? false,
  },
  {
    key: "legend",
    label: "LEGEND",
    icon: "trophy-outline" as const,
    includes: (champion: Champion) => champion.category === "expert",
  },
] as const;

const { width: SCREEN_W } = Dimensions.get("window");
const SKEL_W = Math.min(220, Math.round(SCREEN_W * 0.56));
const WARMED_PHOTOS = new Set<string>();

async function warmChampionPhotos(list: Champion[]) {
  const urls = [...new Set(list.map((champion) => championCardPhotoUri(champion.photoUrl)))]
    .filter((url) => !WARMED_PHOTOS.has(url));

  await Promise.allSettled(
    urls.map(async (url) => {
      const loaded = await Image.prefetch(url);
      if (loaded !== false) WARMED_PHOTOS.add(url);
    }),
  );
}

export default function Explore() {
  const router = useRouter();
  const [data, setData] = useState<Champion[]>([]);
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [mtcBalance, setMtcBalance] = useState(INITIAL_MTC_BALANCE);
  const [walletOpen, setWalletOpen] = useState(false);

  const load = useCallback(async () => {
    const [list, savedFavorites] = await Promise.all([
      champStore.list(),
      favoriteStore.list(),
    ]);
    await warmChampionPhotos(list);
    setData(list);
    setFavoriteIds(new Set(savedFavorites));
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      readMtcBalance().then((balance) => {
        if (active) setMtcBalance(balance);
      });
      return () => {
        active = false;
      };
    }, []),
  );

  const rails = useMemo(() => {
    const q = query.trim().toLowerCase();
    const matching = q
      ? data.filter((champion) =>
        champion.name.toLowerCase().includes(q) ||
        champion.team.toLowerCase().includes(q) ||
        String(champion.age) === q)
      : data;

    return HUB_RAILS
      .map((rail) => ({
        ...rail,
        champions: matching.filter(rail.includes),
      }))
      .filter((rail) => rail.champions.length > 0);
  }, [data, query]);

  const toggleFavorite = useCallback(async (championId: string) => {
    const wasFavorite = favoriteIds.has(championId);
    const next = new Set(favoriteIds);
    if (wasFavorite) next.delete(championId);
    else next.add(championId);
    setFavoriteIds(next);
    if (wasFavorite) hap.light();
    else hap.success();
    await favoriteStore.set(championId, !wasFavorite);
  }, [favoriteIds]);

  return (
    <View style={styles.screen}>
      <Image
        source={HUB_BACKGROUND}
        resizeMode="contain"
        style={[StyleSheet.absoluteFill, styles.hubBackground]}
      />
      <LinearGradient
        colors={["#02091500", "#02091508", "#0209152B"]}
        locations={[0, 0.45, 1]}
        style={[StyleSheet.absoluteFill, styles.noPointerEvents]}
      />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.walletRow}>
          <TouchableOpacity
            testID="mtc-wallet-button"
            accessibilityLabel={`Saldo MTC, ${mtcBalance} coin. Apri informazioni`}
            onPress={() => {
              hap.select();
              setWalletOpen(true);
            }}
            style={styles.walletButton}
          >
            <MtcCoin size={28} />
            <View style={styles.walletBalanceCopy}>
              <Text style={styles.walletBalance}>{mtcBalance}</Text>
              <Text style={styles.walletLabel}>MTC COIN</Text>
            </View>
            <Ionicons name="chevron-down" size={16} color="#F5C451" />
          </TouchableOpacity>
        </View>

        <View style={styles.searchWrap}>
          <Ionicons name="search" size={18} color="#174C9A" />
          <TextInput
            testID="search-input"
            value={query}
            onChangeText={setQuery}
            placeholder="Cerca per nome, squadra o età…"
            placeholderTextColor="#66758A"
            autoCorrect={false}
            autoCapitalize="none"
            style={styles.searchInput}
          />
          {query.length > 0 && (
            <TouchableOpacity
              accessibilityRole="button"
              accessibilityLabel="Cancella ricerca"
              onPress={() => setQuery("")}
            >
              <Ionicons name="close-circle" size={19} color="#66758A" />
            </TouchableOpacity>
          )}
        </View>

        {loading ? (
          <View style={styles.loadingSection}>
            <SectionHeader label="TUTTI" count={0} icon="apps-outline" />
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.skeletons}
            >
              {[0, 1, 2, 3].map((index) => (
                <SkeletonCard
                  key={index}
                  width={SKEL_W}
                  height={Math.round(SKEL_W * 1.55)}
                />
              ))}
            </ScrollView>
          </View>
        ) : rails.length === 0 ? (
          <Animated.View entering={FadeIn} style={styles.empty}>
            <View style={styles.emptyIcon}>
              <Ionicons name="search" size={28} color="#FFD34E" />
            </View>
            <Text style={styles.emptyTitle}>Nessun risultato</Text>
            <Text style={styles.emptyCopy}>Prova un altro nome o squadra</Text>
          </Animated.View>
        ) : (
          rails.map((rail) => (
            <View key={rail.key} style={styles.railSection}>
              <SectionHeader
                label={rail.label}
                count={rail.champions.length}
                icon={rail.icon}
              />
              <CoverflowRail
                data={rail.champions}
                favoriteIds={favoriteIds}
                onToggleFavorite={toggleFavorite}
                testID={`rail-${rail.key}`}
                cardTestIdPrefix={`${rail.key}-card-`}
                primary={rail.key === "all"}
              />
            </View>
          ))
        )}
      </ScrollView>

      <MtcWalletSheet
        visible={walletOpen}
        balance={mtcBalance}
        onClose={() => setWalletOpen(false)}
        onOpenPredictions={() => {
          setWalletOpen(false);
          router.push("/(tabs)/predictions");
        }}
      />
    </View>
  );
}

function MtcWalletSheet({
  visible,
  balance,
  onClose,
  onOpenPredictions,
}: {
  visible: boolean;
  balance: number;
  onClose: () => void;
  onOpenPredictions: () => void;
}) {
  return (
    <Modal
      transparent
      animationType="slide"
      visible={visible}
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <View style={styles.walletBackdrop}>
        <TouchableOpacity
          accessibilityLabel="Chiudi informazioni MTC"
          onPress={onClose}
          style={StyleSheet.absoluteFill}
        />
        <View testID="mtc-wallet-sheet" style={styles.walletSheet}>
          <View style={styles.sheetHandle} />
          <View style={styles.sheetHeader}>
            <MtcCoin size={52} />
            <View style={styles.sheetHeaderCopy}>
              <Text style={styles.sheetEyebrow}>IL TUO WALLET</Text>
              <Text style={styles.sheetBalance}>{balance} MTC</Text>
            </View>
            <TouchableOpacity
              accessibilityLabel="Chiudi"
              onPress={onClose}
              style={styles.sheetClose}
            >
              <Ionicons name="close" size={22} color="#607086" />
            </TouchableOpacity>
          </View>

          <ScrollView
            testID="mtc-wallet-scroll"
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.walletContent}
          >
            <Text style={styles.walletTitle}>Cosa sono gli MTC Coin?</Text>
            <Text style={styles.walletBody}>
              Sono i coin della community Meet the Champion. Premiano partecipazione,
              affidabilita e coinvolgimento e possono essere usati per ottenere vantaggi
              ed esperienze speciali.
            </Text>

            <WalletInfoSection
              icon="add-circle"
              title="Come ottenerli"
              items={[
                "Registrandoti a Meet the Champion.",
                "Verificando email e numero di telefono.",
                "Invitando amici con il tuo link personale.",
                "Partecipando ed essendo attivo nella community.",
                "Contattando e prenotando esperienze con i Champion.",
              ]}
            />

            <WalletInfoSection
              icon="football"
              title="Pronostici e puntate"
              items={[
                "Indovina il risultato delle partite importanti per ricevere MTC.",
                "In futuro potrai puntare i tuoi coin sulle squadre.",
                "La possibile vincita dipendera dal moltiplicatore assegnato a ogni squadra.",
              ]}
            />

            <WalletInfoSection
              icon="gift"
              title="Come spenderli"
              items={[
                "Sconti su chiamate ed esperienze con i Champion.",
                "Gadget esclusivi Meet the Champion.",
                "Premi unici disponibili solo per un periodo limitato.",
              ]}
            />

            <View style={styles.walletNote}>
              <Ionicons name="information-circle" size={18} color="#0A4BA8" />
              <Text style={styles.walletNoteText}>
                Accrediti, puntate e ricompense mostrate nella preview sono simulati.
              </Text>
            </View>

            <TouchableOpacity
              testID="mtc-open-predictions"
              onPress={onOpenPredictions}
              style={styles.predictionsButton}
            >
              <Ionicons name="football-outline" size={20} color="#07111F" />
              <Text style={styles.predictionsButtonText}>VAI AI PRONOSTICI</Text>
              <Ionicons name="arrow-forward" size={18} color="#07111F" />
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

function WalletInfoSection({
  icon,
  title,
  items,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  items: string[];
}) {
  return (
    <View style={styles.walletSection}>
      <View style={styles.walletSectionHeader}>
        <View style={styles.walletSectionIcon}>
          <Ionicons name={icon} size={20} color="#F5C451" />
        </View>
        <Text style={styles.walletSectionTitle}>{title}</Text>
      </View>
      {items.map((item) => (
        <View key={item} style={styles.walletBulletRow}>
          <View style={styles.walletBullet} />
          <Text style={styles.walletBulletText}>{item}</Text>
        </View>
      ))}
    </View>
  );
}

function SectionHeader({
  label,
  count,
  icon,
}: {
  label: string;
  count: number;
  icon: keyof typeof Ionicons.glyphMap;
}) {
  return (
    <View style={styles.sectionHeader}>
      <View style={styles.sectionTitleWrap}>
        <View style={styles.goldRule} />
        <Ionicons name={icon} size={16} color="#FFD34E" />
        <Text style={styles.sectionTitle}>{label}</Text>
      </View>
      {count > 0 ? (
        <Text style={styles.sectionCount}>
          {count === 1 ? "1 CHAMPION" : `${count} CHAMPIONS`}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#031027",
  },
  scroll: {
    flex: 1,
    backgroundColor: "transparent",
  },
  hubBackground: {
    backgroundColor: "#031027",
  },
  noPointerEvents: {
    pointerEvents: "none",
  },
  content: {
    paddingTop: spacing.sm,
    paddingBottom: spacing.xxl,
  },
  walletRow: {
    minHeight: 46,
    paddingHorizontal: spacing.md,
    flexDirection: "row",
    justifyContent: "flex-end",
  },
  walletButton: {
    minWidth: 116,
    height: 42,
    paddingHorizontal: 9,
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: "#F5C451AA",
    backgroundColor: "#07172BED",
    shadowColor: "#000000",
    shadowOpacity: 0.25,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 5,
  },
  walletBalanceCopy: { minWidth: 42 },
  walletBalance: {
    color: "#FFFFFF",
    fontSize: 14,
    lineHeight: 16,
    fontWeight: "900",
    letterSpacing: 0,
  },
  walletLabel: {
    color: "#F5C451",
    fontSize: 7,
    lineHeight: 9,
    fontWeight: "900",
    letterSpacing: 0,
  },
  searchWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginHorizontal: spacing.md,
    marginTop: spacing.sm,
    marginBottom: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    borderRadius: radius.pill,
    borderWidth: 1.5,
    borderColor: "#E8B93A",
    backgroundColor: "#F8FBFFEE",
    shadowColor: "#000000",
    shadowOpacity: 0.24,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
  searchInput: {
    flex: 1,
    color: "#07111F",
    fontSize: 14,
    padding: 0,
    outlineStyle: "none" as any,
  },
  loadingSection: {
    marginTop: spacing.sm,
  },
  skeletons: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    gap: 12,
  },
  railSection: {
    marginTop: spacing.sm,
  },
  sectionHeader: {
    minHeight: 38,
    paddingHorizontal: spacing.md,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  sectionTitleWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  goldRule: {
    width: 4,
    height: 22,
    borderRadius: 2,
    backgroundColor: "#FFD34E",
    shadowColor: "#FFD34E",
    shadowOpacity: 0.7,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 0 },
  },
  sectionTitle: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "900",
    letterSpacing: 0,
    textShadowColor: "#000000CC",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 5,
  },
  sectionCount: {
    color: "#D7E6FF",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0,
    textShadowColor: "#000000",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  empty: {
    minHeight: 360,
    padding: 40,
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  emptyIcon: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: "#071B38DD",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#FFD34E88",
  },
  emptyTitle: {
    color: "#FFFFFF",
    fontWeight: "800",
    fontSize: 17,
  },
  emptyCopy: {
    color: "#D7E6FF",
    fontSize: 12,
    textAlign: "center",
  },
  walletBackdrop: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "#010713B8",
  },
  walletSheet: {
    width: "100%",
    maxHeight: "88%",
    overflow: "hidden",
    borderTopLeftRadius: radius.sm,
    borderTopRightRadius: radius.sm,
    borderTopWidth: 2,
    borderColor: "#F5C451",
    backgroundColor: "#F7F9FC",
  },
  sheetHandle: {
    alignSelf: "center",
    width: 42,
    height: 4,
    marginTop: 8,
    borderRadius: 2,
    backgroundColor: "#BCC6D3",
  },
  sheetHeader: {
    minHeight: 80,
    paddingHorizontal: 18,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#DCE2E9",
  },
  sheetHeaderCopy: { flex: 1 },
  sheetEyebrow: {
    color: "#0A4BA8",
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 0,
  },
  sheetBalance: {
    marginTop: 2,
    color: "#07111F",
    fontSize: 24,
    lineHeight: 29,
    fontWeight: "900",
    letterSpacing: 0,
  },
  sheetClose: {
    width: 38,
    height: 38,
    alignItems: "center",
    justifyContent: "center",
  },
  walletContent: {
    paddingHorizontal: 18,
    paddingTop: 18,
    paddingBottom: 32,
  },
  walletTitle: {
    color: "#07111F",
    fontSize: 20,
    lineHeight: 25,
    fontWeight: "900",
    letterSpacing: 0,
  },
  walletBody: {
    marginTop: 7,
    color: "#46566C",
    fontSize: 13,
    lineHeight: 19,
  },
  walletSection: {
    paddingVertical: 18,
    borderBottomWidth: 1,
    borderBottomColor: "#DCE2E9",
  },
  walletSectionHeader: {
    marginBottom: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
  },
  walletSectionIcon: {
    width: 34,
    height: 34,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#0A2344",
  },
  walletSectionTitle: {
    color: "#07111F",
    fontSize: 15,
    fontWeight: "900",
    letterSpacing: 0,
  },
  walletBulletRow: {
    minHeight: 28,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 9,
  },
  walletBullet: {
    width: 6,
    height: 6,
    marginTop: 6,
    borderRadius: 3,
    backgroundColor: "#F5B700",
  },
  walletBulletText: {
    flex: 1,
    color: "#46566C",
    fontSize: 12,
    lineHeight: 17,
  },
  walletNote: {
    marginTop: 18,
    padding: 11,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderRadius: radius.sm,
    backgroundColor: "#DCEAFF",
  },
  walletNoteText: {
    flex: 1,
    color: "#174C9A",
    fontSize: 10,
    lineHeight: 14,
    fontWeight: "700",
  },
  predictionsButton: {
    minHeight: 48,
    marginTop: 14,
    paddingHorizontal: 15,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderRadius: radius.sm,
    backgroundColor: "#F5C451",
  },
  predictionsButtonText: {
    color: "#07111F",
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 0,
  },
});
