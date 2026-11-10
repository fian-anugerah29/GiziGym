import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { getProfile, saveProfile } from '../db/queries';
import {
  parseNumberInput,
  validateProfile,
  ValidationErrors,
} from '../lib/nutrition';
import { JenisKelamin, TingkatAktivitas, Tujuan } from '../types';

export default function OnboardingScreen() {
  const db = useSQLiteContext();
  const params = useLocalSearchParams<{ mode?: string }>();
  const isEditMode = params.mode === 'edit';

  const [loadingInitial, setLoadingInitial] = useState(isEditMode);
  const [saving, setSaving] = useState(false);

  // Form states
  const [usiaText, setUsiaText] = useState('');
  const [beratText, setBeratText] = useState('');
  const [tinggiText, setTinggiText] = useState('');
  const [jenisKelamin, setJenisKelamin] = useState<JenisKelamin>('pria');
  const [aktivitas, setAktivitas] = useState<TingkatAktivitas>('sedang');
  const [tujuan, setTujuan] = useState<Tujuan>('bulking');

  const [errors, setErrors] = useState<ValidationErrors>({});

  useEffect(() => {
    if (isEditMode) {
      let isMounted = true;
      async function loadExistingProfile() {
        try {
          const profile = await getProfile(db);
          if (profile && isMounted) {
            setUsiaText(profile.usia.toString());
            setBeratText(profile.berat.toString());
            setTinggiText(profile.tinggi.toString());
            setJenisKelamin(profile.jenis_kelamin);
            setAktivitas(profile.aktivitas);
            setTujuan(profile.tujuan);
          }
        } catch (e) {
          console.error('Gagal memuat profil untuk diedit:', e);
        } finally {
          if (isMounted) {
            setLoadingInitial(false);
          }
        }
      }
      loadExistingProfile();
      return () => {
        isMounted = false;
      };
    }
  }, [db, isEditMode]);

  const handleSubmit = async () => {
    const usiaNum = parseNumberInput(usiaText);
    const beratNum = parseNumberInput(beratText);
    const tinggiNum = parseNumberInput(tinggiText);

    const validation = validateProfile(usiaNum, beratNum, tinggiNum);
    if (!validation.isValid) {
      setErrors(validation.errors);
      return;
    }

    setErrors({});
    setSaving(true);
    try {
      await saveProfile(db, {
        jenis_kelamin: jenisKelamin,
        usia: Math.round(usiaNum),
        berat: beratNum,
        tinggi: tinggiNum,
        aktivitas,
        tujuan,
      });

      router.replace('/beranda');
    } catch (e) {
      console.error('Gagal menyimpan profil:', e);
    } finally {
      setSaving(false);
    }
  };

  if (loadingInitial) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#2563EB" />
        <Text style={styles.loadingText}>Memuat data...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.header}>
        <Text style={styles.title}>
          {isEditMode ? 'Ubah Data Diri' : 'Selamat Datang di GiziGym'}
        </Text>
        <Text style={styles.subtitle}>
          {isEditMode
            ? 'Perbarui data diri Anda untuk menyesuaikan target kalori dan protein.'
            : 'Hitung target kalori dan protein harian sesuai tujuan gym Anda.'}
        </Text>
      </View>

      <View style={styles.formSection}>
        {/* Usia */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Usia (tahun)</Text>
          <TextInput
            style={[styles.input, errors.usia ? styles.inputError : null]}
            keyboardType="numeric"
            placeholder="Contoh: 20 (17 - 70 tahun)"
            placeholderTextColor="#94A3B8"
            value={usiaText}
            onChangeText={(text) => {
              setUsiaText(text);
              if (errors.usia) setErrors((prev) => ({ ...prev, usia: undefined }));
            }}
          />
          {errors.usia && <Text style={styles.errorText}>{errors.usia}</Text>}
        </View>

        {/* Berat */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Berat Badan (kg)</Text>
          <TextInput
            style={[styles.input, errors.berat ? styles.inputError : null]}
            keyboardType="numeric"
            placeholder="Contoh: 58 (30 - 300 kg)"
            placeholderTextColor="#94A3B8"
            value={beratText}
            onChangeText={(text) => {
              setBeratText(text);
              if (errors.berat) setErrors((prev) => ({ ...prev, berat: undefined }));
            }}
          />
          {errors.berat && <Text style={styles.errorText}>{errors.berat}</Text>}
        </View>

        {/* Tinggi */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Tinggi Badan (cm)</Text>
          <TextInput
            style={[styles.input, errors.tinggi ? styles.inputError : null]}
            keyboardType="numeric"
            placeholder="Contoh: 170 (100 - 250 cm)"
            placeholderTextColor="#94A3B8"
            value={tinggiText}
            onChangeText={(text) => {
              setTinggiText(text);
              if (errors.tinggi) setErrors((prev) => ({ ...prev, tinggi: undefined }));
            }}
          />
          {errors.tinggi && <Text style={styles.errorText}>{errors.tinggi}</Text>}
        </View>

        {/* Jenis Kelamin */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Jenis Kelamin</Text>
          <View style={styles.row}>
            <Pressable
              style={[
                styles.optionButton,
                jenisKelamin === 'pria' && styles.optionButtonActive,
              ]}
              onPress={() => setJenisKelamin('pria')}
            >
              <Text
                style={[
                  styles.optionButtonText,
                  jenisKelamin === 'pria' && styles.optionButtonTextActive,
                ]}
              >
                Pria
              </Text>
            </Pressable>
            <Pressable
              style={[
                styles.optionButton,
                jenisKelamin === 'wanita' && styles.optionButtonActive,
              ]}
              onPress={() => setJenisKelamin('wanita')}
            >
              <Text
                style={[
                  styles.optionButtonText,
                  jenisKelamin === 'wanita' && styles.optionButtonTextActive,
                ]}
              >
                Wanita
              </Text>
            </Pressable>
          </View>
        </View>

        {/* Tingkat Aktivitas */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Tingkat Aktivitas</Text>
          <View style={styles.column}>
            <Pressable
              style={[
                styles.optionButton,
                styles.optionButtonFull,
                aktivitas === 'ringan' && styles.optionButtonActive,
              ]}
              onPress={() => setAktivitas('ringan')}
            >
              <Text
                style={[
                  styles.optionButtonText,
                  aktivitas === 'ringan' && styles.optionButtonTextActive,
                ]}
              >
                Ringan (sedikit / jarang olahraga)
              </Text>
            </Pressable>

            <Pressable
              style={[
                styles.optionButton,
                styles.optionButtonFull,
                aktivitas === 'sedang' && styles.optionButtonActive,
              ]}
              onPress={() => setAktivitas('sedang')}
            >
              <Text
                style={[
                  styles.optionButtonText,
                  aktivitas === 'sedang' && styles.optionButtonTextActive,
                ]}
              >
                Sedang (olahraga 3-5 hari/minggu)
              </Text>
            </Pressable>

            <Pressable
              style={[
                styles.optionButton,
                styles.optionButtonFull,
                aktivitas === 'berat' && styles.optionButtonActive,
              ]}
              onPress={() => setAktivitas('berat')}
            >
              <Text
                style={[
                  styles.optionButtonText,
                  aktivitas === 'berat' && styles.optionButtonTextActive,
                ]}
              >
                Berat (olahraga 6-7 hari/minggu)
              </Text>
            </Pressable>
          </View>
        </View>

        {/* Tujuan */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Tujuan</Text>
          <View style={styles.row}>
            <Pressable
              style={[
                styles.optionButton,
                tujuan === 'cutting' && styles.optionButtonActive,
              ]}
              onPress={() => setTujuan('cutting')}
            >
              <Text
                style={[
                  styles.optionButtonText,
                  tujuan === 'cutting' && styles.optionButtonTextActive,
                ]}
              >
                Cutting (Turun Lemak)
              </Text>
            </Pressable>
            <Pressable
              style={[
                styles.optionButton,
                tujuan === 'bulking' && styles.optionButtonActive,
              ]}
              onPress={() => setTujuan('bulking')}
            >
              <Text
                style={[
                  styles.optionButtonText,
                  tujuan === 'bulking' && styles.optionButtonTextActive,
                ]}
              >
                Bulking (Naik Otot)
              </Text>
            </Pressable>
          </View>
        </View>

        {/* Tombol Simpan */}
        <Pressable
          style={[styles.primaryButton, saving && styles.primaryButtonDisabled]}
          onPress={handleSubmit}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.primaryButtonText}>Hitung Target</Text>
          )}
        </Pressable>

        {isEditMode && (
          <Pressable
            style={styles.cancelButton}
            onPress={() => router.back()}
            disabled={saving}
          >
            <Text style={styles.cancelButtonText}>Batal</Text>
          </Pressable>
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
    padding: 20,
    paddingBottom: 40,
  },
  centerContainer: {
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
  header: {
    marginTop: 20,
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#0F172A',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#64748B',
    lineHeight: 20,
  },
  formSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  inputGroup: {
    marginBottom: 18,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#334155',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: '#0F172A',
  },
  inputError: {
    borderColor: '#EF4444',
    backgroundColor: '#FEF2F2',
  },
  errorText: {
    color: '#EF4444',
    fontSize: 12,
    marginTop: 4,
  },
  row: {
    flexDirection: 'row',
    gap: 10,
  },
  column: {
    gap: 8,
  },
  optionButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionButtonFull: {
    flex: 0,
    width: '100%',
    alignItems: 'flex-start',
  },
  optionButtonActive: {
    backgroundColor: '#EFF6FF',
    borderColor: '#2563EB',
  },
  optionButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#475569',
  },
  optionButtonTextActive: {
    color: '#2563EB',
    fontWeight: '700',
  },
  primaryButton: {
    backgroundColor: '#2563EB',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
  },
  primaryButtonDisabled: {
    opacity: 0.6,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  cancelButton: {
    marginTop: 12,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButtonText: {
    color: '#64748B',
    fontSize: 15,
    fontWeight: '600',
  },
});
