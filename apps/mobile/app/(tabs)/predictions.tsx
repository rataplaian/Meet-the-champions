import { useCallback, useEffect, useState } from "react";
import {
  Alert,
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useFocusEffect } from "expo-router";
import { radius, spacing, useTheme } from "../../src/theme";
import { hap } from "../../src/utils/haptics";
import { INITIAL_MTC_BALANCE, MTC_STORAGE_KEY } from "../../src/config/mtcWallet";

const PREDICTIONS_BACKGROUND = require("../../assets/images/predictions-bg.png");
const MATCH_CARD_BACKGROUND = require("../../assets/images/match-card-bg.png");

interface Match {
  id: string;
  competition: string;
  status: string;
  home: string;
  away: string;
  accent: string;
}

interface PredictionState {
  balance: number;
  picks: Record<string, "home" | "away">;
  redeemed: number[];
  lastPredictionDate?: string;
  dailyPredictionMatchId?: string;
}

const MATCHES: Match[] = [
  { id: "juv-inter", competition: "BIG MATCH · DEMO", status: "LIVE · 62'", home: "Juventus", away: "Inter", accent: "#1677FF" },
  { id: "milan-napoli", competition: "SERIE A · DEMO", status: "LIVE · 31'", home: "Milan", away: "Napoli", accent: "#EB3B5A" },
  { id: "real-barca", competition: "CLASSICO · DEMO", status: "OGGI · 21:00", home: "Real Madrid", away: "Barcelona", accent: "#F5B700" },
  { id: "city-liverpool", competition: "PREMIER · DEMO", status: "DOMANI · 18:30", home: "Man. City", away: "Liverpool", accent: "#13A8A8" },
];

const REWARDS = [
  { cost: 250, discount: 5 },
  { cost: 500, discount: 10 },
  { cost: 900, discount: 15 },
];

const INITIAL_STATE: PredictionState = {
  balance: INITIAL_MTC_BALANCE,
  picks: {},
  redeemed: [],
};

