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
import { getProfile } from '../../db/queries';
import {
  calculateNutrition,
  formatKalori,
  formatProtein,
} from '../../lib/nutrition';
import { NutritionTargets, Profile } from '../../types';

export default function ProfilScreen() {
  const db = useSQLiteContext();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [targets, setTargets] = useState<NutritionTargets | null>(null);

  useFocusEffect(
    useCallback(() => {
      let isMounted = true;
      async function loadData() {
        setLoading(true);
        try {
          const currentProfile = await getProfile(db);
          if (isMounted) {
            setProfile(currentProfile);
            if (currentProfile) {
              const nutrition = calculateNutrition(currentProfile);
              setTargets(nutrition);
            } else {
              setTargets(null);
            }
          }
        } catch (e) {
          console.error('Gagal memuat profil:', e);
        } finally {
          if (isMounted) {
            setLoading(false);
          }
        }
      }

      loadData();

      return () => {
        isMounted = false;
      };
    }, [db])
  );

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#2563EB" />
        <Text style={styles.loadingText}>Memuat profil...</Text>
      </View>
    );
  }

  if (!profile || !targets) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.emptyTitle}>Profil Belum Diisi</Text>
        <Text style={styles.emptySubtitle}>
          Silakan isi data diri Anda terlebih dahulu untuk menghitung target gizi.
        </Text>
        <Pressable
          style={styles.primaryButton}
          onPress={() => router.push('/onboarding')}
        >
          <Text style={styles.primaryButtonText}>Isi Data Diri</Text>
        </Pressable>
      </View>
    );
  }

  const labelAktivitas = {
    ringan: 'Ringan (Jarang olahraga)',
    sedang: 'Sedang (3-5 hari/minggu)',
    berat: 'Berat (6-7 hari/minggu)',
  }[profile.aktivitas];

  const labelTujuan = {
    cutting: 'Cutting (Turun Lemak)',
    bulking: 'Bulking (Naik Otot)',
  }[profile.tujuan];

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
    >
      {/* Target Nutrisi Harian */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Target Harian</Text>
        <View style={styles.targetRow}>
          <View style={[styles.targetBox, styles.targetBoxKalori]}>
            <Text style={styles.targetLabel}>Target Kalori</Text>
            <Text style={styles.targetValue}>
              {formatKalori(targets.targetKalori)}{' '}
              <Text style={styles.unitText}>kkal</Text>
            </Text>
          </View>
          <View style={[styles.targetBox, styles.targetBoxProtein]}>
            <Text style={styles.targetLabel}>Target Protein</Text>
            <Text style={styles.targetValue}>
              {formatProtein(targets.targetProtein)}{' '}
              <Text style={styles.unitText}>g</Text>
            </Text>
          </View>
        </View>

        <View style={styles.detailStats}>
          <View style={styles.detailStatItem}>
            <Text style={styles.detailStatLabel}>BMR (Metabolisme Dasar)</Text>
            <Text style={styles.detailStatValue}>
              {formatKalori(targets.bmr)} kkal
            </Text>
          </View>
          <View style={styles.detailStatItem}>
            <Text style={styles.detailStatLabel}>TDEE (Total Energi Harian)</Text>
            <Text style={styles.detailStatValue}>
              {formatKalori(targets.tdee)} kkal
            </Text>
          </View>
        </View>
      </View>

      {/* Data Diri */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Data Diri Pengguna</Text>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Jenis Kelamin</Text>
          <Text style={styles.infoValue}>
            {profile.jenis_kelamin === 'pria' ? 'Pria' : 'Wanita'}
          </Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Usia</Text>
          <Text style={styles.infoValue}>{profile.usia} tahun</Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Berat Badan</Text>
          <Text style={styles.infoValue}>{profile.berat} kg</Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Tinggi Badan</Text>
          <Text style={styles.infoValue}>{profile.tinggi} cm</Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Aktivitas</Text>
          <Text style={styles.infoValue}>{labelAktivitas}</Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Tujuan</Text>
          <Text style={styles.infoValue}>{labelTujuan}</Text>
        </View>
      </View>

      {/* Tombol Ubah Data */}
      <Pressable
        style={styles.primaryButton}
        onPress={() => router.push('/onboarding?mode=edit')}
      >
        <Text style={styles.primaryButtonText}>Ubah Data</Text>
      </Pressable>

      {/* Disclaimer */}
      <View style={styles.disclaimerBox}>
        <Text style={styles.disclaimerText}>
          Perkiraan, bukan pengganti ahli gizi.
        </Text>
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
    paddingBottom: 32,
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
    marginBottom: 14,
  },
  targetRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 14,
  },
  targetBox: {
    flex: 1,
    borderRadius: 12,
    padding: 14,
  },
  targetBoxKalori: {
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  targetBoxProtein: {
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  targetLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
    marginBottom: 4,
  },
  targetValue: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#0F172A',
  },
  unitText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748B',
  },
  detailStats: {
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    padding: 12,
    gap: 8,
  },
  detailStatItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  detailStatLabel: {
    fontSize: 13,
    color: '#64748B',
  },
  detailStatValue: {
    fontSize: 13,
    fontWeight: '600',
    color: '#334155',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
  },
  infoLabel: {
    fontSize: 14,
    color: '#64748B',
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0F172A',
  },
  divider: {
    height: 1,
    backgroundColor: '#F1F5F9',
  },
  primaryButton: {
    backgroundColor: '#2563EB',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
    marginBottom: 16,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  disclaimerBox: {
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  disclaimerText: {
    fontSize: 12,
    color: '#94A3B8',
    fontStyle: 'italic',
    textAlign: 'center',
  },
});
