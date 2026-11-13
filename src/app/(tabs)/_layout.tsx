import { Redirect, Tabs } from 'expo-router';

import { palette } from '@/components/minex-ui';
import { useAuth } from '@/context/auth-context';

export default function TabLayout() {
  const { session } = useAuth();
  if (!session) return <Redirect href="/" />;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: palette.green,
        tabBarInactiveTintColor: palette.muted,
        tabBarStyle: {
          height: 64,
          paddingTop: 7,
          paddingBottom: 8,
          backgroundColor: '#FFFFFF',
          borderTopColor: palette.border,
        },
        tabBarLabelStyle: { fontSize: 10, fontWeight: '700' },
      }}>
      <Tabs.Screen name="index" options={{ title: 'Accueil', tabBarLabel: 'Accueil' }} />
      <Tabs.Screen name="equipment" options={{ title: 'Parc', tabBarLabel: 'Parc' }} />
      <Tabs.Screen name="planning" options={{ title: 'Planning', tabBarLabel: 'Planning' }} />
      <Tabs.Screen name="intervention" options={{ title: 'Intervention', tabBarLabel: 'Terrain' }} />
      <Tabs.Screen name="data" options={{ title: 'Tables SQLite', tabBarLabel: 'Tables' }} />
    </Tabs>
  );
}
