import '@/global.css';

import { Platform } from 'react-native';

// Minimalist black/white theme (see PRD: UI/UX Highlights), in dark and light versions.
// Screens get the active palette from useColors() / useStyles() in src/lib/theme.tsx.
export type Palette = {
  scheme: 'dark' | 'light';
  background: string;
  surface: string;
  surfaceRaised: string;
  border: string;
  text: string;
  textSecondary: string;
  textMuted: string;
  highlight: string;
  error: string;
};

export const DarkColors: Palette = {
  scheme: 'dark',
  background: '#000000',
  surface: '#111111',
  surfaceRaised: '#1c1c1c',
  border: '#2a2a2a',
  text: '#ffffff',
  textSecondary: '#a3a3a3',
  textMuted: '#6b6b6b',
  highlight: '#262626',
  error: '#ff8a8a',
};

export const LightColors: Palette = {
  scheme: 'light',
  background: '#ffffff',
  surface: '#f4f4f5',
  surfaceRaised: '#e9e9ec',
  border: '#d4d4d8',
  text: '#000000',
  textSecondary: '#3f3f46',
  textMuted: '#6b6b73',
  highlight: '#ececee',
  error: '#b91c1c',
};

export const Fonts = Platform.select({
  ios: { sans: 'system-ui', serif: 'ui-serif' },
  web: { sans: 'var(--font-display)', serif: 'var(--font-serif)' },
  default: { sans: 'normal', serif: 'serif' },
});

export const Spacing = {
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

export const MaxContentWidth = 720;
