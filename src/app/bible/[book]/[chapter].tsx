import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef } from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';

import { Tappable } from '@/components/tappable';
import { Colors, Fonts, MaxContentWidth, Spacing } from '@/constants/theme';
import { formatRef, getBookInfo, getChapter, TRANSLATION } from '@/lib/bible';

export default function ChapterScreen() {
  const params = useLocalSearchParams<{ book: string; chapter: string; verse?: string }>();
  const info = getBookInfo(params.book);
  const chapter = Number(params.chapter);
  const highlight = params.verse ? Number(params.verse) : undefined;
  const verses = info ? getChapter(info.slug, chapter) : undefined;
  const listRef = useRef<FlatList<string>>(null);

  // Jump to the highlighted verse when arriving from "Jesus in Scripture".
  useEffect(() => {
    if (!highlight || !verses || highlight < 2) return;
    const t = setTimeout(() => {
      listRef.current?.scrollToIndex({ index: Math.min(highlight - 1, verses.length - 1), viewPosition: 0.2 });
    }, 250);
    return () => clearTimeout(t);
  }, [highlight, verses]);

  if (!info || !verses) {
    return <Text style={styles.missing}>That chapter could not be found.</Text>;
  }

  const title = formatRef(info.slug, chapter);

  return (
    <>
      <Stack.Screen options={{ title }} />
      <FlatList
        ref={listRef}
        data={verses}
        keyExtractor={(_, i) => String(i)}
        contentContainerStyle={styles.list}
        initialNumToRender={highlight ? Math.max(20, highlight + 5) : 20}
        onScrollToIndexFailed={({ averageItemLength, index }) =>
          listRef.current?.scrollToOffset({ offset: averageItemLength * index })
        }
        ListHeaderComponent={
          <Text style={styles.heading}>
            {title} <Text style={styles.translation}>{TRANSLATION}</Text>
          </Text>
        }
        renderItem={({ item, index }) => (
          <View style={[styles.verse, index + 1 === highlight && styles.verseHighlight]}>
            <Text style={styles.verseText}>
              <Text style={styles.verseNum}>{index + 1} </Text>
              {item}
            </Text>
          </View>
        )}
        ListFooterComponent={<ChapterNav slug={info.slug} chapter={chapter} total={info.chapters} />}
      />
    </>
  );
}

function ChapterNav({ slug, chapter, total }: { slug: string; chapter: number; total: number }) {
  const go = (c: number) =>
    router.replace({ pathname: '/bible/[book]/[chapter]', params: { book: slug, chapter: String(c) } });

  return (
    <View style={styles.nav}>
      {chapter > 1 ? (
        <Tappable onPress={() => go(chapter - 1)} style={styles.navButton}>
          <Text style={styles.navText}>‹ Chapter {chapter - 1}</Text>
        </Tappable>
      ) : (
        <View />
      )}
      {chapter < total ? (
        <Tappable onPress={() => go(chapter + 1)} style={styles.navButton}>
          <Text style={styles.navText}>Chapter {chapter + 1} ›</Text>
        </Tappable>
      ) : (
        <View />
      )}
    </View>
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
  heading: { color: Colors.text, fontSize: 26, fontWeight: '700', paddingVertical: Spacing.four },
  translation: { color: Colors.textMuted, fontSize: 14, fontWeight: '400' },
  verse: { paddingVertical: 6, paddingHorizontal: Spacing.two, borderRadius: 8, marginHorizontal: -Spacing.two },
  verseHighlight: { backgroundColor: Colors.highlight },
  verseText: { color: Colors.text, fontFamily: Fonts.serif, fontSize: 18, lineHeight: 29 },
  verseNum: { color: Colors.textMuted, fontSize: 12, fontFamily: Fonts.sans },
  nav: { flexDirection: 'row', justifyContent: 'space-between', paddingTop: Spacing.five },
  navButton: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 999,
    paddingHorizontal: Spacing.three,
    paddingVertical: 10,
  },
  navText: { color: Colors.text, fontSize: 15 },
  missing: { color: Colors.textSecondary, textAlign: 'center', marginTop: Spacing.five },
});
