import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { deleteFoodLog, getFoodLogsByDate, getProfile } from '../../db/queries';
import { formatDisplayDate, getLocalDateString } from '../../lib/date';
import {
  calculateNutrition,
  formatKalori,
  formatProtein,
} from '../../lib/nutrition';
import { FoodLogItem, NutritionTargets, Profile } from '../../types';

export default function BerandaScreen() {
  const db = useSQLiteContext();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [targets, setTargets] = useState<NutritionTargets | null>(null);
  const [logs, setLogs] = useState<FoodLogItem[]>([]);
  const [todayStr, setTodayStr] = useState<string>('');

  const loadData = useCallback(async () => {
    try {
      const today = getLocalDateString();
      setTodayStr(today);

      const currentProfile = await getProfile(db);
      setProfile(currentProfile);

      if (currentProfile) {
        const calculatedTargets = calculateNutrition(currentProfile);
        setTargets(calculatedTargets);
      } else {
        setTargets(null);
      }

      const dailyLogs = await getFoodLogsByDate(db, today);
      setLogs(dailyLogs);
    } catch (e) {
      console.error('Gagal memuat data beranda:', e);
    } finally {
      setLoading(false);
    }
  }, [db]);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const handleDeleteLog = async (id: number) => {
    try {
      await deleteFoodLog(db, id);
      await loadData();
    } catch (e) {
      console.error('Gagal menghapus catatan makanan:', e);
    }
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#2563EB" />
        <Text style={styles.loadingText}>Memuat data beranda...</Text>
      </View>
    );
  }

  if (!profile || !targets) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.emptyTitle}>Profil Belum Diatur</Text>
        <Text style={styles.emptySubtitle}>
          Atur profil Anda terlebih dahulu untuk mulai menghitung target nutrisi harian.
        </Text>
        <Pressable
          style={styles.primaryButton}
          onPress={() => router.push('/onboarding')}
        >
          <Text style={styles.primaryButtonText}>Atur Profil</Text>
        </Pressable>
      </View>
    );
  }

  // Hitung total kalori & protein terpakai hari ini
  const totalKalori = logs.reduce((sum, item) => sum + item.kalori, 0);
  const totalProtein = logs.reduce((sum, item) => sum + item.protein, 0);

  // Sisa kalori & protein (target - total, boleh minus)
  const sisaKalori = targets.targetKalori - totalKalori;
  const sisaProtein = targets.targetProtein - totalProtein;

  // Persentase untuk progress bar (0 - 100%)
  const kaloriPercent = targets.targetKalori > 0
    ? Math.min(Math.max((totalKalori / targets.targetKalori) * 100, 0), 100)
    : 0;

  const proteinPercent = targets.targetProtein > 0
    ? Math.min(Math.max((totalProtein / targets.targetProtein) * 100, 0), 100)
    : 0;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      keyboardShouldPersistTaps="handled"
    >
      {/* Header Tanggal */}
      <View style={styles.dateHeader}>
        <Text style={styles.dateLabel}>Hari Ini</Text>
        <Text style={styles.dateValue}>{formatDisplayDate(todayStr)}</Text>
      </View>

      {/* Kartu Target Kalori & Protein */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Ringkasan Nutrisi Hari Ini</Text>

        {/* Kalori */}
        <View style={styles.nutrientSection}>
          <View style={styles.nutrientHeader}>
            <Text style={styles.nutrientName}>Kalori</Text>
            <Text style={styles.nutrientValues}>
              {formatKalori(totalKalori)} / {formatKalori(targets.targetKalori)} kkal
            </Text>
          </View>
          <View style={styles.progressBarBackground}>
            <View
              style={[
                styles.progressBarFill,
                styles.progressKalori,
                { width: `${kaloriPercent}%` },
              ]}
            />
          </View>
          <View style={styles.subInfoRow}>
            <Text style={styles.subInfoText}>
              Terpakai: {formatKalori(totalKalori)} kkal
            </Text>
            <Text
              style={[
                styles.subInfoText,
                sisaKalori < 0 ? styles.textWarning : styles.textSuccess,
              ]}
            >
              Sisa: {formatKalori(sisaKalori)} kkal
            </Text>
          </View>
        </View>

        <View style={styles.cardDivider} />

        {/* Protein */}
        <View style={styles.nutrientSection}>
          <View style={styles.nutrientHeader}>
            <Text style={styles.nutrientName}>Protein</Text>
            <Text style={styles.nutrientValues}>
              {formatProtein(totalProtein)} / {formatProtein(targets.targetProtein)} g
            </Text>
          </View>
          <View style={styles.progressBarBackground}>
            <View
              style={[
                styles.progressBarFill,
                styles.progressProtein,
                { width: `${proteinPercent}%` },
              ]}
            />
          </View>
          <View style={styles.subInfoRow}>
            <Text style={styles.subInfoText}>
              Terpakai: {formatProtein(totalProtein)} g
            </Text>
            <Text
              style={[
                styles.subInfoText,
                sisaProtein < 0 ? styles.textWarning : styles.textSuccess,
              ]}
            >
              Sisa: {formatProtein(sisaProtein)} g
            </Text>
          </View>
        </View>
      </View>

      {/* Daftar Makanan Hari Ini */}
      <View style={styles.card}>
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.cardTitle}>Makanan Dicatat Hari Ini</Text>
          <Pressable
            style={styles.addMiniButton}
            onPress={() => router.push('/(tabs)/catat')}
          >
            <Text style={styles.addMiniButtonText}>+ Tambah</Text>
          </Pressable>
        </View>

        {logs.length === 0 ? (
          <View style={styles.emptyLogContainer}>
            <Text style={styles.emptyLogText}>Belum ada makanan hari ini</Text>
          </View>
        ) : (
          <View style={styles.logList}>
            {logs.map((item) => (
              <View key={item.id} style={styles.logItem}>
                <View style={styles.logInfo}>
                  <Text style={styles.logName}>{item.nama}</Text>
                  <Text style={styles.logDetails}>
                    {item.gram} g • {formatKalori(item.kalori)} kkal • Protein{' '}
                    {formatProtein(item.protein)} g
                  </Text>
                </View>
                <Pressable
                  style={styles.deleteButton}
                  onPress={() => handleDeleteLog(item.id)}
                >
                  <Text style={styles.deleteButtonText}>Hapus</Text>
                </Pressable>
              </View>
            ))}
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 36,
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8FAFC',
    padding: 20,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 15,
    color: '#64748B',
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0F172A',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 20,
  },
  primaryButton: {
    backgroundColor: '#2563EB',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  dateHeader: {
    marginBottom: 16,
  },
  dateLabel: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '500',
  },
  dateValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#0F172A',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  addMiniButton: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  addMiniButtonText: {
    color: '#2563EB',
    fontSize: 12,
    fontWeight: '700',
  },
  nutrientSection: {
    marginTop: 12,
  },
  nutrientHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  nutrientName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#334155',
  },
  nutrientValues: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0F172A',
  },
  progressBarBackground: {
    height: 12,
    backgroundColor: '#E2E8F0',
    borderRadius: 6,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 6,
  },
  progressKalori: {
    backgroundColor: '#2563EB',
  },
  progressProtein: {
    backgroundColor: '#10B981',
  },
  subInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 6,
  },
  subInfoText: {
    fontSize: 13,
    color: '#64748B',
  },
  textSuccess: {
    color: '#059669',
    fontWeight: '600',
  },
  textWarning: {
    color: '#DC2626',
    fontWeight: '600',
  },
  cardDivider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 14,
  },
  emptyLogContainer: {
    paddingVertical: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyLogText: {
    fontSize: 14,
    color: '#94A3B8',
  },
  logList: {
    gap: 10,
  },
  logItem: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  logInfo: {
    flex: 1,
    paddingRight: 10,
  },
  logName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#0F172A',
    marginBottom: 2,
  },
  logDetails: {
    fontSize: 12,
    color: '#64748B',
  },
  deleteButton: {
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  deleteButtonText: {
    color: '#DC2626',
    fontSize: 12,
    fontWeight: '600',
  },
});
