import Constants from 'expo-constants';
import { router } from 'expo-router';
import { useState } from 'react';
import { Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Cross } from '@/components/cross';
import { Tappable } from '@/components/tappable';
import { MaxContentWidth, Spacing, type Palette } from '@/constants/theme';
import { useStyles } from '@/lib/theme';
import { APP_REPO_URL, COMPONENTS, type Credit, DATA_SOURCES } from '@/data/credits';
import licenses from '@/data/licenses.json';

/** Full license text for an npm package, from the generated licenses.json. */
function packageLicenseText(name: string): string | undefined {
  const pkg = licenses.packages.find((p) => p.n === name);
  return pkg && pkg.t >= 0 ? licenses.texts[pkg.t] : undefined;
}

export default function AboutScreen() {
  const styles = useStyles(makeStyles);
  const version = Constants.expoConfig?.version ?? '';

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Cross size={56} />
        <Text style={styles.appName}>Jesus Christ App</Text>
        {version ? <Text style={styles.version}>Version {version}</Text> : null}
        <Text style={styles.intro}>
          A free, open-source app to help anyone learn more about Jesus. No account, no ads, and
          nothing about you is stored.
        </Text>
        <Text style={styles.link} onPress={() => Linking.openURL(APP_REPO_URL)}>
          Source code on GitHub (MIT License)
        </Text>
      </View>

      <Section title="Data sources" items={DATA_SOURCES} />
      <Section title="Built with" items={COMPONENTS} />

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Open-source licenses</Text>
        <Tappable onPress={() => router.push('/licenses')} style={styles.card}>
          <Text style={styles.name}>All {licenses.packages.length} open-source packages</Text>
          <Text style={styles.use}>Names, licenses and full license texts for everything included in this app.</Text>
        </Tappable>
      </View>
    </ScrollView>
  );
}

function Section({ title, items }: { title: string; items: Credit[] }) {
  const styles = useStyles(makeStyles);
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {items.map((item) => (
        <CreditCard key={item.name} item={item} />
      ))}
    </View>
  );
}

function CreditCard({ item }: { item: Credit }) {
  const styles = useStyles(makeStyles);
  const [open, setOpen] = useState(false);
  const fullText = [item.notice, item.licensePackage ? packageLicenseText(item.licensePackage) : undefined]
    .filter(Boolean)
    .join('\n\n');

  return (
    <View style={styles.card}>
      <Text style={styles.name}>{item.name}</Text>
      <Text style={styles.use}>{item.use}</Text>
      <Text style={styles.license}>{item.license}</Text>
      <View style={styles.actions}>
        <Text style={styles.link} onPress={() => Linking.openURL(item.url)}>
          Website
        </Text>
        {fullText ? (
          <Pressable onPress={() => setOpen((o) => !o)} accessibilityRole="button" hitSlop={8}>
            <Text style={styles.link}>{open ? 'Hide license' : 'Show license'}</Text>
          </Pressable>
        ) : null}
      </View>
      {open ? <Text style={styles.licenseText}>{fullText}</Text> : null}
    </View>
  );
}

const makeStyles = (Colors: Palette) =>
  StyleSheet.create({
  content: {
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
    paddingHorizontal: Spacing.three,
    paddingBottom: Spacing.six,
  },
  header: { alignItems: 'center', gap: Spacing.two, paddingTop: Spacing.four },
  appName: { color: Colors.text, fontSize: 22, fontWeight: '700', marginTop: Spacing.two },
  version: { color: Colors.textMuted, fontSize: 13 },
  intro: { color: Colors.textSecondary, fontSize: 15, lineHeight: 22, textAlign: 'center' },
  section: { marginTop: Spacing.four, gap: Spacing.two },
  sectionTitle: {
    color: Colors.textMuted,
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  card: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 14,
    padding: Spacing.three,
    gap: 4,
  },
  name: { color: Colors.text, fontSize: 16, fontWeight: '600' },
  use: { color: Colors.textSecondary, fontSize: 14, lineHeight: 20 },
  license: { color: Colors.textMuted, fontSize: 13 },
  actions: { flexDirection: 'row', gap: Spacing.four, marginTop: Spacing.one },
  link: { color: Colors.text, fontSize: 14, textDecorationLine: 'underline' },
  licenseText: {
    color: Colors.textSecondary,
    fontSize: 12,
    lineHeight: 17,
    marginTop: Spacing.two,
    fontFamily: 'monospace',
  },
});
