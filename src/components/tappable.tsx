import type { ReactNode } from 'react';
import { Pressable, StyleSheet, type PressableProps, type StyleProp, type ViewStyle } from 'react-native';

type Props = Omit<PressableProps, 'style'> & { style?: StyleProp<ViewStyle>; children: ReactNode };

/** Pressable with a consistent dim-on-press effect. Navigate with router.push in onPress. */
export function Tappable({ style, children, ...rest }: Props) {
  return (
    <Pressable
      accessibilityRole="button"
      {...rest}
      style={({ pressed }) => StyleSheet.flatten([style, pressed && styles.pressed])}>
      {children}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pressed: { opacity: 0.6 },
});
