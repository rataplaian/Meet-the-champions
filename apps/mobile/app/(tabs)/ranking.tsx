import { useMemo, useState } from "react";
import {
  FlatList,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import {
  RANKING_CHAMPIONS,
  RANKING_FANS,
  rankParticipants,
  type RankingAudience,
  type RankingMetric,
  type RankingParticipant,
  type RankingPeriod,
} from "../../src/config/rankingData";
import { radius, spacing, useTheme } from "../../src/theme";
import { hap } from "../../src/utils/haptics";

const CATEGORIES: {
  audience: RankingAudience;
  metric: RankingMetric;
  label: string;
  shortLabel: string;
  icon: keyof typeof Ionicons.glyphMap;
}[] = [
  { audience: "champion", metric: "events", label: "Champion · Eventi fatti", shortLabel: "CHAMPION\nEVENTI", icon: "trophy" },
  { audience: "champion", metric: "minutes", label: "Champion · Minuti con i fan", shortLabel: "CHAMPION\nMINUTI", icon: "time" },
  { audience: "fan", metric: "events", label: "Fan · Eventi fatti", shortLabel: "FAN\nEVENTI", icon: "people" },
  { audience: "fan", metric: "minutes", label: "Fan · Minuti con i Champion", shortLabel: "FAN\nMINUTI", icon: "hourglass" },
];

const PERIODS: { id: RankingPeriod; label: string }[] = [
  { id: "day", label: "Giorno" },
  { id: "week", label: "Settimana" },
  { id: "month", label: "Mese" },
  { id: "year", label: "Anno" },
  { id: "all", label: "Da sempre" },
];

const FAN_COLORS = ["#1677FF", "#13A8A8", "#F5B700", "#EB3B5A", "#7A5AF8"];
const RANKING_BACKGROUND = require("../../assets/images/ranking-bg.png");

export default function RankingScreen() {
  const { tokens } = useTheme();
  const [audience, setAudience] = useState<RankingAudience>("champion");
  const [metric, setMetric] = useState<RankingMetric>("events");
  const [period, setPeriod] = useState<RankingPeriod>("week");

  const selectedCategory = CATEGORIES.find(
    (category) => category.audience === audience && category.metric === metric,
  ) ?? CATEGORIES[0]!;

  const ranking = useMemo(
    () => rankParticipants(
      audience === "champion" ? RANKING_CHAMPIONS : RANKING_FANS,
      period,
      metric,
    ),
    [audience, metric, period],
  );

  return (
    <View style={[styles.screen, { backgroundColor: tokens.bg }]}>
      <Image source={RANKING_BACKGROUND} resizeMode="cover" style={styles.backgroundImage} />
      <LinearGradient
        colors={["#02071144", "#02071177", "#020711AA"]}
        style={StyleSheet.absoluteFill}
      />
      <FlatList
        testID="ranking-list"
        data={ranking}
        numColumns={2}
        keyExtractor={(item) => `${audience}-${metric}-${period}-${item.participant.id}`}
        style={styles.list}
        contentContainerStyle={styles.content}
        columnWrapperStyle={styles.row}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={(
          <View>
          <View style={styles.prizeBanner}>
            <View style={styles.prizeIcon}>
              <Ionicons name="gift" size={22} color="#07111F" />
            </View>
            <View style={styles.prizeCopy}>
              <Text style={styles.prizeTitle}>EVENTI A PREMI</Text>
              <Text style={styles.prizeText}>
                Durante le sfide speciali, i migliori punteggi Champion e Fan possono ottenere premi.
              </Text>
            </View>
          </View>

          <Text style={styles.heading}>Ranking</Text>
          <Text style={styles.subheading}>
            Le classifiche mostrano solo il confronto relativo, senza punteggi numerici.
          </Text>

          <View style={styles.categoryGrid}>
            {CATEGORIES.map((category) => {
              const selected = category.audience === audience && category.metric === metric;
              return (
                <TouchableOpacity
                  key={`${category.audience}-${category.metric}`}
                  testID={`ranking-${category.audience}-${category.metric}`}
                  accessibilityState={{ selected }}
                  onPress={() => {
                    hap.select();
                    setAudience(category.audience);
                    setMetric(category.metric);
                  }}
                  style={[
                    styles.categoryButton,
                    {
                      backgroundColor: selected ? "#0A4BA8" : tokens.surface,
                      borderColor: selected ? "#F5C451" : tokens.border,
                    },
                  ]}
                >
                  <Ionicons
                    name={category.icon}
                    size={18}
                    color={selected ? "#FFD34E" : tokens.primary}
                  />
                  <Text style={[
                    styles.categoryLabel,
                    { color: selected ? "#FFFFFF" : tokens.text },
                  ]}>
                    {category.shortLabel}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <View style={styles.periodRow}>
            {PERIODS.map((item) => {
              const selected = item.id === period;
              return (
                <TouchableOpacity
                  key={item.id}
                  testID={`ranking-period-${item.id}`}
                  accessibilityState={{ selected }}
                  onPress={() => {
                    hap.select();
                    setPeriod(item.id);
                  }}
                  style={[
                    styles.periodButton,
                    {
                      backgroundColor: selected ? "#F5C451" : tokens.surface,
                      borderColor: selected ? "#F5C451" : tokens.border,
                    },
                  ]}
                >
                  <Text style={[
                    styles.periodLabel,
                    { color: selected ? "#07111F" : tokens.textMuted },
                  ]}>
                    {item.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <View style={styles.boardHeading}>
            <View>
              <Text style={styles.boardTitle}>
                {selectedCategory.label}
              </Text>
              <Text style={styles.boardMeta}>
                TOP 20 · {PERIODS.find((item) => item.id === period)?.label.toUpperCase()}
              </Text>
            </View>
            <Ionicons name="podium" size={30} color="#F5C451" />
          </View>
          </View>
        )}
        renderItem={({ item }) => (
          <RankingTile
            participant={item.participant}
            position={item.position}
            barPercent={item.barPercent}
          />
        )}
      />
    </View>
  );
}

function RankingTile({
  participant,
  position,
  barPercent,
}: {
  participant: RankingParticipant;
  position: number;
  barPercent: number;
}) {
  const [imageFailed, setImageFailed] = useState(false);
  const initials = participant.name
    .split(" ")
    .slice(0, 2)
    .map((word) => word[0])
    .join("");
  const placeholderColor = FAN_COLORS[(participant.seed - 1) % FAN_COLORS.length];

  return (
    <View
      style={styles.rankTile}
      accessibilityLabel={`Posizione ${position}, ${participant.name}`}
    >
      <View
        style={[
          styles.portrait,
          { borderColor: position <= 3 ? "#F5C451" : "#F5C45166" },
        ]}
      >
        <View style={[StyleSheet.absoluteFill, { backgroundColor: placeholderColor }]}>
          {participant.photoUrl && !imageFailed ? (
            <Image
              source={{ uri: participant.photoUrl }}
              style={StyleSheet.absoluteFill}
              resizeMode="cover"
              onError={() => setImageFailed(true)}
            />
          ) : (
            <LinearGradient
              colors={["#173E70", "#08182E"]}
              style={styles.anonymousPortrait}
            >
              <Ionicons name="person-circle-outline" size={46} color="#FFFFFFAA" />
              <Text style={styles.initials}>{initials}</Text>
            </LinearGradient>
          )}
        </View>

        <LinearGradient
          colors={["#00000000", "#02071122", "#020711EE"]}
          locations={[0, 0.52, 1]}
          pointerEvents="none"
          style={StyleSheet.absoluteFill}
        />
        <Text style={styles.position}>#{position}</Text>
        <Text numberOfLines={2} style={styles.participantName}>
          {participant.name}
        </Text>
      </View>

      <View style={styles.barTrack}>
        <LinearGradient
          testID={`ranking-bar-${position}`}
          colors={["#FFF1A6", "#F5C451", "#B77A09"]}
          style={[styles.barFill, { height: `${barPercent}%` }]}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  list: { flex: 1, backgroundColor: "transparent" },
  backgroundImage: {
    position: "absolute",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
  },
  content: {
    padding: 14,
    paddingBottom: spacing.xxl,
  },
  row: {
    gap: 10,
    marginBottom: 10,
  },
  prizeBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginHorizontal: -14,
    marginTop: -14,
    marginBottom: spacing.lg,
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: "#F5C451",
  },
  prizeIcon: {
    width: 42,
    height: 42,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF88",
  },
  prizeCopy: { flex: 1 },
  prizeTitle: {
    color: "#07111F",
    fontSize: 13,
    fontWeight: "900",
    letterSpacing: 0,
  },
  prizeText: {
    color: "#223047",
    fontSize: 12,
    lineHeight: 16,
    marginTop: 2,
  },
  heading: {
    color: "#FFFFFF",
    fontSize: 26,
    fontWeight: "900",
    letterSpacing: 0,
    textShadowColor: "#000000",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  subheading: {
    color: "#D5DEEB",
    fontSize: 13,
    lineHeight: 18,
    marginTop: 4,
    marginBottom: spacing.md,
    textShadowColor: "#000000",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  categoryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  categoryButton: {
    width: "48.5%",
    minHeight: 58,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
    borderRadius: radius.sm,
    borderWidth: 1,
  },
  categoryLabel: {
    flex: 1,
    fontSize: 11,
    lineHeight: 15,
    fontWeight: "900",
    letterSpacing: 0,
  },
  periodRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginTop: spacing.md,
  },
  periodButton: {
    minHeight: 34,
    paddingHorizontal: 10,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 8,
    borderWidth: 1,
  },
  periodLabel: {
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 0,
  },
  boardHeading: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: spacing.xl,
    marginBottom: 10,
  },
  boardTitle: {
    color: "#FFFFFF",
    fontSize: 17,
    fontWeight: "900",
    letterSpacing: 0,
    textShadowColor: "#000000",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  boardMeta: {
    color: "#D5DEEB",
    fontSize: 10,
    fontWeight: "800",
    marginTop: 3,
    letterSpacing: 0,
  },
  rankTile: {
    flex: 1,
    maxWidth: "48.7%",
    height: 168,
    flexDirection: "row",
    alignItems: "stretch",
    gap: 8,
  },
  portrait: {
    flex: 1,
    overflow: "hidden",
    borderRadius: radius.sm,
    borderWidth: 1,
    backgroundColor: "#0A2344",
    shadowColor: "#000000",
    shadowOpacity: 0.32,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 5 },
    elevation: 5,
  },
  anonymousPortrait: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 3,
  },
  position: {
    position: "absolute",
    top: 8,
    left: 8,
    zIndex: 2,
    color: "#F5C451",
    fontSize: 14,
    fontWeight: "900",
    letterSpacing: 0,
    textShadowColor: "#000000",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  initials: {
    color: "#FFFFFF",
    fontSize: 24,
    fontWeight: "900",
    letterSpacing: 0,
    textShadowColor: "#00000088",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  barTrack: {
    width: 13,
    height: "100%",
    overflow: "hidden",
    justifyContent: "flex-end",
    borderRadius: 7,
    borderWidth: 1,
    borderColor: "#F5C45155",
    backgroundColor: "#061225CC",
    shadowColor: "#F5C451",
    shadowOpacity: 0.22,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 0 },
  },
  barFill: {
    width: "100%",
    borderTopLeftRadius: 6,
    borderTopRightRadius: 6,
  },
  participantName: {
    position: "absolute",
    left: 9,
    right: 7,
    bottom: 9,
    color: "#FFFFFF",
    fontSize: 11,
    lineHeight: 14,
    fontWeight: "900",
    letterSpacing: 0,
    textShadowColor: "#000000",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
});
