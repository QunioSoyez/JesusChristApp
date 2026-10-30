import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { type Href, router } from 'expo-router';
import { type ComponentProps, useState } from 'react';
import { ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Cross } from '@/components/cross';
import { HomeMenu } from '@/components/home-menu';
import { Tappable } from '@/components/tappable';
import { Fonts, MaxContentWidth, Spacing, type Palette } from '@/constants/theme';
import { useColors, useStyles } from '@/lib/theme';
import { randomQuote, TRANSLATION } from '@/lib/bible';

type IconName = ComponentProps<typeof MaterialCommunityIcons>['name'];

const NAV: { label: string; a11y: string; icon: IconName; href: Href }[] = [
  { label: 'Scripture', a11y: 'Jesus in Scripture', icon: 'cross', href: '/references' },
  { label: 'Bible', a11y: 'Read the Bible', icon: 'book-open-variant', href: '/bible' },
  { label: 'History', a11y: 'History: Gospel places and archaeology', icon: 'pillar', href: '/history' },
  { label: 'Churches', a11y: 'Find a Church', icon: 'church', href: '/churches' },
  { label: 'Next Steps', a11y: 'Next steps: questions, prayer lines and resources', icon: 'hand-heart-outline', href: '/next-steps' },
];

export default function HomeScreen() {
  const Colors = useColors();
  const styles = useStyles(makeStyles);
  const [quote, setQuote] = useState(() => randomQuote());
  // Smaller buttons on narrow phones so all five fit with their labels.
  const compact = useWindowDimensions().width < 360;

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.topBar}>
        <HomeMenu />
      </View>
      {/* Scrolls only when a long verse doesn't fit, so nothing gets cut off. */}
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Cross size={110} />

        <Tappable onPress={() => setQuote((q) => randomQuote(q))} accessibilityHint="Shows another verse" style={styles.quote}>
          <Text style={styles.quoteText}>“{quote.t}”</Text>
          <Text style={styles.quoteRef}>
            {quote.ref} ({TRANSLATION})
          </Text>
          <Text style={styles.tapHint}>Tap for another verse</Text>
        </Tappable>
      </ScrollView>

      <View style={styles.nav}>
        {NAV.map((item) => (
          <Tappable
            key={item.label}
            onPress={() => router.push(item.href)}
            accessibilityLabel={item.a11y}
            style={styles.navItem}>
            <View style={[styles.circle, compact && styles.circleCompact]}>
              <MaterialCommunityIcons name={item.icon} size={compact ? 22 : 26} color={Colors.text} />
            </View>
            <Text style={[styles.navLabel, compact && styles.navLabelCompact]} numberOfLines={1}>
              {item.label}
            </Text>
          </Tappable>
        ))}
      </View>
    </SafeAreaView>
  );
}

const makeStyles = (Colors: Palette) =>
  StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  topBar: { flexDirection: 'row', justifyContent: 'flex-end', paddingHorizontal: Spacing.two, paddingTop: Spacing.one },
  scrollContent: {
    flexGrow: 1,
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.five,
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.four,
  },
  quote: { alignItems: 'center', paddingHorizontal: Spacing.two, gap: Spacing.three },
  quoteText: {
    color: Colors.text,
    fontFamily: Fonts.serif,
    fontSize: 21,
    lineHeight: 31,
    textAlign: 'center',
  },
  quoteRef: { color: Colors.textSecondary, fontSize: 15, letterSpacing: 0.5 },
  tapHint: { color: Colors.textMuted, fontSize: 12 },
  // Five buttons share the width evenly so they fit small phones (about 320pt wide) too.
  nav: {
    flexDirection: 'row',
    width: '100%',
    maxWidth: 480,
    alignSelf: 'center',
    paddingHorizontal: Spacing.two,
    paddingTop: Spacing.three,
    paddingBottom: Spacing.three,
  },
  navItem: { flex: 1, alignItems: 'center', gap: 6 },
  circle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 1.5,
    borderColor: Colors.text,
    alignItems: 'center',
    justifyContent: 'center',
  },
  circleCompact: { width: 46, height: 46, borderRadius: 23 },
  navLabelCompact: { fontSize: 10.5, letterSpacing: 0 },
  navLabel: { color: Colors.textSecondary, fontSize: 12, letterSpacing: 0.3 },
});
