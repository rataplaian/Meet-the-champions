// Countdown pill — shows time remaining until a scheduled event.
// Automatically switches to "Live" / "Ended" states.
import { useEffect, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { useTheme } from "../theme";

interface Props {
  startsAt: string; // ISO
  durationMinutes: number;
  size?: "sm" | "md";
}

function format(diffMs: number): { primary: string; label: string } {
  const abs = Math.abs(diffMs);
  const days = Math.floor(abs / 86400000);
  const hours = Math.floor((abs % 86400000) / 3600000);
  const mins = Math.floor((abs % 3600000) / 60000);
  const secs = Math.floor((abs % 60000) / 1000);
  if (days > 0) return { primary: `${days}g ${hours}h`, label: "TRA" };
  if (hours > 0) return { primary: `${hours}h ${mins}m`, label: "TRA" };
  if (mins > 0) return { primary: `${mins}m ${secs}s`, label: "TRA" };
  return { primary: `${secs}s`, label: "TRA" };
}

export function CountdownPill({ startsAt, durationMinutes, size = "md" }: Props) {
  const { tokens } = useTheme();
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  const start = new Date(startsAt).getTime();
  const end = start + durationMinutes * 60_000;
  const diff = start - now;

  let bg = tokens.accent + "22";
  let color = tokens.accent;
  let label = "TRA";
  let primary = "";

  if (now < start) {
    const f = format(diff);
    primary = f.primary;
    label = "TRA";
  } else if (now >= start && now < end) {
    bg = "#2ED47A22";
    color = "#2ED47A";
    label = "LIVE";
    primary = "ora";
  } else {
    bg = tokens.textMuted + "22";
    color = tokens.textMuted;
    label = "TERMINATA";
    primary = "";
  }

  const isSm = size === "sm";

  return (
    <View style={[styles.pill, { backgroundColor: bg }, isSm && styles.pillSm]}>
      {label === "LIVE" && <View style={[styles.dot, { backgroundColor: color }]} />}
      <Text style={{ color, fontSize: isSm ? 10 : 11, fontWeight: "800", letterSpacing: 1 }}>
        {label}
      </Text>
      {primary ? (
        <Text style={{ color, fontSize: isSm ? 11 : 13, fontWeight: "800" }}>{primary}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    alignSelf: "flex-start",
  },
  pillSm: { paddingHorizontal: 8, paddingVertical: 3, gap: 4 },
  dot: { width: 7, height: 7, borderRadius: 999 },
});
