import { router, Stack, useLocalSearchParams } from 'expo-router';
import { Fragment, useCallback, useEffect, useRef, useState } from 'react';
import {
  type LayoutChangeEvent,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  ScrollView,
  type ScrollViewInstance,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { Tappable } from '@/components/tappable';
import { Fonts, MaxContentWidth, Spacing, type Palette } from '@/constants/theme';
import { useStyles } from '@/lib/theme';
import { adjacentBook, getBookInfo, getBookText } from '@/lib/bible';
import { useBibleVersion } from '@/lib/bible-versions';

const CHIP_WIDTH = 44;
const CHIP_GAP = 8;
const STRIP_PADDING = Spacing.three;

/**
 * Whole-book reader. The full book is laid out at once (each chapter is one text block, so even
 * Psalms stays light), which lets the chapter strip pinned at the top jump to any chapter exactly
 * and highlight the chapter being read. Optional params: `chapter` to open at, and `verse` to
 * scroll to and highlight (used by Jesus in Scripture).
 */
export default function BookReaderScreen() {
  const styles = useStyles(makeStyles);
  const params = useLocalSearchParams<{ book: string; chapter?: string; verse?: string }>();
  const { version } = useBibleVersion();
  const info = getBookInfo(params.book);
  const text = info ? getBookText(info.slug, version.id) : undefined;
  const chapterCount = text?.chapters.length ?? 0;

  const startChapter = Math.min(Math.max(Number(params.chapter) || 1, 1), Math.max(chapterCount, 1));
  const highlightVerse = params.verse ? Number(params.verse) : undefined;

  const scrollRef = useRef<ScrollViewInstance>(null);
  const stripRef = useRef<ScrollViewInstance>(null);
  const chapterY = useRef<number[]>([]); // top of each chapter inside the scroll content
  const measured = useRef(0);
  const verseY = useRef<number | null>(null); // highlighted verse's top inside its chapter
  const pendingJump = useRef(startChapter > 1 || highlightVerse !== undefined);
  const [active, setActive] = useState(startChapter);
  const [stripWidth, setStripWidth] = useState(0);

  const chapterLabel = info?.slug === 'psalms' ? 'Psalm' : 'Chapter';

  const scrollToChapter = useCallback((chapter: number, animated: boolean, extra = 0) => {
    const y = chapterY.current[chapter - 1];
    if (y !== undefined) scrollRef.current?.scrollTo({ y: Math.max(y + extra, 0), animated });
  }, []);

  // Once every chapter has been measured, do the initial jump (to a chapter, or to a verse).
  const tryInitialJump = useCallback(() => {
    if (!pendingJump.current || measured.current < chapterCount) return;
    if (highlightVerse !== undefined && verseY.current === null) return; // verse not measured yet
    pendingJump.current = false;
    scrollToChapter(startChapter, false, highlightVerse !== undefined ? (verseY.current ?? 0) - 12 : 0);
    setActive(startChapter);
  }, [chapterCount, highlightVerse, scrollToChapter, startChapter]);

  const onChapterLayout = (index: number) => (e: LayoutChangeEvent) => {
    if (chapterY.current[index] === undefined) measured.current++;
    chapterY.current[index] = e.nativeEvent.layout.y;
    tryInitialJump();
  };

  // Which chapter is at the top of the screen.
  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const { contentOffset, layoutMeasurement, contentSize } = e.nativeEvent;
    // At the very end, short final chapters can't reach the top, so count the last one as active.
    if (contentOffset.y + layoutMeasurement.height >= contentSize.height - 4 && chapterCount) {
      if (active !== chapterCount) setActive(chapterCount);
      return;
    }
    const y = contentOffset.y + 24;
    const ys = chapterY.current;
    let lo = 0;
    let hi = ys.length - 1;
    let found = 0;
    while (lo <= hi) {
      const mid = (lo + hi) >> 1;
      if ((ys[mid] ?? Infinity) <= y) {
        found = mid;
        lo = mid + 1;
      } else hi = mid - 1;
    }
    if (found + 1 !== active) setActive(found + 1);
  };

  // Keep the active chapter's number centered in the strip.
  useEffect(() => {
    if (!stripWidth) return;
    const x = STRIP_PADDING + (active - 1) * (CHIP_WIDTH + CHIP_GAP) - (stripWidth - CHIP_WIDTH) / 2;
    stripRef.current?.scrollTo({ x: Math.max(x, 0), animated: true });
  }, [active, stripWidth]);

  // Reset measurements when switching books.
  useEffect(() => {
    chapterY.current = [];
    measured.current = 0;
    verseY.current = null;
    pendingJump.current = startChapter > 1 || highlightVerse !== undefined;
    setActive(startChapter);
  }, [info?.slug, startChapter, highlightVerse]);

  if (!info || !text) {
    return <Text style={styles.missing}>That book could not be found.</Text>;
  }

  const next = adjacentBook(info.slug, 1);
  const prev = adjacentBook(info.slug, -1);

  return (
    <View style={styles.screen}>
      <Stack.Screen
        options={{
          title: info.name,
          headerRight: () => <Text style={styles.versionTag}>{version.abbr}</Text>,
        }}
      />

      <View style={styles.stripWrap} onLayout={(e) => setStripWidth(e.nativeEvent.layout.width)}>
        <ScrollView
          ref={stripRef}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.strip}>
          {text.chapters.map((_, i) => {
            const n = i + 1;
            const isActive = n === active;
            return (
              <Tappable
                key={n}
                onPress={() => {
                  setActive(n);
                  scrollToChapter(n, false);
                }}
                accessibilityLabel={`${chapterLabel} ${n}`}
                accessibilityState={{ selected: isActive }}
                style={[styles.chip, isActive && styles.chipActive]}>
                <Text style={[styles.chipText, isActive && styles.chipTextActive]}>{n}</Text>
              </Tappable>
            );
          })}
        </ScrollView>
      </View>

      <ScrollView
        key={info.slug}
        ref={scrollRef}
        onScroll={onScroll}
        scrollEventThrottle={32}
        contentContainerStyle={styles.content}>
        <Text style={styles.bookTitle}>{info.name}</Text>

        {text.chapters.map((verses, i) => {
          const chapter = i + 1;
          const hl = chapter === startChapter ? highlightVerse : undefined;
          return (
            <View key={chapter} style={styles.chapter} onLayout={onChapterLayout(i)}>
              <Text style={styles.chapterTitle}>
                {chapterLabel} {chapter}
              </Text>
              {hl && hl >= 1 && hl <= verses.length ? (
                // Split around the highlighted verse so it can be measured and scrolled to.
                <>
                  {hl > 1 ? <VerseBlock verses={verses} from={1} to={hl - 1} /> : null}
                  <View
                    style={styles.highlight}
                    onLayout={(e) => {
                      verseY.current = e.nativeEvent.layout.y;
                      tryInitialJump();
                    }}>
                    <VerseBlock verses={verses} from={hl} to={hl} />
                  </View>
                  {hl < verses.length ? <VerseBlock verses={verses} from={hl + 1} to={verses.length} /> : null}
                </>
              ) : (
                <VerseBlock verses={verses} from={1} to={verses.length} />
              )}
            </View>
          );
        })}

        <View style={styles.footer}>
          {prev ? (
            <Tappable
              onPress={() => router.replace({ pathname: '/bible/[book]', params: { book: prev.slug } })}
              style={styles.navButton}>
              <Text style={styles.navText}>‹ {prev.name}</Text>
            </Tappable>
          ) : (
            <View />
          )}
          {next ? (
            <Tappable
              onPress={() => router.replace({ pathname: '/bible/[book]', params: { book: next.slug } })}
              style={styles.navButton}>
              <Text style={styles.navText}>{next.name} ›</Text>
            </Tappable>
          ) : (
            <View />
          )}
        </View>
      </ScrollView>
    </View>
  );
}

