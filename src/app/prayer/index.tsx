import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { router } from 'expo-router';
import type { ComponentProps } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { Tappable } from '@/components/tappable';
import { MaxContentWidth, Spacing, type Palette } from '@/constants/theme';
import { PRAYER_GUIDE_INTRO, PRAYER_TOPICS } from '@/data/prayers';
import { useColors, useStyles } from '@/lib/theme';

type IconName = ComponentProps<typeof MaterialCommunityIcons>['name'];

/** Prayer Guide: topics, each opening a page of prayers. */
export default function PrayerGuideScreen() {
  const styles = useStyles(makeStyles);
  const Colors = useColors();
  return (
    <ScrollView contentContainerStyle={styles.content}>
      <Text style={styles.intro}>{PRAYER_GUIDE_INTRO}</Text>
      {PRAYER_TOPICS.map((topic) => (
        <Tappable
          key={topic.id}
          onPress={() => router.push({ pathname: '/prayer/[topic]', params: { topic: topic.id } })}
          accessibilityLabel={`${topic.title}: ${topic.prayers.length} prayers`}
          style={styles.row}>
          <View style={styles.icon}>
            <MaterialCommunityIcons name={topic.icon as IconName} size={22} color={Colors.text} />
          </View>
          <View style={styles.rowText}>
            <Text style={styles.title}>{topic.title}</Text>
            <Text style={styles.count}>{topic.prayers.length} prayers</Text>
          </View>
          <MaterialCommunityIcons name="chevron-right" size={22} color={Colors.textMuted} />
        </Tappable>
      ))}
    </ScrollView>
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
    },
    intro: { color: Colors.textSecondary, fontSize: 15, lineHeight: 22, marginBottom: Spacing.three },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.three,
      paddingVertical: 12,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: Colors.border,
    },
    icon: {
      width: 44,
      height: 44,
      borderRadius: 22,
      borderWidth: 1.5,
      borderColor: Colors.text,
      alignItems: 'center',
      justifyContent: 'center',
    },
    rowText: { flex: 1, gap: 2 },
    title: { color: Colors.text, fontSize: 17, fontWeight: '600' },
    count: { color: Colors.textMuted, fontSize: 13 },
  });