function localDayKey(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export default function PredictionsScreen() {
  const { tokens } = useTheme();
  const [state, setState] = useState<PredictionState>(INITIAL_STATE);
  const [ready, setReady] = useState(false);
  const [dailyNoticeVisible, setDailyNoticeVisible] = useState(false);
  const todayKey = localDayKey();
  const todaysMatchId = state.lastPredictionDate === todayKey
    ? state.dailyPredictionMatchId
    : undefined;

  useFocusEffect(
    useCallback(() => {
      setDailyNoticeVisible(true);
    }, []),
  );

  useEffect(() => {
    let mounted = true;
    AsyncStorage.getItem(MTC_STORAGE_KEY)
      .then((stored) => {
        if (!mounted || !stored) return;
        const parsed = JSON.parse(stored) as Partial<PredictionState>;
        setState({
          ...INITIAL_STATE,
          ...parsed,
          picks: parsed.picks ?? {},
          redeemed: parsed.redeemed ?? [],
        });
      })
      .catch(() => {})
      .finally(() => {
        if (mounted) setReady(true);
      });
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (!ready) return;
    AsyncStorage.setItem(MTC_STORAGE_KEY, JSON.stringify(state)).catch(() => {});
  }, [ready, state]);

  const chooseWinner = (matchId: string, pick: "home" | "away") => {
    if (todaysMatchId && todaysMatchId !== matchId) {
      hap.warning();
      Alert.alert(
        "Limite giornaliero raggiunto",
        "Hai gia registrato il tuo pronostico di oggi. Potrai sceglierne un altro domani.",
      );
      return;
    }
    hap.select();
    setState((current) => ({
      ...current,
      picks: { ...current.picks, [matchId]: pick },
      lastPredictionDate: todayKey,
      dailyPredictionMatchId: matchId,
    }));
  };

  const redeem = (cost: number, discount: number) => {
    if (state.redeemed.includes(discount)) return;
    if (state.balance < cost) {
      hap.warning();
      Alert.alert("MTC insufficienti", "Continua a partecipare ai pronostici per ottenere altri MTC.");
      return;
    }
    hap.success();
    setState((current) => ({
      ...current,
      balance: current.balance - cost,
      redeemed: [...current.redeemed, discount],
    }));
    Alert.alert(
      "Premio riscattato",
      `Sconto demo del ${discount}% pronto per una futura chiamata con un Champion.`,
    );
  };

  return (
    <View style={[styles.screen, { backgroundColor: tokens.bg }]}>
      <Image
        source={PREDICTIONS_BACKGROUND}
        resizeMode="cover"
        style={styles.backgroundImage}
      />
      <LinearGradient
        colors={["#02071122", "#02071166", "#02071188"]}
        locations={[0, 0.45, 1]}
        style={StyleSheet.absoluteFill}
      />
      <ScrollView
        testID="predictions-screen"
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
      <View style={styles.heroBand}>
        <View style={styles.coinMark}>
          <Text style={styles.coinMarkText}>MTC</Text>
        </View>
        <View style={styles.heroCopy}>
          <Text style={styles.heroLabel}>IL TUO SALDO DEMO</Text>
          <Text style={styles.balance}>{state.balance} MTC</Text>
          <Text style={styles.heroText}>
            Indovina il vincitore e accumula coin da usare per gli sconti.
          </Text>
        </View>
      </View>

      <Text style={styles.heading}>Pronostici</Text>
      <Text style={styles.subheading}>
        Scegli chi vincera. Se il pronostico e corretto, il premio MTC arriva alla chiusura della partita.
      </Text>

      <View style={styles.infoStrip}>
        <Ionicons name="information-circle" size={19} color="#0A4BA8" />
        <Text style={styles.infoText}>
          Partite, risultati e ricompense sono simulati nella demo.
        </Text>
      </View>

      <View style={styles.matchList}>
        {MATCHES.map((match) => {
          const pick = state.picks[match.id];
          const dailyLocked = Boolean(todaysMatchId && todaysMatchId !== match.id);
          return (
            <View
              key={match.id}
              style={styles.matchCard}
            >
              <Image
                source={MATCH_CARD_BACKGROUND}
                resizeMode="cover"
                style={StyleSheet.absoluteFill}
              />
              <LinearGradient
                colors={["#02071108", "#02071133"]}
                style={StyleSheet.absoluteFill}
                pointerEvents="none"
              />
              <View style={styles.matchTop}>
                <Text style={[styles.competition, { color: match.accent }]}>{match.competition}</Text>
                <View style={[styles.statusPill, { backgroundColor: match.status.startsWith("LIVE") ? "#EB3B5A" : "#0A4BA8" }]}>
                  <Text style={styles.statusText}>{match.status}</Text>
                </View>
              </View>

              <View style={styles.versusRow}>
                <TeamVote
                  name={match.home}
                  side="home"
                  selected={pick === "home"}
                  locked={dailyLocked}
                  accent={match.accent}
                  onPress={() => chooseWinner(match.id, "home")}
                  tokens={tokens}
                />
                <Text style={styles.versus}>VS</Text>
                <TeamVote
                  name={match.away}
                  side="away"
                  selected={pick === "away"}
                  locked={dailyLocked}
                  accent={match.accent}
                  onPress={() => chooseWinner(match.id, "away")}
                  tokens={tokens}
                />
              </View>

              <View style={styles.pickStatus}>
                <Ionicons
                  name={pick ? "checkmark-circle" : dailyLocked ? "lock-closed" : "radio-button-off"}
                  size={16}
                  color={pick ? "#59D99A" : dailyLocked ? "#F5C451" : "#D5DEEB"}
                />
                <Text style={[
                  styles.pickStatusText,
                  { color: pick ? "#59D99A" : dailyLocked ? "#F5C451" : "#D5DEEB" },
                ]}>
                  {pick
                    ? "Pronostico registrato"
                    : dailyLocked
                      ? "Pronostico giornaliero gia utilizzato"
                      : "Scegli una squadra"}
                </Text>
              </View>
            </View>
          );
        })}
      </View>

      <View style={styles.futureBand}>
        <View style={styles.futureIcon}>
          <Ionicons name="lock-closed" size={22} color="#F5C451" />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.futureTitle}>PUNTATE MTC · IN ARRIVO</Text>
          <Text style={styles.futureText}>
            In futuro potrai puntare coin e vincerne in base alla probabilita del risultato.
          </Text>
        </View>
      </View>

      <View style={styles.rewardHeading}>
        <View>
          <Text style={styles.rewardTitle}>Riscatta uno sconto</Text>
          <Text style={styles.rewardSubtitle}>
            I premi riscattati saranno applicabili alle chiamate.
          </Text>
        </View>
        <Ionicons name="ticket" size={28} color="#F5B700" />
      </View>

      <View style={styles.rewardList}>
        {REWARDS.map((reward) => {
          const redeemed = state.redeemed.includes(reward.discount);
          const affordable = state.balance >= reward.cost;
          return (
            <View
              key={reward.discount}
              style={[styles.rewardRow, { backgroundColor: tokens.surface + "F2", borderColor: tokens.border }]}
            >
              <View style={styles.discountMark}>
                <Text style={styles.discountValue}>-{reward.discount}%</Text>
              </View>
              <View style={styles.rewardCopy}>
                <Text style={[styles.rewardName, { color: tokens.text }]}>
                  Sconto chiamata
                </Text>
                <Text style={[styles.rewardCost, { color: tokens.textMuted }]}>
                  {reward.cost} MTC
                </Text>
              </View>
              <TouchableOpacity
                testID={`redeem-${reward.discount}`}
                disabled={redeemed}
                onPress={() => redeem(reward.cost, reward.discount)}
                style={[
                  styles.redeemButton,
                  {
                    backgroundColor: redeemed ? "#13A86B" : affordable ? "#F5C451" : tokens.bgElevated,
                  },
                ]}
              >
                <Text style={[
                  styles.redeemText,
                  { color: redeemed || affordable ? "#07111F" : tokens.textMuted },
                ]}>
                  {redeemed ? "FATTO" : "RISCATTA"}
                </Text>
              </TouchableOpacity>
            </View>
          );
        })}
      </View>
      </ScrollView>

      <DailyLimitNotice
        visible={dailyNoticeVisible}
        onClose={() => setDailyNoticeVisible(false)}
      />
    </View>
  );
}