/** Verses `from`..`to` (1-based) as one text block: one verse per line, small verse numbers. */
function VerseBlock({ verses, from, to }: { verses: string[]; from: number; to: number }) {
  const styles = useStyles(makeStyles);
  return (
    <Text style={styles.verseText}>
      {verses.slice(from - 1, to).map((verse, k) => {
        const n = from + k;
        return (
          <Fragment key={n}>
            {k > 0 ? '\n' : null}
            <Text style={styles.verseNum}>{n} </Text>
            {verse || <Text style={styles.omitted}>Not included in this translation.</Text>}
          </Fragment>
        );
      })}
    </Text>
  );
}

const makeStyles = (Colors: Palette) =>
  StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.background },
  versionTag: { color: Colors.textSecondary, fontSize: 14, fontWeight: '600', letterSpacing: 1, paddingHorizontal: Spacing.two },
  stripWrap: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.border,
    backgroundColor: Colors.background,
  },
  strip: { paddingHorizontal: STRIP_PADDING, paddingVertical: Spacing.two, gap: CHIP_GAP },
  chip: {
    width: CHIP_WIDTH,
    height: 36,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipActive: { backgroundColor: Colors.text, borderColor: Colors.text },
  chipText: { color: Colors.textSecondary, fontSize: 15 },
  chipTextActive: { color: Colors.background, fontWeight: '700' },
  content: {
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
    paddingHorizontal: Spacing.three,
    paddingBottom: Spacing.six,
  },
  bookTitle: { color: Colors.text, fontSize: 28, fontWeight: '700', paddingTop: Spacing.four },
  chapter: { paddingTop: Spacing.four },
  chapterTitle: {
    color: Colors.textMuted,
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 1,
    textTransform: 'uppercase',
    paddingBottom: Spacing.two,
  },
  highlight: {
    backgroundColor: Colors.highlight,
    borderRadius: 8,
    paddingVertical: 4,
    paddingHorizontal: Spacing.two,
    marginHorizontal: -Spacing.two,
    marginVertical: 4,
  },
  verseText: { color: Colors.text, fontFamily: Fonts.serif, fontSize: 18, lineHeight: 30 },
  verseNum: { color: Colors.textMuted, fontSize: 12, fontFamily: Fonts.sans },
  omitted: { color: Colors.textMuted, fontSize: 14, fontStyle: 'italic', fontFamily: Fonts.sans },
  footer: { flexDirection: 'row', justifyContent: 'space-between', paddingTop: Spacing.five, gap: Spacing.two },
  navButton: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 999,
    paddingHorizontal: Spacing.three,
    paddingVertical: 10,
    flexShrink: 1,
  },
  navText: { color: Colors.text, fontSize: 15 },
  missing: { color: Colors.textSecondary, textAlign: 'center', marginTop: Spacing.five },
});
