import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Cross } from '@/components/cross';
import { Tappable } from '@/components/tappable';
import { Colors, Fonts, MaxContentWidth, Spacing } from '@/constants/theme';
import { randomQuote, TRANSLATION } from '@/lib/bible';

export default function HomeScreen() {
  const [quote, setQuote] = useState(() => randomQuote());

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <View style={styles.hero}>
          <Cross size={140} />

          <Tappable
            onPress={() => setQuote((q) => randomQuote(q))}
            accessibilityHint="Shows another verse"
            style={styles.quote}>
            <Text style={styles.quoteText}>“{quote.t}”</Text>
            <Text style={styles.quoteRef}>
              {quote.ref} ({TRANSLATION})
            </Text>
            <Text style={styles.tapHint}>Tap for another verse</Text>
          </Tappable>
        </View>

        <View style={styles.actions}>
          <Tappable onPress={() => router.push('/references')} style={[styles.button, styles.buttonPrimary]}>
            <Text style={[styles.buttonText, styles.buttonTextPrimary]}>Jesus in Scripture</Text>
          </Tappable>
          <Tappable onPress={() => router.push('/bible')} style={styles.button}>
            <Text style={styles.buttonText}>Read the Bible</Text>
          </Tappable>
          <Tappable onPress={() => router.push('/churches')} style={styles.button}>
            <Text style={styles.buttonText}>Find a Church</Text>
          </Tappable>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  container: {
    flex: 1,
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.five,
    justifyContent: 'space-between',
  },
  hero: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: Spacing.five },
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
  actions: { gap: Spacing.three },
  button: {
    borderWidth: 1,
    borderColor: Colors.text,
    borderRadius: 999,
    paddingVertical: Spacing.three,
    alignItems: 'center',
  },
  buttonPrimary: { backgroundColor: Colors.text },
  buttonText: { color: Colors.text, fontSize: 17, fontWeight: '600' },
  buttonTextPrimary: { color: Colors.background },
});
