import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { Tappable } from '@/components/tappable';
import { Fonts, MaxContentWidth, Spacing, type Palette } from '@/constants/theme';
import type { HistoryRef } from '@/data/history';
import { type Prayer, PRAYER_TOPICS } from '@/data/prayers';
import { formatPassage } from '@/lib/bible';
import { useColors, useStyles } from '@/lib/theme';

const openPassage = (r: HistoryRef) =>
  router.push({ pathname: '/bible/[book]', params: { book: r.b, chapter: String(r.c), verse: String(r.v) } });

/** One Prayer Guide topic: a short intro, a Bible verse, and its prayers. */
export default function PrayerTopicScreen() {
  const styles = useStyles(makeStyles);
  const Colors = useColors();
  const { topic: id } = useLocalSearchParams<{ topic: string }>();
  const topic = PRAYER_TOPICS.find((t) => t.id === id);

  if (!topic) {
    return (
      <View style={styles.missing}>
        <Stack.Screen options={{ title: 'Not found' }} />
        <Text style={styles.intro}>That topic couldn’t be found.</Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <Stack.Screen options={{ title: topic.title }} />
      <Text style={styles.intro}>{topic.intro}</Text>
      <Tappable onPress={() => openPassage(topic.verse)} accessibilityLabel={`Read ${formatPassage(topic.verse)}`} style={styles.verseChip}>
        <MaterialCommunityIcons name="book-open-variant" size={15} color={Colors.text} />
        <Text style={styles.verseText}>{formatPassage(topic.verse)}</Text>
      </Tappable>

      {topic.prayers.map((p) => (
        <PrayerCard key={p.title} prayer={p} />
      ))}

      {/* Always a way to the other topics, even when this page was opened from a link. */}
      <Tappable onPress={() => router.navigate('/prayer')} style={styles.allButton} accessibilityLabel="All prayer topics">
        <MaterialCommunityIcons name="hands-pray" size={18} color={Colors.text} />
        <Text style={styles.allText}>All prayer topics</Text>
      </Tappable>
    </ScrollView>
  );
}

function PrayerCard({ prayer }: { prayer: Prayer }) {
  const styles = useStyles(makeStyles);
  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle} accessibilityRole="header">
        {prayer.title}
      </Text>
      {prayer.kind === 'bible' ? (
        <View style={styles.sourceRow}>
          {prayer.refs.map((r) => (
            <Text key={formatPassage(r)} style={styles.sourceLink} onPress={() => openPassage(r)} accessibilityRole="link">
              {formatPassage(r)} (KJV)
            </Text>
          ))}
        </View>
      ) : (
        <Text style={styles.source}>{prayer.source}</Text>
      )}
      <Text style={styles.prayerText} selectable>
        {prayer.text}
      </Text>
    </View>
  );
}

const makeStyles = (Colors: Palette) =>
  StyleSheet.create({
    content: {
      width: '100%',
      maxWidth: MaxContentWidth,
      alignSelf: 'center',
      paddingHorizontal: Spacing.three,
      paddingTop: Spacing.two,
      paddingBottom: Spacing.six,
      gap: Spacing.three,
    },
    missing: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: Spacing.four },
    intro: { color: Colors.textSecondary, fontSize: 15, lineHeight: 22 },
    verseChip: {
      flexDirection: 'row',
      alignItems: 'center',
      alignSelf: 'flex-start',
      gap: 6,
      borderWidth: 1,
      borderColor: Colors.border,
      backgroundColor: Colors.surface,
      borderRadius: 999,
      paddingHorizontal: 12,
      paddingVertical: 7,
    },
    verseText: { color: Colors.text, fontSize: 14, fontWeight: '600' },
    card: {
      backgroundColor: Colors.surface,
      borderWidth: 1,
      borderColor: Colors.border,
      borderRadius: 14,
      padding: Spacing.three,
      gap: 6,
    },
    cardTitle: { color: Colors.text, fontSize: 18, fontWeight: '700' },
    sourceRow: { flexDirection: 'row', flexWrap: 'wrap', columnGap: Spacing.three },
    sourceLink: { color: Colors.textSecondary, fontSize: 13, textDecorationLine: 'underline' },
    source: { color: Colors.textSecondary, fontSize: 13, fontStyle: 'italic' },
    prayerText: { color: Colors.text, fontFamily: Fonts.serif, fontSize: 18, lineHeight: 28, marginTop: Spacing.two },
    allButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: Spacing.two,
      marginTop: Spacing.two,
      paddingVertical: 12,
      borderRadius: 999,
      borderWidth: 1,
      borderColor: Colors.border,
    },
    allText: { color: Colors.text, fontSize: 15, fontWeight: '600' },
  });
