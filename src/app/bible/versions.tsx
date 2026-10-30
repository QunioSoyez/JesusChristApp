import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { router, useLocalSearchParams } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { Tappable } from '@/components/tappable';
import { Colors, MaxContentWidth, Spacing } from '@/constants/theme';
import { BIBLE_VERSIONS, useBibleVersion } from '@/lib/bible-versions';

/** Pick a Bible version. Shown on first visit to the Bible, and from the book list's version button. */
export default function VersionsScreen() {
  const { first } = useLocalSearchParams<{ first?: string }>();
  const { chosen, choose } = useBibleVersion();

  const pick = async (id: string) => {
    await choose(id);
    if (first) router.replace('/bible');
    else router.back();
  };

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <Text style={styles.intro}>
        {first ? 'Choose a Bible version to read. You can change it any time.' : 'Choose a Bible version.'}
      </Text>

      {BIBLE_VERSIONS.map((v) => {
        const selected = v.id === chosen;
        return (
          <Tappable
            key={v.id}
            onPress={() => pick(v.id)}
            accessibilityState={{ selected }}
            accessibilityLabel={`${v.name} (${v.abbr})`}
            style={[styles.card, selected && styles.cardSelected]}>
            <View style={styles.cardTop}>
              <Text style={styles.abbr}>{v.abbr}</Text>
              {selected ? <MaterialCommunityIcons name="check" size={20} color={Colors.text} /> : null}
            </View>
            <Text style={styles.name}>{v.name}</Text>
            <Text style={styles.description}>{v.description}</Text>
          </Tappable>
        );
      })}

      <Text style={styles.more}>More versions are coming.</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
    padding: Spacing.three,
    gap: Spacing.three,
  },
  intro: { color: Colors.textSecondary, fontSize: 15, lineHeight: 22 },
  card: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 14,
    padding: Spacing.three,
    gap: 4,
  },
  cardSelected: { borderColor: Colors.text },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  abbr: { color: Colors.text, fontSize: 20, fontWeight: '700', letterSpacing: 1 },
  name: { color: Colors.text, fontSize: 16 },
  description: { color: Colors.textSecondary, fontSize: 14, lineHeight: 20 },
  more: { color: Colors.textMuted, fontSize: 13, textAlign: 'center', marginTop: Spacing.two },
});
