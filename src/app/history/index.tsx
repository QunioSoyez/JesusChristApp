import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { router } from 'expo-router';
import { Image, SectionList, StyleSheet, Text, View } from 'react-native';

import { Tappable } from '@/components/tappable';
import { MaxContentWidth, Spacing, type Palette } from '@/constants/theme';
import { HISTORY, HISTORY_SECTIONS, type HistoryEntry } from '@/data/history';
import { HISTORY_IMAGES } from '@/data/history-images';
import { useColors, useStyles } from '@/lib/theme';

const SECTIONS = HISTORY_SECTIONS.map((s) => ({ ...s, data: HISTORY.filter((e) => e.category === s.id) }));

/** Gospel places and archaeology, each with a photo (bundled, works offline). */
export default function HistoryScreen() {
  const styles = useStyles(makeStyles);
  return (
    <SectionList
      sections={SECTIONS}
      keyExtractor={(e) => e.id}
      contentContainerStyle={styles.list}
      stickySectionHeadersEnabled={false}
      ListHeaderComponent={
        <View>
          <Text style={styles.intro}>
            Places from the Gospels and finds from archaeology that connect to the life of Jesus. Tap one to read more and
            open the Bible passages.
          </Text>
          <LifeOfJesusCard />
        </View>
      }
      renderSectionHeader={({ section }) => (
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>{section.title}</Text>
          <Text style={styles.sectionIntro}>{section.intro}</Text>
        </View>
      )}
      renderItem={({ item }) => <Row entry={item} />}
    />
  );
}

/** Link to the Life of Jesus timeline, at the top of the list. */
function LifeOfJesusCard() {
  const styles = useStyles(makeStyles);
  const Colors = useColors();
  return (
    <Tappable
      onPress={() => router.push('/history/life-of-jesus')}
      accessibilityLabel="The Life of Jesus: a timeline of the main events"
      style={styles.card}>
      <View style={styles.cardIcon}>
        <MaterialCommunityIcons name="timeline-text-outline" size={26} color={Colors.text} />
      </View>
      <View style={styles.rowText}>
        <Text style={styles.title}>The Life of Jesus</Text>
        <Text style={styles.subtitle}>A timeline of the main events, from his birth to the Ascension</Text>
      </View>
      <MaterialCommunityIcons name="chevron-right" size={22} color={Colors.textMuted} />
    </Tappable>
  );
}

function Row({ entry }: { entry: HistoryEntry }) {
  const styles = useStyles(makeStyles);
  const Colors = useColors();
  const image = HISTORY_IMAGES[entry.id];
  return (
    <Tappable
      onPress={() => router.push({ pathname: '/history/[id]', params: { id: entry.id } })}
      accessibilityLabel={`${entry.title}. ${entry.subtitle}`}
      style={styles.row}>
      {image ? (
        <Image source={image.source} style={styles.thumb} resizeMode="cover" accessibilityIgnoresInvertColors />
      ) : (
        <View style={[styles.thumb, styles.thumbEmpty]}>
          <MaterialCommunityIcons
            name={entry.category === 'place' ? 'map-marker-outline' : 'pillar'}
            size={28}
            color={Colors.textMuted}
          />
        </View>
      )}
      <View style={styles.rowText}>
        <Text style={styles.title}>{entry.title}</Text>
        <Text style={styles.subtitle}>{entry.subtitle}</Text>
      </View>
      <MaterialCommunityIcons name="chevron-right" size={22} color={Colors.textMuted} />
    </Tappable>
  );
}

const makeStyles = (Colors: Palette) =>
  StyleSheet.create({
    list: {
      width: '100%',
      maxWidth: MaxContentWidth,
      alignSelf: 'center',
      paddingHorizontal: Spacing.three,
      paddingBottom: Spacing.six,
    },
    intro: { color: Colors.textSecondary, fontSize: 15, lineHeight: 22, paddingTop: Spacing.two },
    sectionHeader: { paddingTop: Spacing.four, paddingBottom: Spacing.two, gap: 4 },
    sectionTitle: {
      color: Colors.textMuted,
      fontSize: 13,
      fontWeight: '600',
      letterSpacing: 1,
      textTransform: 'uppercase',
    },
    sectionIntro: { color: Colors.textSecondary, fontSize: 13, lineHeight: 18 },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.three,
      paddingVertical: 10,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: Colors.border,
    },
    thumb: { width: 72, height: 72, borderRadius: 10, backgroundColor: Colors.surface },
    thumbEmpty: { alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: Colors.border },
    card: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.three,
      marginTop: Spacing.three,
      padding: Spacing.three,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: Colors.border,
      backgroundColor: Colors.surface,
    },
    cardIcon: {
      width: 48,
      height: 48,
      borderRadius: 24,
      borderWidth: 1.5,
      borderColor: Colors.text,
      alignItems: 'center',
      justifyContent: 'center',
    },
    rowText: { flex: 1, gap: 2 },
    title: { color: Colors.text, fontSize: 16, fontWeight: '600' },
    subtitle: { color: Colors.textSecondary, fontSize: 14 },
  });
