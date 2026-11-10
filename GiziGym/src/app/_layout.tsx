import { Stack } from 'expo-router';
import { SQLiteProvider } from 'expo-sqlite';
import { DATABASE_NAME, migrateDbIfNeeded } from '../db/database';

export default function RootLayout() {
  return (
    <SQLiteProvider databaseName={DATABASE_NAME} onInit={migrateDbIfNeeded}>
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: '#F8FAFC' },
        }}
      >
        <Stack.Screen name="index" />
        <Stack.Screen name="onboarding" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen
          name="food/[id]"
          options={{
            headerShown: true,
            title: 'Detail Makanan',
            headerStyle: { backgroundColor: '#FFFFFF' },
            headerTitleStyle: { fontWeight: '700', color: '#0F172A' },
            headerTintColor: '#2563EB',
          }}
        />
      </Stack>
    </SQLiteProvider>
  );
}
