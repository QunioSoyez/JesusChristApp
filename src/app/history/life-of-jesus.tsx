import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { router } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { Tappable } from '@/components/tappable';
import { MaxContentWidth, Spacing, type Palette } from '@/constants/theme';
import { HISTORY } from '@/data/history';
import { LIFE_OF_JESUS, LIFE_OF_JESUS_INTRO, type LifeEvent } from '@/data/life-of-jesus';
import { formatPassage } from '@/lib/bible';
import { useColors, useStyles } from '@/lib/theme';

const placeTitle = (id: string) => HISTORY.find((e) => e.id === id)?.title;

/** The main events of Jesus's life in order, linked to their Bible passages and History places. */
export default function LifeOfJesusScreen() {
  const styles = useStyles(makeStyles);
  return (
    <ScrollView contentContainerStyle={styles.content}>
      <Text style={styles.intro}>{LIFE_OF_JESUS_INTRO}</Text>
      <View style={styles.timeline}>
        {LIFE_OF_JESUS.map((event, i) => (
          <Event key={event.id} event={event} last={i === LIFE_OF_JESUS.length - 1} />
        ))}
      </View>
    </ScrollView>
  );
}

function Event({ event, last }: { event: LifeEvent; last: boolean }) {
  const styles = useStyles(makeStyles);
  const Colors = useColors();
  return (
    <View style={styles.event}>
      {/* The line down the left side, with a dot for each event. */}
      <View style={styles.rail}>
        <View style={styles.dot} />
        {last ? null : <View style={styles.line} />}
      </View>

      <View style={styles.body}>
        <Text style={styles.when}>{event.when}</Text>
        <Text style={styles.title} accessibilityRole="header">
          {event.title}
        </Text>
        <Text style={styles.text}>{event.body}</Text>

        <View style={styles.chips}>
          {event.refs.map((r) => (
            <Tappable
              key={formatPassage(r)}
              onPress={() =>
                router.push({ pathname: '/bible/[book]', params: { book: r.b, chapter: String(r.c), verse: String(r.v) } })
              }
              accessibilityLabel={`Read ${formatPassage(r)}`}
              style={styles.chip}>
              <MaterialCommunityIcons name="book-open-variant" size={15} color={Colors.text} />
              <Text style={styles.chipText}>{formatPassage(r)}</Text>
            </Tappable>
          ))}
          {event.places.map((id) => {
            const title = placeTitle(id);
            if (!title) return null;
            return (
              <Tappable
                key={id}
                onPress={() => router.push({ pathname: '/history/[id]', params: { id } })}
                accessibilityLabel={`See ${title}`}
                style={[styles.chip, styles.placeChip]}>
                <MaterialCommunityIcons name="map-marker-outline" size={15} color={Colors.textSecondary} />
                <Text style={styles.placeText}>{title}</Text>
              </Tappable>
            );
          })}
        </View>
      </View>
    </View>
  );
}

const DOT = 12;

const makeStyles = (Colors: Palette) =>
  StyleSheet.create({
    content: {
      width: '100%',
      maxWidth: MaxContentWidth,
      alignSelf: 'center',
      paddingHorizontal: Spacing.three,
      paddingTop: Spacing.two,
      paddingBottom: Spacing.six,
    },
    intro: { color: Colors.textSecondary, fontSize: 15, lineHeight: 22, marginBottom: Spacing.four },
    timeline: {},
    event: { flexDirection: 'row', gap: Spacing.three },
    rail: { width: DOT, alignItems: 'center' },
    dot: {
      width: DOT,
      height: DOT,
      borderRadius: DOT / 2,
      backgroundColor: Colors.text,
      marginTop: 4,
    },
    line: { flex: 1, width: 2, backgroundColor: Colors.border, marginTop: 4 },
    body: { flex: 1, paddingBottom: Spacing.five, gap: 6 },
    when: {
      color: Colors.textMuted,
      fontSize: 12,
      fontWeight: '600',
      letterSpacing: 1,
      textTransform: 'uppercase',
    },
    title: { color: Colors.text, fontSize: 19, fontWeight: '700' },
    text: { color: Colors.text, fontSize: 15, lineHeight: 23 },
    chips: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two, marginTop: Spacing.two },
    chip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      borderWidth: 1,
      borderColor: Colors.border,
      backgroundColor: Colors.surface,
      borderRadius: 999,
      paddingHorizontal: 10,
      paddingVertical: 6,
    },
    chipText: { color: Colors.text, fontSize: 13, fontWeight: '600' },
    placeChip: { backgroundColor: 'transparent' },
    placeText: { color: Colors.textSecondary, fontSize: 13 },
  });
