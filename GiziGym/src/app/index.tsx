import { useCallback, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { Redirect, useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSQLiteContext } from 'expo-sqlite';
import { getProfile } from '../db/queries';

export default function IndexScreen() {
  const db = useSQLiteContext();
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(true);
  const [hasProfile, setHasProfile] = useState<boolean | null>(null);

  useFocusEffect(
    useCallback(() => {
      let isMounted = true;
      async function checkProfile() {
        setLoading(true);
        try {
          const profile = await getProfile(db);
          if (isMounted) {
            setHasProfile(!!profile);
          }
        } catch (e) {
          console.error('Gagal membaca profil:', e);
          if (isMounted) {
            setHasProfile(false);
          }
        } finally {
          if (isMounted) {
            setLoading(false);
          }
        }
      }

      checkProfile();

      return () => {
        isMounted = false;
      };
    }, [db])
  );

  if (loading || hasProfile === null) {
    return (
      <View
        style={[
          styles.container,
          {
            paddingTop: insets.top,
            paddingBottom: insets.bottom,
          },
        ]}
      >
        <ActivityIndicator size="large" color="#2563EB" />
        <Text style={styles.loadingText}>Memeriksa profil...</Text>
      </View>
    );
  }

  if (hasProfile) {
    return <Redirect href="/beranda" />;
  }

  return <Redirect href="/onboarding" />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8FAFC',
    padding: 16,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 15,
    color: '#64748B',
  },
});
