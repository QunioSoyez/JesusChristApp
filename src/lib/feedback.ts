// Feedback by email: opens the person's email app with a message already started, including the
// app version and device so testers don't have to look them up. Change FEEDBACK_EMAIL here.
// (Later, for a bigger audience, this could become an in-app form instead.)
import type MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import Constants from 'expo-constants';
import * as Device from 'expo-device';
import type { ComponentProps } from 'react';
import { Linking, Platform } from 'react-native';

export const FEEDBACK_EMAIL = 'help@missionctrl.team';

/** The app's website (the web version). */
export const WEBSITE_URL = 'https://jesuschristapp.live';

export const FEEDBACK_NOTE = `For questions, comments, feature requests, and bug reports, please contact ${FEEDBACK_EMAIL}`;

export type FeedbackKind = {
  id: 'bug' | 'feature' | 'question';
  label: string;
  icon: ComponentProps<typeof MaterialCommunityIcons>['name'];
  subject: string;
  /** Prompts at the top of the email body. */
  prompts: string[];
};

export const FEEDBACK_KINDS: FeedbackKind[] = [
  {
    id: 'bug',
    label: 'Report a bug',
    icon: 'bug-outline',
    subject: 'Bug report',
    prompts: ['What happened?', 'What were you doing when it happened?'],
  },
  {
    id: 'feature',
    label: 'Request a feature',
    icon: 'lightbulb-on-outline',
    subject: 'Feature request',
    prompts: ['What would you like the app to do?'],
  },
  {
    id: 'question',
    label: 'Questions & comments',
    icon: 'email-outline',
    subject: 'Question or comment',
    prompts: [],
  },
];

/** "Version 1.0.0 · Android 15 · Pixel 7" (or the web browser). */
function deviceSummary(): string {
  const parts = [`App version ${Constants.expoConfig?.version ?? 'unknown'}`];
  if (Platform.OS === 'web') {
    // Which address they were on (e.g. jesuschristapp.live) plus their browser.
    const site = typeof location !== 'undefined' ? location.host : WEBSITE_URL.replace('https://', '');
    parts.push(`Web (${site})`, typeof navigator !== 'undefined' ? navigator.userAgent : 'browser');
  } else {
    parts.push(`${Platform.OS === 'ios' ? 'iOS' : 'Android'} ${Device.osVersion ?? Platform.Version}`);
    if (Device.modelName) parts.push(Device.modelName);
  }
  return parts.join(' · ');
}

/** Opens a new email to FEEDBACK_EMAIL. Returns false if no email app could be opened. */
export async function openFeedbackEmail(kind: FeedbackKind): Promise<boolean> {
  const body = [...kind.prompts.flatMap((p) => [p, '', '']), '', '---', deviceSummary()].join('\n');
  const url = `mailto:${FEEDBACK_EMAIL}?subject=${encodeURIComponent(`Jesus Christ App: ${kind.subject}`)}&body=${encodeURIComponent(body)}`;
  try {
    await Linking.openURL(url);
    return true;
  } catch {
    return false;
  }
}
