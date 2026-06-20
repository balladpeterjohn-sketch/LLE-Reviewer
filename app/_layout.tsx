import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { colors } from '../src/theme';

export default function RootLayout() {
  return (
    <>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: colors.primary },
          headerTintColor: '#fff',
          headerTitleStyle: { fontWeight: '600' },
          contentStyle: { backgroundColor: colors.background },
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="material/[id]" options={{ title: 'Edit Material' }} />
        <Stack.Screen name="material/[id]/preview" options={{ headerShown: false }} />
        <Stack.Screen name="material/new" options={{ title: 'New Material' }} />
        <Stack.Screen name="citation/[id]" options={{ title: 'Edit Citation' }} />
        <Stack.Screen name="citation/new" options={{ title: 'New Citation' }} />
        <Stack.Screen name="book/[id]" options={{ title: 'Compile Book' }} />
        <Stack.Screen name="book/[id]/preview" options={{ headerShown: false }} />
        <Stack.Screen name="book/new" options={{ title: 'New Book' }} />
        <Stack.Screen name="tos/[subjectId]" options={{ title: 'TOS Subject' }} />
        <Stack.Screen
          name="tos/[subjectId]/[topicId]"
          options={{ title: 'TOS Topic' }}
        />
      </Stack>
    </>
  );
}
