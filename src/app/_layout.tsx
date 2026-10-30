import { DarkTheme, Stack, ThemeProvider } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

import { Colors } from '@/constants/theme';

const theme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    background: Colors.background,
    card: Colors.background,
    text: Colors.text,
    border: Colors.border,
    primary: Colors.text,
  },
};

export default function RootLayout() {
  return (
    <ThemeProvider value={theme}>
      <StatusBar style="light" />
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
        <Stack.Screen name="bible/index" options={{ title: 'Bible' }} />
        <Stack.Screen name="bible/[book]/index" options={{ title: '' }} />
        <Stack.Screen name="bible/[book]/[chapter]" options={{ title: '' }} />
      </Stack>
    </ThemeProvider>
  );
}
