import { Linking, ScrollView, StyleSheet, Text, View } from 'react-native';

import { MaxContentWidth, Spacing, type Palette } from '@/constants/theme';
import { FEEDBACK_EMAIL, WEBSITE_URL } from '@/lib/feedback';
import { useStyles } from '@/lib/theme';

// The app's privacy policy, also at https://jesuschristapp.live/privacy (the address app stores ask for).
// Keep it accurate: update it whenever the app starts sending, storing or sharing anything new.
const EFFECTIVE_DATE = 'November 3, 2026';

type Block = { heading: string; paragraphs: string[] };

const POLICY: Block[] = [
  {
    heading: 'The short version',
    paragraphs: [
      'The Jesus Christ App has no accounts, no ads and no tracking. We don’t collect your name, email or any personal information, and we don’t sell or share data about you.',
    ],
  },
  {
    heading: 'What stays on your device',
    paragraphs: [
      'The app remembers two settings on your device: your chosen Bible version and your appearance setting (Light, Dark or System). They never leave your device. Deleting the app (or clearing your browser’s site data, on the web) removes them.',
      'The Bible text, the History photos, the Prayer Guide and the other content are built into the app, so reading them sends nothing anywhere.',
    ],
  },
  {
    heading: 'Find a Church',
    paragraphs: [
      'Apart from links you choose to open and feedback you choose to send (see below), Find a Church is the only feature that sends information off your device, and only when you use it.',
      'If you tap “Near me”, the app asks for permission to use your location. Your location is sent to our church search service (run on Cloudflare) to find churches nearby, and it is not saved by us. You can say no and type a city or ZIP code instead.',
      'If you type a city or ZIP code, it is sent to our service, which looks it up using OpenStreetMap’s Nominatim service. We keep the typed text (not who sent it) for up to 7 days so repeat searches are faster.',
      'The map images come from OpenStreetMap’s tile servers, which receive your device’s internet address and the map area being shown, as any website would. Tapping “Directions” opens Apple Maps or Google Maps, which have their own privacy policies.',
    ],
  },
  {
    heading: 'Feedback and links',
    paragraphs: [
      `If you send feedback, your email app sends it to ${FEEDBACK_EMAIL}. We receive your email address, your message, and the app version and device type the app adds to the message (you can see and remove them before sending). We use these only to reply and to improve the app.`,
      'Links to other websites (for example Bible sources, Wikipedia, prayer lines and donation pages) open those sites, which have their own privacy policies.',
    ],
  },
  {
    heading: 'The website',
    paragraphs: [
      `The web version (${WEBSITE_URL.replace('https://', '')}) is hosted by Cloudflare, which keeps standard short-term server logs, such as internet addresses, to run and protect the site. We don’t add analytics or advertising.`,
    ],
  },
  {
    heading: 'Children',
    paragraphs: [
      'The app is for everyone. Because it doesn’t collect personal information, it doesn’t knowingly collect any from children.',
    ],
  },
  {
    heading: 'Changes and contact',
    paragraphs: [
      'If this policy changes, the new version will appear here with a new date.',
      `Questions? Contact Mission CTRL (missionctrl.team) at ${FEEDBACK_EMAIL}.`,
    ],
  },
];

/** Privacy policy (also used as the app stores' privacy policy page on the web). */
export default function PrivacyScreen() {
  const styles = useStyles(makeStyles);
  return (
    <ScrollView contentContainerStyle={styles.content}>
      <Text style={styles.title} accessibilityRole="header">
        Privacy Policy
      </Text>
      <Text style={styles.meta}>Jesus Christ App · Mission CTRL · Effective {EFFECTIVE_DATE}</Text>
      {POLICY.map((block) => (
        <View key={block.heading} style={styles.block}>
          <Text style={styles.heading} accessibilityRole="header">
            {block.heading}
          </Text>
          {block.paragraphs.map((p, i) => (
            <Text key={i} style={styles.paragraph}>
              {p}
            </Text>
          ))}
        </View>
      ))}
      <Text style={styles.link} onPress={() => Linking.openURL(`mailto:${FEEDBACK_EMAIL}`)} accessibilityRole="link">
        {FEEDBACK_EMAIL}
      </Text>
    </ScrollView>
  );
}

const makeStyles = (Colors: Palette) =>
  StyleSheet.create({
    content: {
      width: '100%',
      maxWidth: MaxContentWidth,
      alignSelf: 'center',
      paddingHorizontal: Spacing.three,
      paddingTop: Spacing.three,
      paddingBottom: Spacing.six,
      gap: Spacing.three,
    },
    title: { color: Colors.text, fontSize: 26, fontWeight: '700' },
    meta: { color: Colors.textMuted, fontSize: 13, marginTop: -Spacing.two },
    block: { gap: Spacing.two },
    heading: { color: Colors.text, fontSize: 18, fontWeight: '700' },
    paragraph: { color: Colors.textSecondary, fontSize: 15, lineHeight: 23 },
    link: { color: Colors.text, fontSize: 15, textDecorationLine: 'underline' },
  });
