import { router } from 'expo-router';
import { useDeferredValue, useMemo, useState } from 'react';
import { FlatList, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { Tappable } from '@/components/tappable';
import { Fonts, MaxContentWidth, Spacing, type Palette } from '@/constants/theme';
import { useColors, useStyles } from '@/lib/theme';
import { formatRef, REFERENCE_CATEGORIES, REFERENCE_VERSES, type ReferenceVerse } from '@/lib/bible';

export default function ReferencesScreen() {
  const Colors = useColors();
  const styles = useStyles(makeStyles);
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<string | null>(null);
  const deferredQuery = useDeferredValue(query);

  const results = useMemo(() => {
    const q = deferredQuery.trim().toLowerCase();
    return REFERENCE_VERSES.filter((r) => {
      if (category && !r.tags.includes(category)) return false;
      if (!q) return true;
      return r.t.toLowerCase().includes(q) || formatRef(r.b, r.c, r.v).toLowerCase().includes(q);
    });
  }, [deferredQuery, category]);

  return (
    <View style={styles.screen}>
      <View style={styles.inner}>
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Search words or a reference (e.g. John 3)"
          placeholderTextColor={Colors.textMuted}
          style={styles.search}
          autoCorrect={false}
          clearButtonMode="while-editing"
          accessibilityLabel="Search references to Jesus"
        />

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
          <Chip label="All" active={category === null} onPress={() => setCategory(null)} />
          {REFERENCE_CATEGORIES.map((c) => (
            <Chip
              key={c.id}
              label={c.label}
              active={category === c.id}
              onPress={() => setCategory(category === c.id ? null : c.id)}
            />
          ))}
        </ScrollView>

        <Text style={styles.count}>
          {results.length.toLocaleString()} {results.length === 1 ? 'verse' : 'verses'}
        </Text>
      </View>

      <FlatList
        data={results}
        keyExtractor={(r) => `${r.b}-${r.c}-${r.v}`}
        renderItem={({ item }) => <ReferenceRow item={item} />}
        contentContainerStyle={styles.list}
        initialNumToRender={20}
        keyboardShouldPersistTaps="handled"
        ListEmptyComponent={<Text style={styles.empty}>No verses match that search.</Text>}
      />
    </View>
  );
}

function Chip({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  const styles = useStyles(makeStyles);
  return (
    <Tappable onPress={onPress} accessibilityState={{ selected: active }} style={[styles.chip, active && styles.chipActive]}>
      <Text style={[styles.chipText, active && styles.chipTextActive]}>{label}</Text>
    </Tappable>
  );
}

function ReferenceRow({ item }: { item: ReferenceVerse }) {
  const styles = useStyles(makeStyles);
  return (
    <Tappable
      onPress={() =>
        router.push({
          pathname: '/bible/[book]',
          params: { book: item.b, chapter: String(item.c), verse: String(item.v) },
        })
      }
      style={styles.row}>
      <Text style={styles.rowRef}>{formatRef(item.b, item.c, item.v)}</Text>
      <Text style={styles.rowText}>{item.t}</Text>
    </Tappable>
  );
}

const makeStyles = (Colors: Palette) =>
  StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.background },
  inner: { width: '100%', maxWidth: MaxContentWidth, alignSelf: 'center', paddingHorizontal: Spacing.three },
  search: {
    backgroundColor: Colors.surface,
    color: Colors.text,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.three,
    paddingVertical: 12,
    fontSize: 16,
    marginTop: Spacing.two,
  },
  chips: { gap: Spacing.two, paddingVertical: Spacing.three },
  chip: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 7,
  },
  chipActive: { backgroundColor: Colors.text, borderColor: Colors.text },
  chipText: { color: Colors.textSecondary, fontSize: 14 },
  chipTextActive: { color: Colors.background, fontWeight: '600' },
  count: { color: Colors.textMuted, fontSize: 13, paddingBottom: Spacing.two },
  list: {
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
    paddingHorizontal: Spacing.three,
    paddingBottom: Spacing.six,
  },
  row: {
    paddingVertical: Spacing.three,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.border,
    gap: Spacing.one,
  },
  rowRef: { color: Colors.text, fontWeight: '600', fontSize: 15 },
  rowText: { color: Colors.textSecondary, fontFamily: Fonts.serif, fontSize: 16, lineHeight: 24 },
  empty: { color: Colors.textMuted, textAlign: 'center', marginTop: Spacing.five },
});
