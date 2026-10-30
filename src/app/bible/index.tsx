import { Redirect, router } from 'expo-router';
import { SectionList, StyleSheet, Text, View } from 'react-native';

import { Tappable } from '@/components/tappable';
import { Colors, MaxContentWidth, Spacing } from '@/constants/theme';
import { BOOKS } from '@/lib/bible';
import { useBibleVersion } from '@/lib/bible-versions';

const SECTIONS = [
  { title: 'New Testament', data: BOOKS.filter((b) => b.testament === 'NT') },
  { title: 'Old Testament', data: BOOKS.filter((b) => b.testament === 'OT') },
];

/** Book list for the remembered Bible version. First visit goes to the version picker instead. */
export default function BooksScreen() {
  const { loading, chosen, version } = useBibleVersion();

  if (loading) return null; // reading the saved choice; takes a moment at most
  if (!chosen) return <Redirect href={{ pathname: '/bible/versions', params: { first: '1' } }} />;

  return (
    <SectionList
      sections={SECTIONS}
      keyExtractor={(b) => b.slug}
      contentContainerStyle={styles.list}
      stickySectionHeadersEnabled={false}
      ListHeaderComponent={
        <Tappable
          onPress={() => router.push('/bible/versions')}
          accessibilityLabel={`Bible version: ${version.name}. Change version`}
          style={styles.versionButton}>
          <View>
            <Text style={styles.versionLabel}>Version</Text>
            <Text style={styles.versionName}>
              {version.name} ({version.abbr})
            </Text>
          </View>
          <Text style={styles.change}>Change</Text>
        </Tappable>
      }
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
  versionButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 14,
    paddingHorizontal: Spacing.three,
    paddingVertical: 12,
    marginTop: Spacing.two,
  },
  versionLabel: { color: Colors.textMuted, fontSize: 12, textTransform: 'uppercase', letterSpacing: 1 },
  versionName: { color: Colors.text, fontSize: 16, marginTop: 2 },
  change: { color: Colors.text, fontSize: 14, textDecorationLine: 'underline' },
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
