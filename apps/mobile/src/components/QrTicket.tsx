// Beautiful faux "QR ticket" — draws a stylized QR-like grid using pure Views.
// Deterministically seeded from the booking ID so every ticket looks unique yet reproducible.
import { useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useTheme } from "../theme";

// Simple deterministic PRNG based on string hash.
function seed(str: string): () => number {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619) >>> 0;
  }
  return () => {
    h = Math.imul(h ^ (h >>> 15), 2246822507) >>> 0;
    h = Math.imul(h ^ (h >>> 13), 3266489909) >>> 0;
    h ^= h >>> 16;
    return (h >>> 0) / 4294967296;
  };
}

const SIZE = 21; // 21x21 QR-like grid

export function QrTicket({ code, size = 168 }: { code: string; size?: number }) {
  const { tokens } = useTheme();

  const cells = useMemo(() => {
    const rng = seed(code);
    const grid: boolean[][] = [];
    for (let r = 0; r < SIZE; r++) {
      const row: boolean[] = [];
      for (let c = 0; c < SIZE; c++) row.push(rng() > 0.5);
      grid.push(row);
    }
    // Draw the classic finder squares in 3 corners to look authentic.
    const drawFinder = (or: number, oc: number) => {
      for (let r = 0; r < 7; r++) {
        for (let c = 0; c < 7; c++) {
          const isBorder = r === 0 || r === 6 || c === 0 || c === 6;
          const isCenter = r >= 2 && r <= 4 && c >= 2 && c <= 4;
          grid[or + r]![oc + c] = isBorder || isCenter;
        }
      }
    };
    drawFinder(0, 0);
    drawFinder(0, SIZE - 7);
    drawFinder(SIZE - 7, 0);
    return grid;
  }, [code]);

  const cellSize = size / SIZE;

  return (
    <View style={[styles.wrap, { width: size + 24, backgroundColor: "#F7FAFC", borderColor: tokens.accent }]}>
      <View style={{ width: size, height: size, flexDirection: "column" }}>
        {cells.map((row, ri) => (
          <View key={ri} style={{ flexDirection: "row", height: cellSize }}>
            {row.map((v, ci) => (
              <View
                key={ci}
                style={{
                  width: cellSize,
                  height: cellSize,
                  backgroundColor: v ? "#08142D" : "transparent",
                }}
              />
            ))}
          </View>
        ))}
      </View>
      <View style={{ marginTop: 10, alignItems: "center" }}>
        <Text style={{ color: "#08142D", fontSize: 10, letterSpacing: 3, fontWeight: "800" }}>MEET CHAMPION</Text>
        <Text style={{ color: "#08142D99", fontSize: 9, fontFamily: "monospace", marginTop: 2 }}>
          {code.slice(-14).toUpperCase()}
        </Text>
      </View>
    </View>
  );
}

// Wrapper with the fancy "ticket" cut-out edges + gradient border.
export function TicketFrame({ children, accent }: { children: React.ReactNode; accent: string }) {
  return (
    <View style={{ padding: 2, borderRadius: 26 }}>
      <LinearGradient
        colors={[accent + "aa", accent + "22", accent + "aa"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ borderRadius: 26, padding: 2 }}
      >
        <View style={{ borderRadius: 24, backgroundColor: "#0B1735", overflow: "hidden" }}>
          {children}
          <View style={styles.notchL} />
          <View style={styles.notchR} />
        </View>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    padding: 12,
    borderRadius: 16,
    alignItems: "center",
    borderWidth: 2,
    alignSelf: "center",
  },
  notchL: {
    position: "absolute",
    left: -14,
    top: "58%",
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#07111F",
  },
  notchR: {
    position: "absolute",
    right: -14,
    top: "58%",
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#07111F",
  },
});
