import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { searchFoods } from '../../db/queries';
import { formatKalori, formatProtein } from '../../lib/nutrition';
import { Food } from '../../types';

export default function CatatScreen() {
  const db = useSQLiteContext();
  const [searchQuery, setSearchQuery] = useState('');
  const [foods, setFoods] = useState<Food[]>([]);
  const [loading, setLoading] = useState(false);

  const performSearch = useCallback(
    async (query: string) => {
      setLoading(true);
      try {
        const results = await searchFoods(db, query);
        setFoods(results);
      } catch (e) {
        console.error('Gagal mencari makanan:', e);
      } finally {
        setLoading(false);
      }
    },
    [db]
  );

  // Muat ulang saat layar tampil
  useFocusEffect(
    useCallback(() => {
      performSearch(searchQuery);
    }, [performSearch, searchQuery])
  );

  const handleQueryChange = (text: string) => {
    setSearchQuery(text);
    performSearch(text);
  };

  const handleSelectFood = (food: Food) => {
    router.push({
      pathname: '/food/[id]',
      params: { id: food.id },
    });
  };

  return (
    <View style={styles.container}>
      {/* Kolom Pencarian */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Cari makanan... (contoh: nasi)"
          placeholderTextColor="#94A3B8"
          value={searchQuery}
          onChangeText={handleQueryChange}
          autoCapitalize="none"
          autoCorrect={false}
          clearButtonMode="while-editing"
        />
      </View>

      {/* Konten Daftar */}
      {loading && foods.length === 0 ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#2563EB" />
        </View>
      ) : foods.length === 0 ? (
        <View style={styles.centerContainer}>
          <Text style={styles.emptyText}>Makanan tidak ditemukan</Text>
        </View>
      ) : (
        <FlatList
          data={foods}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.listContent}
          keyboardShouldPersistTaps="handled"
          renderItem={({ item }) => (
            <Pressable
              style={({ pressed }) => [
                styles.foodItem,
                pressed && styles.foodItemPressed,
              ]}
              onPress={() => handleSelectFood(item)}
            >
              <View style={styles.foodInfo}>
                <Text style={styles.foodName}>{item.nama}</Text>
                <Text style={styles.foodNutrients}>
                  {formatKalori(item.kalori_100g)} kkal • Protein{' '}
                  {formatProtein(item.protein_100g)} g / 100g
                </Text>
              </View>
              <View style={styles.selectBadge}>
                <Text style={styles.selectBadgeText}>Pilih</Text>
              </View>
            </Pressable>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  searchContainer: {
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  searchInput: {
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
    color: '#0F172A',
  },
  listContent: {
    padding: 16,
    gap: 10,
  },
  foodItem: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  foodItemPressed: {
    backgroundColor: '#F1F5F9',
  },
  foodInfo: {
    flex: 1,
    paddingRight: 12,
  },
  foodName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 4,
  },
  foodNutrients: {
    fontSize: 13,
    color: '#64748B',
  },
  selectBadge: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  selectBadgeText: {
    color: '#2563EB',
    fontSize: 13,
    fontWeight: '600',
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  emptyText: {
    fontSize: 15,
    color: '#64748B',
    textAlign: 'center',
  },
});
