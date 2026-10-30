// Light / Dark / System appearance. The choice is saved on the device; "system" follows the
// phone's own setting (and is the default for new users).
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, type ReactNode, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useColorScheme } from 'react-native';

import { DarkColors, LightColors, type Palette } from '@/constants/theme';

export type ThemeMode = 'system' | 'light' | 'dark';
export const THEME_MODES: { id: ThemeMode; label: string }[] = [
  { id: 'light', label: 'Light' },
  { id: 'dark', label: 'Dark' },
  { id: 'system', label: 'System' },
];

const STORAGE_KEY = 'appearance.mode';
const DEFAULT_MODE: ThemeMode = 'system';

type ThemeContextValue = { mode: ThemeMode; setMode: (mode: ThemeMode) => void; colors: Palette };
const ThemeContext = createContext<ThemeContextValue | null>(null);

export function AppThemeProvider({ children }: { children: ReactNode }) {
  const system = useColorScheme(); // 'light' | 'dark' | null/undefined
  const [mode, setModeState] = useState<ThemeMode | null>(null); // null until loaded

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((saved) => setModeState(saved === 'light' || saved === 'dark' || saved === 'system' ? saved : DEFAULT_MODE))
      .catch(() => setModeState(DEFAULT_MODE));
  }, []);

  const setMode = useCallback((next: ThemeMode) => {
    setModeState(next);
    AsyncStorage.setItem(STORAGE_KEY, next).catch(() => {
      // Not fatal: the choice still applies for this session.
    });
  }, []);

  const value = useMemo<ThemeContextValue | null>(() => {
    if (!mode) return null;
    const scheme = mode === 'system' ? (system === 'light' ? 'light' : 'dark') : mode;
    return { mode, setMode, colors: scheme === 'light' ? LightColors : DarkColors };
  }, [mode, setMode, system]);

  // Render nothing for the moment it takes to read the saved choice, so the app never flashes
  // the wrong theme on startup (the black splash screen stays up instead).
  if (!value) return null;
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

function useThemeContext(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useColors/useThemeMode must be used inside <AppThemeProvider>');
  return ctx;
}

/** The active color palette. */
export function useColors(): Palette {
  return useThemeContext().colors;
}

/** The saved mode ('light' | 'dark' | 'system') and a setter. */
export function useThemeMode() {
  const { mode, setMode, colors } = useThemeContext();
  return { mode, setMode, scheme: colors.scheme };
}

/** Styles built from the active palette: `const styles = useStyles(makeStyles)`. */
export function useStyles<T>(factory: (colors: Palette) => T): T {
  const colors = useColors();
  return useMemo(() => factory(colors), [factory, colors]);
}
