import { Tabs } from 'expo-router';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: true,
        headerStyle: {
          backgroundColor: '#FFFFFF',
        },
        headerTitleStyle: {
          fontWeight: '700',
          color: '#0F172A',
        },
        tabBarActiveTintColor: '#2563EB',
        tabBarInactiveTintColor: '#64748B',
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopColor: '#E2E8F0',
          height: 56,
          paddingBottom: 6,
          paddingTop: 6,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
        },
      }}
    >
      <Tabs.Screen
        name="beranda"
        options={{
          title: 'Beranda',
          headerTitle: 'Beranda GiziGym',
        }}
      />
      <Tabs.Screen
        name="catat"
        options={{
          title: 'Catat',
          headerTitle: 'Catat Makanan',
        }}
      />
      <Tabs.Screen
        name="profil"
        options={{
          title: 'Profil',
          headerTitle: 'Profil Pengguna',
        }}
      />
    </Tabs>
  );
}
