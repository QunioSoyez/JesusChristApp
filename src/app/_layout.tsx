import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useMemo } from 'react';

import { AppThemeProvider, useColors } from '@/lib/theme';

export default function RootLayout() {
  return (
    <AppThemeProvider>
      <ThemedStack />
    </AppThemeProvider>
  );
}

function ThemedStack() {
  const Colors = useColors();
  const navTheme = useMemo(() => {
    const base = Colors.scheme === 'light' ? DefaultTheme : DarkTheme;
    return {
      ...base,
      colors: {
        ...base.colors,
        background: Colors.background,
        card: Colors.background,
        text: Colors.text,
        border: Colors.border,
        primary: Colors.text,
      },
    };
  }, [Colors]);

  return (
    <ThemeProvider value={navTheme}>
      <StatusBar style={Colors.scheme === 'light' ? 'dark' : 'light'} />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: Colors.background },
          headerTintColor: Colors.text,
          headerShadowVisible: false,
          contentStyle: { backgroundColor: Colors.background },
        }}>
        <Stack.Screen name="index" options={{ headerShown: false, title: 'Home' }} />
        <Stack.Screen name="references" options={{ title: 'Jesus in Scripture' }} />
        <Stack.Screen name="churches" options={{ title: 'Find a Church' }} />
        <Stack.Screen name="next-steps" options={{ title: 'Next Steps' }} />
        <Stack.Screen name="about" options={{ title: 'About & Credits' }} />
        <Stack.Screen name="licenses" options={{ title: 'Open-source licenses' }} />
        <Stack.Screen name="history/index" options={{ title: 'History' }} />
        <Stack.Screen name="history/[id]" options={{ title: '' }} />
        <Stack.Screen name="bible/index" options={{ title: 'Bible' }} />
        <Stack.Screen name="bible/versions" options={{ title: 'Bible Versions' }} />
        <Stack.Screen name="bible/[book]/index" options={{ title: '' }} />
        <Stack.Screen name="bible/[book]/[chapter]" options={{ title: '' }} />
      </Stack>
    </ThemeProvider>
  );
}
