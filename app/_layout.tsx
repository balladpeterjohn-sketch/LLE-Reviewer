import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ThemeProvider, useTheme } from '../src/contexts/ThemeContext';

function AppStack() {
  const { colors, isDark } = useTheme();
  return (
    <>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: colors.primary },
          headerTintColor: '#fff',
          headerTitleStyle: { fontWeight: '700', fontSize: 17 },
          contentStyle: { backgroundColor: colors.background },
          headerShadowVisible: false,
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="material/[id]" options={{ title: 'Edit Material' }} />
        <Stack.Screen name="material/[id]/preview" options={{ headerShown: false }} />
        <Stack.Screen name="material/new" options={{ title: 'New Material' }} />
        <Stack.Screen name="citation/[id]" options={{ title: 'Edit Citation' }} />
        <Stack.Screen name="citation/new" options={{ title: 'New Citation' }} />
        <Stack.Screen name="book/[id]" options={{ title: 'Compile Book' }} />
        <Stack.Screen name="book/[id]/settings" options={{ title: 'Book Settings' }} />
        <Stack.Screen name="book/[id]/preview" options={{ headerShown: false }} />
        <Stack.Screen name="book/new" options={{ title: 'New Book' }} />
        <Stack.Screen name="tos/[subjectId]" options={{ title: 'TOS Subject' }} />
        <Stack.Screen name="tos/[subjectId]/[topicId]" options={{ title: 'TOS Topic' }} />
      </Stack>
    </>
  );
}

export default function RootLayout() {
  return (
    <ThemeProvider>
      <AppStack />
    </ThemeProvider>
  );
}
