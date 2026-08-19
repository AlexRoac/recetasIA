import { useEffect, useRef } from 'react';
import { Animated, StyleProp, StyleSheet, View, ViewStyle } from 'react-native';

import { useTheme } from '../theme';

function SkeletonBlock({
  width,
  height,
  style,
}: {
  width: number | `${number}%`;
  height: number;
  style?: StyleProp<ViewStyle>;
}) {
  const theme = useTheme();
  const pulse = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 700, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0.4, duration: 700, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [pulse]);

  return (
    <Animated.View
      style={[
        { width, height, borderRadius: 8, backgroundColor: theme.borderStrong, opacity: pulse },
        style,
      ]}
    />
  );
}

export default function ResultSkeleton() {
  const theme = useTheme();

  return (
    <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
      <SkeletonBlock width="55%" height={16} />
      <View style={styles.gapLg} />
      <SkeletonBlock width="90%" height={12} />
      <View style={styles.gapMd} />
      <SkeletonBlock width="75%" height={12} />
      <View style={styles.gapXl} />
      <SkeletonBlock width="40%" height={16} />
      <View style={styles.gapLg} />
      <SkeletonBlock width="85%" height={12} />
      <View style={styles.gapMd} />
      <SkeletonBlock width="60%" height={12} />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 20,
  },
  gapMd: { height: 8 },
  gapLg: { height: 12 },
  gapXl: { height: 20 },
});
