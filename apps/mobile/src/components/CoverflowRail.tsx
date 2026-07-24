// Coverflow-style horizontal rail — center card is largest and fully opaque,
// adjacent cards (positions ±1) are slightly smaller and darker, edges (±2)
// are much smaller and tucked toward the center to peek from behind. Videogame
// carousel vibe. Uses Reanimated 3 for smooth, native-driven transforms.
import { useMemo, memo } from "react";
import { useWindowDimensions } from "react-native";
import { router } from "expo-router";
import Animated, {
  Extrapolation,
  interpolate,
  type SharedValue,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
} from "react-native-reanimated";
import type { Champion } from "../store";
import { FifaCard } from "./FifaCard";
import { hap } from "../utils/haptics";
import { spacing } from "../theme";

const AnimatedFlatList = Animated.FlatList;

const LOOP = 20;

interface Props {
  data: Champion[];
  favoriteIds?: ReadonlySet<string>;
  onToggleFavorite?: (championId: string) => void;
  testID?: string;
  cardTestIdPrefix?: string; // e.g. "card-" or "card-r-"
}

export function CoverflowRail({
  data,
  favoriteIds,
  onToggleFavorite,
  testID = "rail-list",
  cardTestIdPrefix = "card-",
}: Props) {
  const { width: SCREEN_W } = useWindowDimensions();
  const CARD_W = Math.min(220, Math.round(SCREEN_W * 0.56));
  const CARD_H = Math.round(CARD_W * 1.55);
  // Item width == snap step so scrollX/CARD_W is the true visual-center index.
  const SNAP = CARD_W;
  const SIDE_PAD = Math.max(0, (SCREEN_W - CARD_W) / 2);

  // Duplicate list N times so the horizontal FlatList feels endless.
  const looped = useMemo(() => {
    if (data.length === 0) return [] as (Champion & { _k: string })[];
    const out: (Champion & { _k: string })[] = [];
    for (let i = 0; i < LOOP; i++) {
      for (const c of data) out.push({ ...c, _k: `${i}-${c.id}` });
    }
    return out;
  }, [data]);

  const initialScrollIndex = data.length ? Math.floor(LOOP / 2) * data.length : 0;

  const scrollX = useSharedValue(initialScrollIndex * SNAP);

  const onScroll = useAnimatedScrollHandler({
    onScroll: (e) => {
      scrollX.value = e.contentOffset.x;
    },
  });

  return (
    <AnimatedFlatList
      testID={testID}
      data={looped}
      keyExtractor={(c: any) => c._k}
      horizontal
      showsHorizontalScrollIndicator={false}
      decelerationRate="fast"
      snapToInterval={SNAP}
      snapToAlignment="center"
      disableIntervalMomentum
      onScroll={onScroll}
      scrollEventThrottle={16}
      initialScrollIndex={initialScrollIndex}
      getItemLayout={(_: any, i: number) => ({ length: SNAP, offset: SNAP * i, index: i })}
      contentContainerStyle={{
        paddingHorizontal: SIDE_PAD,
        paddingVertical: spacing.md,
        alignItems: "center",
      }}
      style={{ height: CARD_H + spacing.md * 2 + 20 }}
      renderItem={({ item, index }: any) => (
        <CoverItem
          key={item._k}
          champ={item}
          index={index}
          scrollX={scrollX}
          snap={SNAP}
          cardW={CARD_W}
          favorite={favoriteIds?.has(item.id) ?? false}
          testID={`${cardTestIdPrefix}${item.id}`}
          onToggleFavorite={() => onToggleFavorite?.(item.id)}
          onPress={() => {
            hap.light();
            router.push(`/champion/${item.id}` as never);
          }}
        />
      )}
    />
  );
}

interface ItemProps {
  champ: Champion;
  index: number;
  scrollX: SharedValue<number>;
  snap: number;
  cardW: number;
  favorite: boolean;
  testID?: string;
  onToggleFavorite: () => void;
  onPress: () => void;
}

const CoverItem = memo(function CoverItem({
  champ,
  index,
  scrollX,
  snap,
  cardW,
  favorite,
  testID,
  onToggleFavorite,
  onPress,
}: ItemProps) {
  const animStyle = useAnimatedStyle(() => {
    "worklet";
    const distance = index - scrollX.value / snap;
    const abs = Math.abs(distance);

    // Slight but noticeable size drop — center 100%, ±1 = 78%, ±2 = 58%, edges vanish.
    const scale = interpolate(abs, [0, 1, 2, 3], [1, 0.78, 0.58, 0.42], Extrapolation.CLAMP);
    // Opacity drops steeply — edges almost gone.
    const opacity = interpolate(abs, [0, 1, 2, 3], [1, 0.75, 0.32, 0.1], Extrapolation.CLAMP);
    // Pull neighbors toward the center card so ±2 tuck behind ±1.
    const translateX = interpolate(
      distance,
      [-3, -2, -1, 0, 1, 2, 3],
      [90, 62, 26, 0, -26, -62, -90],
      Extrapolation.CLAMP,
    );

    return {
      transform: [{ translateX }, { scale }],
      opacity,
      // Higher z-index for cards closer to center so overlap looks correct.
      zIndex: Math.round(100 - abs * 10),
    };
  }, [index, snap]);

  return (
    <Animated.View style={[{ width: cardW }, animStyle]}>
      <FifaCard
        testID={testID}
        champ={champ}
        width={cardW}
        favorite={favorite}
        onToggleFavorite={onToggleFavorite}
        onPress={onPress}
      />
    </Animated.View>
  );
});
