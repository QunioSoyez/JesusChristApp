import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { type Href, router } from 'expo-router';
import { useState } from 'react';
import { Linking, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Tappable } from '@/components/tappable';
import { type Palette, Spacing } from '@/constants/theme';
import { ACTIVE_DONATION_LINKS } from '@/data/donate';
import { useBibleVersion } from '@/lib/bible-versions';
import { THEME_MODES, useColors, useStyles, useThemeMode } from '@/lib/theme';

/** Menu button for the top-right of the home screen: appearance, Bible version, About & Credits, Donate. */
export function HomeMenu() {
  const Colors = useColors();
  const styles = useStyles(makeStyles);
  const insets = useSafeAreaInsets();
  const [open, setOpen] = useState(false);
  const { mode, setMode } = useThemeMode();
  const { version } = useBibleVersion();

  const go = (href: Href) => {
    setOpen(false);
    router.push(href);
  };

  return (
    <>
      <Tappable
        onPress={() => setOpen(true)}
        accessibilityLabel="Menu"
        accessibilityHint="Appearance, Bible version, and About & Credits"
        hitSlop={8}
        style={styles.button}>
        <MaterialCommunityIcons name="menu" size={26} color={Colors.text} />
      </Tappable>

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.backdrop} onPress={() => setOpen(false)} accessibilityLabel="Close menu">
          {/* Inner Pressable stops taps on the panel from closing it. */}
          <Pressable style={[styles.panel, { top: insets.top + 52 }]} onPress={() => {}} accessibilityViewIsModal>
            <Text style={styles.sectionTitle}>Appearance</Text>
            <View style={styles.segment} accessibilityRole="radiogroup">
              {THEME_MODES.map((m) => {
                const selected = m.id === mode;
                return (
                  <Pressable
                    key={m.id}
                    onPress={() => setMode(m.id)}
                    accessibilityRole="radio"
                    accessibilityState={{ checked: selected }}
                    accessibilityLabel={`${m.label} appearance`}
                    style={[styles.segmentItem, selected && styles.segmentItemSelected]}>
                    <Text style={[styles.segmentText, selected && styles.segmentTextSelected]}>{m.label}</Text>
                  </Pressable>
                );
              })}
            </View>
            {mode === 'system' ? <Text style={styles.hint}>Follows your phone&apos;s light or dark setting.</Text> : null}

            <View style={styles.divider} />

            <Tappable onPress={() => go('/bible/versions')} style={styles.row} accessibilityLabel={`Bible version: ${version.name}. Change`}>
              <MaterialCommunityIcons name="book-open-variant" size={20} color={Colors.textSecondary} />
              <Text style={styles.rowText}>Bible version</Text>
              <Text style={styles.rowValue}>{version.abbr}</Text>
              <MaterialCommunityIcons name="chevron-right" size={20} color={Colors.textMuted} />
            </Tappable>
            <Tappable onPress={() => go('/about')} style={styles.row}>
              <MaterialCommunityIcons name="information-outline" size={20} color={Colors.textSecondary} />
              <Text style={styles.rowText}>About & Credits</Text>
              <MaterialCommunityIcons name="chevron-right" size={20} color={Colors.textMuted} />
            </Tappable>

            {ACTIVE_DONATION_LINKS.length ? (
              <>
                <View style={styles.divider} />
                <Text style={styles.sectionTitle}>Donate</Text>
                <Text style={styles.hint}>This app is free, with no ads. Gifts help cover the costs of building it.</Text>
                {ACTIVE_DONATION_LINKS.map((link) => (
                  <Tappable
                    key={link.name}
                    onPress={() => {
                      setOpen(false);
                      Linking.openURL(link.url);
                    }}
                    accessibilityRole="link"
                    accessibilityLabel={`Donate with ${link.name}`}
                    accessibilityHint="Opens in your browser"
                    style={styles.row}>
                    <MaterialCommunityIcons name={link.icon} size={20} color={Colors.textSecondary} />
                    <Text style={styles.rowText}>{link.name}</Text>
                    <MaterialCommunityIcons name="open-in-new" size={18} color={Colors.textMuted} />
                  </Tappable>
                ))}
              </>
            ) : null}
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

const makeStyles = (Colors: Palette) =>
  StyleSheet.create({
    button: {
      width: 44,
      height: 44,
      borderRadius: 22,
      alignItems: 'center',
      justifyContent: 'center',
    },
    backdrop: { flex: 1, backgroundColor: Colors.scheme === 'dark' ? 'rgba(0,0,0,0.6)' : 'rgba(0,0,0,0.25)' },
    panel: {
      position: 'absolute',
      right: Spacing.three,
      width: 280,
      maxWidth: '90%',
      backgroundColor: Colors.surface,
      borderWidth: 1,
      borderColor: Colors.border,
      borderRadius: 16,
      padding: Spacing.three,
      gap: Spacing.two,
    },
    sectionTitle: {
      color: Colors.textMuted,
      fontSize: 12,
      fontWeight: '600',
      letterSpacing: 1,
      textTransform: 'uppercase',
    },
    segment: {
      flexDirection: 'row',
      backgroundColor: Colors.background,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: Colors.border,
      padding: 3,
      gap: 3,
    },
    segmentItem: { flex: 1, paddingVertical: 8, borderRadius: 8, alignItems: 'center' },
    segmentItemSelected: { backgroundColor: Colors.text },
    segmentText: { color: Colors.textSecondary, fontSize: 14, fontWeight: '600' },
    segmentTextSelected: { color: Colors.background },
    hint: { color: Colors.textMuted, fontSize: 12 },
    divider: { height: StyleSheet.hairlineWidth, backgroundColor: Colors.border, marginVertical: Spacing.one },
    row: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three, paddingVertical: 10 },
    rowText: { color: Colors.text, fontSize: 16, flex: 1 },
    rowValue: { color: Colors.textSecondary, fontSize: 14, fontWeight: '600', letterSpacing: 1 },
  });
