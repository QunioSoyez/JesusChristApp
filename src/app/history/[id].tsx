import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Image, Linking, Modal, Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Tappable } from '@/components/tappable';
import { MaxContentWidth, Spacing, type Palette } from '@/constants/theme';
import { HISTORY, type HistoryRef } from '@/data/history';
import { HISTORY_IMAGES, type HistoryImage } from '@/data/history-images';
import { formatRef } from '@/lib/bible';
import { useColors, useStyles } from '@/lib/theme';

const refLabel = (r: HistoryRef) => `${formatRef(r.b, r.c, r.v)}${r.to ? `–${r.to}` : ''}`;

/** One place or find: photo, short text, Bible passages and sources. */
export default function HistoryDetailScreen() {
  const styles = useStyles(makeStyles);
  const Colors = useColors();
  const { id } = useLocalSearchParams<{ id: string }>();
  const entry = HISTORY.find((e) => e.id === id);
  const image = entry ? HISTORY_IMAGES[entry.id] : undefined;
  const [fullScreen, setFullScreen] = useState(false);
  const [photoWidth, setPhotoWidth] = useState(0);
  const windowHeight = useWindowDimensions().height;

  if (!entry) {
    return (
      <View style={styles.missing}>
        <Stack.Screen options={{ title: 'Not found' }} />
        <Text style={styles.body}>That page couldn’t be found.</Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <Stack.Screen options={{ title: entry.category === 'place' ? 'Gospel place' : 'Archaeology' }} />

      {image ? (
        <View>
          <Tappable
            onPress={() => setFullScreen(true)}
            accessibilityLabel={`Photo of ${entry.title}`}
            accessibilityHint="Opens the photo full screen"
            onLayout={(e) => setPhotoWidth(e.nativeEvent.layout.width)}
            style={styles.photo}>
            {/* The whole photo is shown, scaled to fit; tall photos are capped at 60% of the screen height. */}
            {photoWidth > 0 ? (
              <Image
                source={image.source}
                style={{
                  width: photoWidth,
                  height: Math.min(photoWidth * (image.height / image.width), windowHeight * 0.6),
                }}
                resizeMode="contain"
                accessibilityIgnoresInvertColors
              />
            ) : null}
          </Tappable>
          <PhotoCredit image={image} />
          <FullScreenPhoto image={image} title={entry.title} visible={fullScreen} onClose={() => setFullScreen(false)} />
        </View>
      ) : null}

      <View style={styles.text}>
        <Text style={styles.title} accessibilityRole="header">
          {entry.title}
        </Text>
        <Text style={styles.subtitle}>{entry.subtitle}</Text>
        {entry.body.map((p, i) => (
          <Text key={i} style={styles.body}>
            {p}
          </Text>
        ))}
      </View>

      <Text style={styles.sectionTitle}>In the Bible</Text>
      <View style={styles.chips}>
        {entry.refs.map((r) => (
          <Tappable
            key={refLabel(r)}
            onPress={() =>
              router.push({ pathname: '/bible/[book]', params: { book: r.b, chapter: String(r.c), verse: String(r.v) } })
            }
            accessibilityLabel={`Read ${refLabel(r)}`}
            style={styles.chip}>
            <MaterialCommunityIcons name="book-open-variant" size={16} color={Colors.text} />
            <Text style={styles.chipText}>{refLabel(r)}</Text>
          </Tappable>
        ))}
      </View>

      <Text style={styles.sectionTitle}>Sources</Text>
      {entry.sources.map((s) => (
        <Text key={s.url} style={styles.link} onPress={() => Linking.openURL(s.url)} accessibilityRole="link">
          {s.title}
        </Text>
      ))}

      {/* Always offer a way to the full list, even when this page was opened from a link. */}
      <Tappable onPress={() => router.navigate('/history')} style={styles.allButton} accessibilityLabel="See all places and finds">
        <MaterialCommunityIcons name="pillar" size={18} color={Colors.text} />
        <Text style={styles.allText}>All places and finds</Text>
      </Tappable>
    </ScrollView>
  );
}

function PhotoCredit({ image }: { image: HistoryImage }) {
  const styles = useStyles(makeStyles);
  return (
    <Text style={styles.credit} onPress={() => Linking.openURL(image.pageUrl)} accessibilityRole="link">
      Photo: {image.author} · {image.license} · Wikimedia Commons
    </Text>
  );
}

function FullScreenPhoto({
  image,
  title,
  visible,
  onClose,
}: {
  image: HistoryImage;
  title: string;
  visible: boolean;
  onClose: () => void;
}) {
  const insets = useSafeAreaInsets();
  return (
    <Modal visible={visible} animationType="fade" onRequestClose={onClose} supportedOrientations={['portrait', 'landscape']}>
      <View style={full.screen}>
        {/* iOS can pinch-zoom inside a ScrollView; elsewhere the photo is shown fitted to the screen. */}
        <ScrollView
          style={full.screen}
          contentContainerStyle={full.center}
          maximumZoomScale={4}
          minimumZoomScale={1}
          centerContent
          showsHorizontalScrollIndicator={false}
          showsVerticalScrollIndicator={false}>
          <Image source={image.source} style={full.image} resizeMode="contain" accessibilityLabel={`Photo of ${title}`} />
        </ScrollView>
        <Pressable
          onPress={onClose}
          accessibilityRole="button"
          accessibilityLabel="Close photo"
          hitSlop={12}
          style={[full.close, { top: insets.top + 12 }]}>
          <MaterialCommunityIcons name="close" size={26} color="#fff" />
        </Pressable>
        <Text style={[full.caption, { paddingBottom: insets.bottom + 12 }]} numberOfLines={2}>
          {title} — Photo: {image.author} · {image.license}
        </Text>
      </View>
    </Modal>
  );
}

// The full-screen viewer is always black, whatever the app theme, like a photo viewer.
const full = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#000' },
  center: { flexGrow: 1, alignItems: 'center', justifyContent: 'center' },
  image: { width: '100%', height: '100%' },
  close: {
    position: 'absolute',
    right: 16,
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  caption: { position: 'absolute', left: 16, right: 16, bottom: 0, color: '#ccc', fontSize: 12, textAlign: 'center' },
});

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
    missing: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: Spacing.four },
    photo: { width: '100%', borderRadius: 14, overflow: 'hidden', backgroundColor: Colors.surface },
    credit: { color: Colors.textMuted, fontSize: 11, lineHeight: 15, marginTop: 6 },
    text: { gap: Spacing.three, marginTop: Spacing.three },
    title: { color: Colors.text, fontSize: 24, fontWeight: '700' },
    subtitle: { color: Colors.textSecondary, fontSize: 15, marginTop: -Spacing.two },
    body: { color: Colors.text, fontSize: 16, lineHeight: 24 },
    sectionTitle: {
      color: Colors.textMuted,
      fontSize: 13,
      fontWeight: '600',
      letterSpacing: 1,
      textTransform: 'uppercase',
      marginTop: Spacing.four,
      marginBottom: Spacing.two,
    },
    chips: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two },
    chip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      borderWidth: 1,
      borderColor: Colors.border,
      backgroundColor: Colors.surface,
      borderRadius: 999,
      paddingHorizontal: 12,
      paddingVertical: 7,
    },
    chipText: { color: Colors.text, fontSize: 14, fontWeight: '600' },
    link: { color: Colors.text, fontSize: 14, textDecorationLine: 'underline', marginBottom: Spacing.two },
    allButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: Spacing.two,
      marginTop: Spacing.four,
      paddingVertical: 12,
      borderRadius: 999,
      borderWidth: 1,
      borderColor: Colors.border,
    },
    allText: { color: Colors.text, fontSize: 15, fontWeight: '600' },
  });
