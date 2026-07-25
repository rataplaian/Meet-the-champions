import { SEED_CHAMPIONS } from "../store/seed";

export type RankingPeriod = "day" | "week" | "month" | "year" | "all";
export type RankingMetric = "events" | "minutes";
export type RankingAudience = "champion" | "fan";

export interface RankingParticipant {
  id: string;
  name: string;
  subtitle: string;
  photoUrl?: string;
  seed: number;
}

const EXTRA_CHAMPIONS = [
  { id: "rank-totti", name: "Francesco Totti", subtitle: "Legend" },
  { id: "rank-pirlo", name: "Andrea Pirlo", subtitle: "Legend" },
  { id: "rank-cannavaro", name: "Fabio Cannavaro", subtitle: "Legend" },
  { id: "rank-zanetti", name: "Javier Zanetti", subtitle: "Legend" },
];

export const RANKING_CHAMPIONS: RankingParticipant[] = [
  ...SEED_CHAMPIONS.map((champion, index) => ({
    id: champion.id,
    name: champion.name,
    subtitle: champion.team,
    photoUrl: champion.photoUrl,
    seed: index + 1,
  })),
  ...EXTRA_CHAMPIONS.map((champion, index) => ({
    ...champion,
    seed: SEED_CHAMPIONS.length + index + 1,
  })),
].slice(0, 20);

const FAN_NAMES = [
  "Giulia Rossi",
  "Marco Bianchi",
  "Sofia Romano",
  "Luca Conti",
  "Elena Ricci",
  "Davide Marino",
  "Chiara Costa",
  "Andrea Greco",
  "Sara Gallo",
  "Matteo Bruno",
  "Alice Moretti",
  "Simone Rizzo",
  "Martina Lombardi",
  "Federico Serra",
  "Laura De Luca",
  "Alessio Fontana",
  "Emma Caruso",
  "Nicolo Ferri",
  "Beatrice Villa",
  "Tommaso Leone",
];

export const RANKING_FANS: RankingParticipant[] = FAN_NAMES.map((name, index) => ({
  id: `rank-fan-${index + 1}`,
  name,
  subtitle: "Fan",
  seed: index + 1,
}));

const PERIOD_FACTOR: Record<RankingPeriod, number> = {
  day: 0.006,
  week: 0.025,
  month: 0.09,
  year: 0.55,
  all: 1,
};

const PERIOD_INDEX: Record<RankingPeriod, number> = {
  day: 1,
  week: 2,
  month: 3,
  year: 4,
  all: 5,
};

export function rankParticipants(
  participants: RankingParticipant[],
  period: RankingPeriod,
  metric: RankingMetric,
) {
  const factor = PERIOD_FACTOR[period];
  const periodIndex = PERIOD_INDEX[period];
  const ranked = participants
    .map((participant) => {
      const baseEvents = 2280 - participant.seed * 79 + ((participant.seed * 17) % 53);
      const events = Math.max(
        1,
        Math.round(baseEvents * factor + ((participant.seed * 7 + periodIndex * 5) % 9)),
      );
      const score = metric === "events"
        ? events
        : events * (14 + (participant.seed % 13)) + ((participant.seed * 23) % 47);
      return { participant, score };
    })
    .sort((a, b) => b.score - a.score);

  const maxScore = ranked[0]?.score ?? 1;
  return ranked.map((entry, index) => ({
    ...entry,
    position: index + 1,
    barPercent: 24 + Math.round((entry.score / maxScore) * 76),
  }));
}
