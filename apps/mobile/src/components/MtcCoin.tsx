import { Image, StyleSheet, View } from "react-native";

const MTC_COIN_ARTWORK = require("../../assets/images/mtc-coin.png");

type MtcCoinProps = {
  size?: number;
};

export function MtcCoin({ size = 28 }: MtcCoinProps) {
  const radius = size / 2;

  return (
    <View
      accessibilityLabel="MTC Coin"
      accessibilityRole="image"
      testID="mtc-coin"
      style={[styles.shell, { width: size, height: size, borderRadius: radius }]}
    >
      <Image
        source={MTC_COIN_ARTWORK}
        resizeMode="cover"
        style={[styles.artwork, { width: size, height: size, borderRadius: radius }]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  shell: {
    overflow: "hidden",
    backgroundColor: "#07111F",
    borderWidth: 1,
    borderColor: "#FFD869",
    shadowColor: "#F5C451",
    shadowOpacity: 0.45,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 1 },
    elevation: 3,
  },
  artwork: {
    transform: [{ scale: 1.12 }],
  },
});
