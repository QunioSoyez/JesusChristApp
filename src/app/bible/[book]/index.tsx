import { router, Stack, useLocalSearchParams } from 'expo-router';
import { ScrollView, StyleSheet, Text } from 'react-native';

import { Tappable } from '@/components/tappable';
import { Colors, MaxContentWidth, Spacing } from '@/constants/theme';
import { getBookInfo } from '@/lib/bible';

export default function ChaptersScreen() {
  const { book } = useLocalSearchParams<{ book: string }>();
  const info = getBookInfo(book);

  if (!info) {
    return <Text style={styles.missing}>That book could not be found.</Text>;
  }

  const chapters = Array.from({ length: info.chapters }, (_, i) => i + 1);

  return (
    <>
      <Stack.Screen options={{ title: info.name }} />
      <ScrollView contentContainerStyle={styles.grid}>
        {chapters.map((c) => (
          <Tappable
            key={c}
            accessibilityLabel={`${info.name} chapter ${c}`}
            onPress={() =>
              router.push({ pathname: '/bible/[book]/[chapter]', params: { book: info.slug, chapter: String(c) } })
            }
            style={styles.cell}>
            <Text style={styles.cellText}>{c}</Text>
          </Tappable>
        ))}
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
    padding: Spacing.three,
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
  },
  cell: {
    width: 56,
    height: 56,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cellText: { color: Colors.text, fontSize: 17 },
  missing: { color: Colors.textSecondary, textAlign: 'center', marginTop: Spacing.five },
});
