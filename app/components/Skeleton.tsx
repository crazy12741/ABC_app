import { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View, type ViewStyle } from 'react-native';
import { colors, radius } from '@/constants/theme';

type Props = {
  height?: number;
  width?: number | `${number}%`;
  radius?: number;
  style?: ViewStyle;
};

export function SkeletonBlock({ height = 16, width = '100%', radius: r = radius.sm, style }: Props) {
  const opacity = useRef(new Animated.Value(0.45)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 0.9,
          duration: 750,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.45,
          duration: 750,
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [opacity]);

  return (
    <Animated.View
      style={[
        styles.base,
        { height, width, borderRadius: r, opacity },
        style,
      ]}
    />
  );
}

export function ScreenSkeleton({ blocks = 4 }: { blocks?: number }) {
  return (
    <View style={styles.screen}>
      <SkeletonBlock height={30} width="55%" />
      <SkeletonBlock height={180} radius={radius.lg} style={styles.gap} />
      {Array.from({ length: blocks }).map((_, index) => (
        <View key={index} style={styles.card}>
          <SkeletonBlock height={14} width="40%" />
          <SkeletonBlock height={20} width="80%" style={styles.line} />
          <SkeletonBlock height={14} width="100%" style={styles.line} />
          <SkeletonBlock height={14} width="72%" style={styles.line} />
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    backgroundColor: colors.line,
  },
  screen: {
    gap: 14,
  },
  gap: {
    marginBottom: 6,
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.line,
    padding: 16,
    gap: 8,
  },
  line: {
    marginTop: 4,
  },
});
