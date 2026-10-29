import { router } from 'expo-router';
import { SectionList, StyleSheet, Text } from 'react-native';

import { Tappable } from '@/components/tappable';
import { Colors, MaxContentWidth, Spacing } from '@/constants/theme';
import { BOOKS } from '@/lib/bible';

const SECTIONS = [
  { title: 'New Testament', data: BOOKS.filter((b) => b.testament === 'NT') },
  { title: 'Old Testament', data: BOOKS.filter((b) => b.testament === 'OT') },
];

export default function BooksScreen() {
  return (
    <SectionList
      sections={SECTIONS}
      keyExtractor={(b) => b.slug}
      contentContainerStyle={styles.list}
      stickySectionHeadersEnabled={false}
      renderSectionHeader={({ section }) => <Text style={styles.header}>{section.title}</Text>}
      renderItem={({ item }) => (
        <Tappable
          onPress={() => router.push({ pathname: '/bible/[book]', params: { book: item.slug } })}
          style={styles.row}>
          <Text style={styles.name}>{item.name}</Text>
          <Text style={styles.meta}>{item.chapters} ch.</Text>
        </Tappable>
      )}
    />
  );
}

const styles = StyleSheet.create({
  list: {
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
    paddingHorizontal: Spacing.three,
    paddingBottom: Spacing.six,
  },
  header: {
    color: Colors.textMuted,
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 1,
    textTransform: 'uppercase',
    paddingTop: Spacing.four,
    paddingBottom: Spacing.two,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.border,
  },
  name: { color: Colors.text, fontSize: 17 },
  meta: { color: Colors.textMuted, fontSize: 14 },
});
