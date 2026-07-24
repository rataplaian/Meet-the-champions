import { memo, useMemo } from "react";
import { useWindowDimensions } from "react-native";
import { router } from "expo-router";
import Animated, {
  Extrapolation,
  interpolate,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
} from "react-native-reanimated";
import type { ChampionListItem } from "@meet-champion/shared";
import { spacing } from "../theme";
import { FifaCard } from "./FifaCard";

const AnimatedFlatList = Animated.FlatList;
const LOOP = 20;

interface Props {
  data: ChampionListItem[];
  testID?: string;
}

export function CoverflowRail({ data, testID = "explore-champions-rail" }: Props) {
  const { width: screenWidth } = useWindowDimensions();
  const cardWidth = Math.min(220, Math.round(screenWidth * 0.56));
  const cardHeight = Math.round(cardWidth * 1.55);
  const snap = cardWidth;
  const sidePad = Math.max(0, (screenWidth - cardWidth) / 2);

  const looped = useMemo(() => {
    if (data.length === 0) return [] as (ChampionListItem & { _key: string })[];
    const out: (ChampionListItem & { _key: string })[] = [];
    for (let i = 0; i < LOOP; i += 1) {
      for (const champion of data) out.push({ ...champion, _key: `${i}-${champion.profile_id}` });
    }
    return out;
  }, [data]);

  const initialScrollIndex = data.length ? Math.floor(LOOP / 2) * data.length : 0;
  const scrollX = useSharedValue(initialScrollIndex * snap);
  const onScroll = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollX.value = event.contentOffset.x;
    },
  });

  return (
    <AnimatedFlatList
      testID={testID}
      data={looped}
      keyExtractor={(item: any) => item._key}
      horizontal
      showsHorizontalScrollIndicator={false}
      decelerationRate="fast"
      snapToInterval={snap}
      snapToAlignment="center"
      disableIntervalMomentum
      onScroll={onScroll}
      scrollEventThrottle={16}
      initialScrollIndex={initialScrollIndex}
      getItemLayout={(_: unknown, index: number) => ({ length: snap, offset: snap * index, index })}
      contentContainerStyle={{
        paddingHorizontal: sidePad,
        paddingVertical: spacing.md,
        alignItems: "center",
      }}
      style={{ height: cardHeight + spacing.md * 2 + 20 }}
      renderItem={({ item, index }: any) => (
        <CoverItem
          item={item}
          index={index}
          scrollX={scrollX}
          snap={snap}
          cardWidth={cardWidth}
        />
      )}
    />
  );
}

interface ItemProps {
  item: ChampionListItem;
  index: number;
  scrollX: Animated.SharedValue<number>;
  snap: number;
  cardWidth: number;
}

const CoverItem = memo(function CoverItem({ item, index, scrollX, snap, cardWidth }: ItemProps) {
  const animStyle = useAnimatedStyle(() => {
    const distance = index - scrollX.value / snap;
    const abs = Math.abs(distance);
    const scale = interpolate(abs, [0, 1, 2, 3], [1, 0.78, 0.58, 0.42], Extrapolation.CLAMP);
    const opacity = interpolate(abs, [0, 1, 2, 3], [1, 0.75, 0.32, 0.1], Extrapolation.CLAMP);
    const translateX = interpolate(
      distance,
      [-3, -2, -1, 0, 1, 2, 3],
      [90, 62, 26, 0, -26, -62, -90],
      Extrapolation.CLAMP,
    );

    return {
      transform: [{ translateX }, { scale }],
      opacity,
      zIndex: Math.round(100 - abs * 10),
    };
  }, [index, snap]);

  const age = item.birth_year ? new Date().getFullYear() - item.birth_year : null;

  return (
    <Animated.View style={[{ width: cardWidth }, animStyle]}>
      <FifaCard
        testID={`champion-rail-card-${item.profile_id}`}
        width={cardWidth}
        onPress={() => router.push(`/champion/${item.profile_id}` as never)}
        champ={{
          id: item.profile_id,
          name: item.display_name ?? "Champion",
          age,
          team: item.last_team,
          category: item.category,
          photoUrl: item.avatar_url,
        }}
      />
    </Animated.View>
  );
});
