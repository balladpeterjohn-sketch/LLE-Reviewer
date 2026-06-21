import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { useTheme } from '../../src/contexts/ThemeContext';

export default function TabLayout() {
  const { colors } = useTheme();
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor:   colors.primary,
        tabBarInactiveTintColor: colors.textTertiary,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopWidth: 1,
          borderTopColor: colors.border,
          height: 58,
          paddingBottom: 8,
          paddingTop: 4,
        },
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
        headerStyle: { backgroundColor: colors.primary },
        headerTintColor: '#fff',
        headerTitleStyle: { fontWeight: '700', fontSize: 17 },
        headerShadowVisible: false,
      }}
    >
      <Tabs.Screen name="index"     options={{ title: 'Home',      tabBarIcon: ({ color, size, focused }) => <Ionicons name={focused ? 'home' : 'home-outline'}           size={size} color={color} /> }} />
      <Tabs.Screen name="tos"       options={{ title: 'TOS',       tabBarIcon: ({ color, size, focused }) => <Ionicons name={focused ? 'list' : 'list-outline'}           size={size} color={color} /> }} />
      <Tabs.Screen name="citations" options={{ title: 'Citations', tabBarIcon: ({ color, size, focused }) => <Ionicons name={focused ? 'library' : 'library-outline'}     size={size} color={color} /> }} />
      <Tabs.Screen name="books"     options={{ title: 'Books',     tabBarIcon: ({ color, size, focused }) => <Ionicons name={focused ? 'book' : 'book-outline'}           size={size} color={color} /> }} />
    </Tabs>
  );
}
