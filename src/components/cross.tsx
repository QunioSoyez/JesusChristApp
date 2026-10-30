import { StyleSheet, View } from 'react-native';

import { type Palette } from '@/constants/theme';
import { useStyles } from '@/lib/theme';

/** Simple Latin cross (text color: white in dark mode, black in light) drawn with two bars, scaled by `size` (overall height). */
export function Cross({ size = 120 }: { size?: number }) {
  const styles = useStyles(makeStyles);
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

const makeStyles = (Colors: Palette) =>
  StyleSheet.create({
  bar: {
    position: 'absolute',
    backgroundColor: Colors.text,
    borderRadius: 1,
  },
});
