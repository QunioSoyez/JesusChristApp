import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { router } from 'expo-router';
import { Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Colors, MaxContentWidth, Spacing } from '@/constants/theme';
import { CRISIS, type Resource, SECTIONS } from '@/data/next-steps';

export default function NextStepsScreen() {
  return (
    <ScrollView contentContainerStyle={styles.content}>
      <Text style={styles.intro}>
        Questions about Jesus, or wondering what comes next? These people and places are ready to help.
      </Text>

      {SECTIONS.map((section) => (
        <View key={section.title} style={styles.section}>
          <Text style={styles.sectionTitle}>{section.title}</Text>
          {section.items.map((item) => (
            <ResourceCard key={item.name} item={item} />
          ))}
        </View>
      ))}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>In crisis?</Text>
        <ResourceCard item={CRISIS} />
      </View>

      <Text style={styles.footnote}>Phone numbers are for the United States.</Text>
      <Text style={styles.aboutLink} onPress={() => router.push('/about')} accessibilityRole="link">
        About & Credits
      </Text>
    </ScrollView>
  );
}

function ResourceCard({ item }: { item: Resource }) {
  return (
    <View style={styles.card}>
      <Text style={styles.name}>{item.name}</Text>
      <Text style={styles.description}>{item.description}</Text>
      {item.hours ? <Text style={styles.hours}>{item.hours}</Text> : null}

      <View style={styles.actions}>
        {item.phone ? (
          <Action
            icon="phone"
            label={item.phone.display}
            primary
            onPress={() => Linking.openURL(`tel:${item.phone!.dial}`)}
          />
        ) : null}
        {item.text ? (
          <Action
            icon="message-text-outline"
            label={item.text.display}
            onPress={() => Linking.openURL(`sms:${item.text!.number}`)}
          />
        ) : null}
        {item.link ? (
          <Action icon="open-in-new" label={item.link.label} onPress={() => Linking.openURL(item.link!.url)} />
        ) : null}
      </View>
    </View>
  );
}

function Action({
  icon,
  label,
  onPress,
  primary,
}: {
  icon: 'phone' | 'message-text-outline' | 'open-in-new';
  label: string;
  onPress: () => void;
  primary?: boolean;
}) {
  const color = primary ? Colors.background : Colors.text;
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole={icon === 'open-in-new' ? 'link' : 'button'}
      style={({ pressed }) => StyleSheet.flatten([styles.action, primary && styles.actionPrimary, pressed && styles.pressed])}>
      <MaterialCommunityIcons name={icon} size={16} color={color} />
      <Text style={[styles.actionText, { color }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  content: {
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
    paddingHorizontal: Spacing.three,
    paddingBottom: Spacing.six,
  },
  intro: { color: Colors.textSecondary, fontSize: 15, lineHeight: 22, paddingTop: Spacing.two },
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
  name: { color: Colors.text, fontSize: 17, fontWeight: '600' },
  description: { color: Colors.textSecondary, fontSize: 14, lineHeight: 20 },
  hours: { color: Colors.textMuted, fontSize: 13 },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two, marginTop: Spacing.two },
  action: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 7,
  },
  actionPrimary: { backgroundColor: Colors.text, borderColor: Colors.text },
  actionText: { fontSize: 14, fontWeight: '600' },
  footnote: { color: Colors.textMuted, fontSize: 12, marginTop: Spacing.four },
  aboutLink: { color: Colors.textSecondary, fontSize: 13, textDecorationLine: 'underline', marginTop: Spacing.three },
  pressed: { opacity: 0.6 },
});