function DailyLimitNotice({
  visible,
  onClose,
}: {
  visible: boolean;
  onClose: () => void;
}) {
  return (
    <Modal
      transparent
      animationType="fade"
      visible={visible}
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <View style={styles.limitBackdrop}>
        <View
          testID="daily-prediction-notice"
          accessibilityViewIsModal
          style={styles.limitCard}
        >
          <TouchableOpacity
            accessibilityLabel="Chiudi limite giornaliero"
            onPress={onClose}
            style={styles.limitClose}
          >
            <Ionicons name="close" size={21} color="#68778A" />
          </TouchableOpacity>

          <View style={styles.limitIcon}>
            <Ionicons name="calendar" size={29} color="#07111F" />
          </View>
          <Text style={styles.limitEyebrow}>REGOLA GIORNALIERA</Text>
          <Text style={styles.limitTitle}>Una scelta al giorno</Text>
          <Text style={styles.limitBody}>
            Puoi registrare massimo 1 pronostico al giorno.
          </Text>

          <View style={styles.limitDivider} />

          <View style={styles.limitFutureRow}>
            <Ionicons name="lock-closed" size={18} color="#F5C451" />
            <Text style={styles.limitFutureText}>
              Quando le puntate saranno disponibili, avrai anche 1 scommessa al giorno.
            </Text>
          </View>

          <TouchableOpacity
            testID="daily-prediction-notice-close"
            onPress={onClose}
            style={styles.limitAction}
          >
            <Text style={styles.limitActionText}>HO CAPITO</Text>
            <Ionicons name="checkmark" size={18} color="#07111F" />
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

function TeamVote({
  name,
  side,
  selected,
  locked,
  accent,
  onPress,
  tokens,
}: {
  name: string;
  side: "home" | "away";
  selected: boolean;
  locked: boolean;
  accent: string;
  onPress: () => void;
  tokens: ReturnType<typeof useTheme>["tokens"];
}) {
  return (
    <TouchableOpacity
      testID={`vote-${side}-${name.replace(/\s+/g, "-").toLowerCase()}`}
      accessibilityState={{ selected }}
      accessibilityHint={locked ? "Il pronostico giornaliero e gia stato utilizzato" : undefined}
      onPress={onPress}
      style={[
        styles.teamButton,
        {
          backgroundColor: selected ? accent : locked ? "#07111FDD" : tokens.bgElevated + "F2",
          borderColor: selected ? accent : locked ? "#F5C45155" : tokens.border,
        },
      ]}
    >
      <View style={[
        styles.teamCrest,
        { backgroundColor: selected ? "#FFFFFFDD" : accent },
      ]}>
        <Ionicons name="football" size={20} color={selected ? accent : "#FFFFFF"} />
      </View>
      <Text
        numberOfLines={2}
        style={[styles.teamName, { color: selected || locked ? "#FFFFFF" : tokens.text }]}
      >
        {name}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  scroll: { flex: 1, backgroundColor: "transparent" },
  backgroundImage: {
    position: "absolute",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
  },
  content: { paddingBottom: spacing.xxl },
  heroBand: {
    minHeight: 138,
    padding: 18,
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    backgroundColor: "#0A4BA8EE",
    borderBottomWidth: 4,
    borderBottomColor: "#F5C451",
  },
  coinMark: {
    width: 74,
    height: 74,
    borderRadius: 37,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F5C451",
    borderWidth: 4,
    borderColor: "#FFF2B0",
  },
  coinMarkText: {
    color: "#07111F",
    fontSize: 18,
    fontWeight: "900",
    letterSpacing: 0,
  },
  heroCopy: { flex: 1 },
  heroLabel: { color: "#BFD5FF", fontSize: 10, fontWeight: "900", letterSpacing: 0 },
  balance: { color: "#FFFFFF", fontSize: 30, lineHeight: 36, fontWeight: "900", letterSpacing: 0 },
  heroText: { color: "#E5EEFF", fontSize: 12, lineHeight: 16 },
  heading: {
    marginTop: spacing.lg,
    marginHorizontal: spacing.lg,
    fontSize: 26,
    fontWeight: "900",
    letterSpacing: 0,
    color: "#FFFFFF",
    textShadowColor: "#000000",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  subheading: {
    marginHorizontal: spacing.lg,
    marginTop: 4,
    fontSize: 13,
    lineHeight: 18,
    color: "#D5DEEB",
    textShadowColor: "#000000",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  infoStrip: {
    margin: spacing.lg,
    marginBottom: spacing.md,
    padding: 11,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderRadius: radius.sm,
    backgroundColor: "#DCEAFFEE",
  },
  infoText: {
    flex: 1,
    color: "#174C9A",
    fontSize: 11,
    lineHeight: 15,
    fontWeight: "700",
  },
  matchList: {
    paddingHorizontal: spacing.lg,
    gap: 10,
  },
  matchCard: {
    overflow: "hidden",
    padding: 13,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: "#F5C451AA",
    backgroundColor: "#07111F",
  },
  matchTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 11,
  },
  competition: {
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 0,
  },
  statusPill: {
    minHeight: 25,
    paddingHorizontal: 9,
    borderRadius: 7,
    alignItems: "center",
    justifyContent: "center",
  },
  statusText: {
    color: "#FFFFFF",
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 0,
  },
  versusRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  versus: {
    color: "#D5DEEB",
    width: 22,
    textAlign: "center",
    fontSize: 10,
    fontWeight: "900",
  },
  teamButton: {
    flex: 1,
    minHeight: 76,
    padding: 9,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderRadius: radius.sm,
    borderWidth: 1,
  },
  teamCrest: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
  },
  teamName: {
    flex: 1,
    fontSize: 12,
    lineHeight: 15,
    fontWeight: "800",
    letterSpacing: 0,
  },
  pickStatus: {
    minHeight: 27,
    marginTop: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
  },
  pickStatusText: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0,
  },
  futureBand: {
    marginTop: spacing.xl,
    padding: spacing.lg,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "#07111F",
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: "#F5C45166",
  },
  futureIcon: {
    width: 44,
    height: 44,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F5C4511F",
  },
  futureTitle: {
    color: "#F5C451",
    fontSize: 12,
    fontWeight: "900",
    letterSpacing: 0,
  },
  futureText: {
    color: "#D5DEEB",
    fontSize: 11,
    lineHeight: 16,
    marginTop: 3,
  },
  rewardHeading: {
    marginTop: spacing.xl,
    marginHorizontal: spacing.lg,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  rewardTitle: {
    color: "#FFFFFF",
    fontSize: 19,
    fontWeight: "900",
    letterSpacing: 0,
    textShadowColor: "#000000",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  rewardSubtitle: {
    color: "#D5DEEB",
    fontSize: 11,
    marginTop: 2,
    textShadowColor: "#000000",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  rewardList: {
    margin: spacing.lg,
    marginTop: spacing.md,
    gap: 9,
  },
  rewardRow: {
    minHeight: 70,
    padding: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderRadius: radius.sm,
    borderWidth: 1,
  },
  discountMark: {
    width: 48,
    height: 48,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#0A4BA8",
  },
  discountValue: { color: "#FFFFFF", fontSize: 14, fontWeight: "900", letterSpacing: 0 },
  rewardCopy: { flex: 1 },
  rewardName: { fontSize: 13, fontWeight: "800", letterSpacing: 0 },
  rewardCost: { fontSize: 11, marginTop: 2 },
  redeemButton: {
    minWidth: 76,
    minHeight: 36,
    paddingHorizontal: 10,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  redeemText: { fontSize: 10, fontWeight: "900", letterSpacing: 0 },
  limitBackdrop: {
    flex: 1,
    padding: 24,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#010713CC",
  },
  limitCard: {
    width: "100%",
    maxWidth: 360,
    paddingHorizontal: 22,
    paddingTop: 25,
    paddingBottom: 20,
    alignItems: "center",
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: "#F5C451",
    backgroundColor: "#F8FAFD",
    boxShadow: "0 14px 34px rgba(0, 0, 0, 0.48)",
  },
  limitClose: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 34,
    height: 34,
    alignItems: "center",
    justifyContent: "center",
  },
  limitIcon: {
    width: 58,
    height: 58,
    borderRadius: 29,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F5C451",
    borderWidth: 3,
    borderColor: "#FFF0B5",
  },
  limitEyebrow: {
    marginTop: 14,
    color: "#0A4BA8",
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 0,
  },
  limitTitle: {
    marginTop: 5,
    color: "#07111F",
    fontSize: 21,
    lineHeight: 26,
    fontWeight: "900",
    letterSpacing: 0,
    textAlign: "center",
  },
  limitBody: {
    marginTop: 8,
    color: "#435269",
    fontSize: 13,
    lineHeight: 19,
    textAlign: "center",
  },
  limitDivider: {
    width: "100%",
    height: 1,
    marginVertical: 15,
    backgroundColor: "#DCE2E9",
  },
  limitFutureRow: {
    width: "100%",
    padding: 11,
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
    borderRadius: radius.sm,
    backgroundColor: "#07182A",
  },
  limitFutureText: {
    flex: 1,
    color: "#E7EDF5",
    fontSize: 11,
    lineHeight: 16,
  },
  limitAction: {
    width: "100%",
    minHeight: 45,
    marginTop: 16,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    borderRadius: radius.sm,
    backgroundColor: "#F5C451",
  },
  limitActionText: {
    color: "#07111F",
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 0,
  },
});
