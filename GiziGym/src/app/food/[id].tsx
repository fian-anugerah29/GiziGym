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
import { getFoodById, insertFoodLog } from '../../db/queries';
import { getLocalDateString } from '../../lib/date';
import {
  calculatePortionNutrition,
  formatKalori,
  formatProtein,
  parseNumberInput,
} from '../../lib/nutrition';
import { Food } from '../../types';

const QUICK_PORTIONS = [50, 100, 150, 200];

export default function FoodDetailScreen() {
  const db = useSQLiteContext();
  const { id } = useLocalSearchParams<{ id: string }>();
  const foodId = Number(id);

  const [food, setFood] = useState<Food | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [gramText, setGramText] = useState('100');
  const [errorText, setErrorText] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    async function loadFood() {
      if (isNaN(foodId)) {
        setLoading(false);
        return;
      }
      try {
        const item = await getFoodById(db, foodId);
        if (isMounted) {
          setFood(item);
        }
      } catch (e) {
        console.error('Gagal memuat makanan:', e);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    loadFood();
    return () => {
      isMounted = false;
    };
  }, [db, foodId]);

  const gramNum = parseNumberInput(gramText);
  const isValidGram = !isNaN(gramNum) && gramNum > 0;

  const portionNutrition = food && isValidGram
    ? calculatePortionNutrition(food.kalori_100g, food.protein_100g, gramNum)
    : { kalori: 0, protein: 0 };

  const handleSelectQuickPortion = (portion: number) => {
    setGramText(portion.toString());
    setErrorText(null);
  };

  const handleAddFood = async () => {
    if (!isValidGram) {
      setErrorText('Gram harus lebih dari 0');
      return;
    }
    if (!food) return;

    setErrorText(null);
    setSaving(true);
    try {
      const today = getLocalDateString();
      await insertFoodLog(db, {
        tanggal: today,
        food_id: food.id,
        gram: gramNum,
        kalori: portionNutrition.kalori,
        protein: portionNutrition.protein,
      });

      router.replace('/beranda');
    } catch (e) {
      console.error('Gagal menyimpan catatan makanan:', e);
      setErrorText('Gagal menyimpan catatan makanan');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#2563EB" />
        <Text style={styles.loadingText}>Memuat detail makanan...</Text>
      </View>
    );
  }

  if (!food) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.notFoundText}>Makanan tidak ditemukan</Text>
        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>Kembali</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      keyboardShouldPersistTaps="handled"
    >
      {/* Kartu Informasi Makanan */}
      <View style={styles.card}>
        <Text style={styles.foodTitle}>{food.nama}</Text>
        <Text style={styles.foodSubtitle}>Nilai Gizi Dasar (per 100 gram)</Text>

        <View style={styles.baseNutrientRow}>
          <View style={styles.baseNutrientBox}>
            <Text style={styles.baseNutrientLabel}>Kalori / 100g</Text>
            <Text style={styles.baseNutrientValue}>
              {formatKalori(food.kalori_100g)} kkal
            </Text>
          </View>
          <View style={styles.baseNutrientBox}>
            <Text style={styles.baseNutrientLabel}>Protein / 100g</Text>
            <Text style={styles.baseNutrientValue}>
              {formatProtein(food.protein_100g)} g
            </Text>
          </View>
        </View>
      </View>

      {/* Pilihan Porsi & Input Gram */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Tentukan Porsi</Text>

        <Text style={styles.inputLabel}>Berat Porsi (gram)</Text>
        <TextInput
          style={[styles.input, errorText ? styles.inputError : null]}
          keyboardType="numeric"
          value={gramText}
          onChangeText={(text) => {
            setGramText(text);
            if (errorText) setErrorText(null);
          }}
          placeholder="Masukkan gram (contoh: 150)"
          placeholderTextColor="#94A3B8"
        />
        {errorText && <Text style={styles.errorText}>{errorText}</Text>}

        {/* Tombol Cepat Porsi 50/100/150/200 */}
        <Text style={styles.quickLabel}>Pilih Cepat:</Text>
        <View style={styles.quickRow}>
          {QUICK_PORTIONS.map((portion) => {
            const isSelected = gramText === portion.toString();
            return (
              <Pressable
                key={portion}
                style={[
                  styles.quickButton,
                  isSelected && styles.quickButtonActive,
                ]}
                onPress={() => handleSelectQuickPortion(portion)}
              >
                <Text
                  style={[
                    styles.quickButtonText,
                    isSelected && styles.quickButtonTextActive,
                  ]}
                >
                  {portion} g
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      {/* Pratinjau Nutrisi Berdasarkan Porsi */}
      <View style={[styles.card, styles.previewCard]}>
        <Text style={styles.previewTitle}>Pratinjau Gizi untuk {isValidGram ? gramNum : 0} gram</Text>
        <View style={styles.previewRow}>
          <View style={[styles.previewBox, styles.previewBoxKalori]}>
            <Text style={styles.previewBoxLabel}>Kalori</Text>
            <Text style={styles.previewBoxValue}>
              {formatKalori(portionNutrition.kalori)} kkal
            </Text>
          </View>
          <View style={[styles.previewBox, styles.previewBoxProtein]}>
            <Text style={styles.previewBoxLabel}>Protein</Text>
            <Text style={styles.previewBoxValue}>
              {formatProtein(portionNutrition.protein)} g
            </Text>
          </View>
        </View>
      </View>

      {/* Tombol Tambah */}
      <Pressable
        style={[styles.primaryButton, saving && styles.primaryButtonDisabled]}
        onPress={handleAddFood}
        disabled={saving}
      >
        {saving ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : (
          <Text style={styles.primaryButtonText}>Tambah ke Catatan Hari Ini</Text>
        )}
      </Pressable>
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
  notFoundText: {
    fontSize: 16,
    color: '#64748B',
    marginBottom: 16,
  },
  backButton: {
    backgroundColor: '#2563EB',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 10,
  },
  backButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  foodTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#0F172A',
    marginBottom: 4,
  },
  foodSubtitle: {
    fontSize: 13,
    color: '#64748B',
    marginBottom: 14,
  },
  baseNutrientRow: {
    flexDirection: 'row',
    gap: 12,
  },
  baseNutrientBox: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  baseNutrientLabel: {
    fontSize: 12,
    color: '#64748B',
    marginBottom: 4,
  },
  baseNutrientValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 12,
  },
  inputLabel: {
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
    fontSize: 16,
    color: '#0F172A',
  },
  inputError: {
    borderColor: '#EF4444',
    backgroundColor: '#FEF2F2',
  },
  errorText: {
    color: '#EF4444',
    fontSize: 12,
    marginTop: 6,
  },
  quickLabel: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 14,
    marginBottom: 8,
  },
  quickRow: {
    flexDirection: 'row',
    gap: 8,
  },
  quickButton: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickButtonActive: {
    backgroundColor: '#EFF6FF',
    borderColor: '#2563EB',
  },
  quickButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#475569',
  },
  quickButtonTextActive: {
    color: '#2563EB',
    fontWeight: '700',
  },
  previewCard: {
    backgroundColor: '#F8FAFC',
    borderColor: '#CBD5E1',
  },
  previewTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 12,
  },
  previewRow: {
    flexDirection: 'row',
    gap: 12,
  },
  previewBox: {
    flex: 1,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
  },
  previewBoxKalori: {
    backgroundColor: '#EFF6FF',
    borderColor: '#BFDBFE',
  },
  previewBoxProtein: {
    backgroundColor: '#F0FDF4',
    borderColor: '#BBF7D0',
  },
  previewBoxLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
    marginBottom: 4,
  },
  previewBoxValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0F172A',
  },
  primaryButton: {
    backgroundColor: '#2563EB',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  primaryButtonDisabled: {
    opacity: 0.6,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});
