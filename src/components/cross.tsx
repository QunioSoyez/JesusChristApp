import { StyleSheet, View } from 'react-native';

import { Colors } from '@/constants/theme';

/** Simple white Latin cross drawn with two bars, scaled by `size` (overall height). */
export function Cross({ size = 120 }: { size?: number }) {
  const bar = Math.max(4, Math.round(size * 0.09));
  const armWidth = Math.round(size * 0.62);
  const armTop = Math.round(size * 0.26);

  return (
    <View style={{ width: armWidth, height: size }} accessibilityLabel="Cross" accessibilityRole="image">
      <View style={[styles.bar, { width: bar, height: size, left: (armWidth - bar) / 2, top: 0 }]} />
      <View style={[styles.bar, { width: armWidth, height: bar, left: 0, top: armTop }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    position: 'absolute',
    backgroundColor: Colors.text,
    borderRadius: 1,
  },
});
