import '@/global.css';

import { Platform } from 'react-native';

// Minimalist black/white theme (see PRD: UI/UX Highlights).
export const Colors = {
  background: '#000000',
  surface: '#111111',
  surfaceRaised: '#1c1c1c',
  border: '#2a2a2a',
  text: '#ffffff',
  textSecondary: '#a3a3a3',
  textMuted: '#6b6b6b',
  highlight: '#262626',
} as const;

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
