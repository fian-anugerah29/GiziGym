import { type SQLiteDatabase } from 'expo-sqlite';
import { Food, FoodLogItem, Profile } from '../types';

/**
 * Mengambil data profil pengguna (selalu id = 1).
 */
export async function getProfile(db: SQLiteDatabase): Promise<Profile | null> {
  const row = await db.getFirstAsync<Profile>(
    'SELECT id, jenis_kelamin, usia, berat, tinggi, aktivitas, tujuan FROM profile WHERE id = 1'
  );
  return row ?? null;
}

/**
 * Menyimpan data profil dengan INSERT OR REPLACE (selalu id = 1).
 */
export async function saveProfile(
  db: SQLiteDatabase,
  profile: Omit<Profile, 'id'>
): Promise<void> {
  await db.runAsync(
    `INSERT OR REPLACE INTO profile (id, jenis_kelamin, usia, berat, tinggi, aktivitas, tujuan)
     VALUES (1, ?, ?, ?, ?, ?, ?)`,
    [
      profile.jenis_kelamin,
      profile.usia,
      profile.berat,
      profile.tinggi,
      profile.aktivitas,
      profile.tujuan,
    ]
  );
}

/**
 * Mencari makanan berdasarkan nama (LIKE %kata%, case-insensitive).
 * Jika query kosong, menampilkan seluruh daftar makanan.
 */
export async function searchFoods(db: SQLiteDatabase, query: string): Promise<Food[]> {
  const trimmed = query.trim();
  if (!trimmed) {
    return await db.getAllAsync<Food>(
      'SELECT id, nama, kalori_100g, protein_100g FROM foods ORDER BY nama ASC'
    );
  }
  return await db.getAllAsync<Food>(
    'SELECT id, nama, kalori_100g, protein_100g FROM foods WHERE LOWER(nama) LIKE LOWER(?) ORDER BY nama ASC',
    [`%${trimmed}%`]
  );
}

/**
 * Mengambil satu makanan berdasarkan ID.
 */
export async function getFoodById(db: SQLiteDatabase, id: number): Promise<Food | null> {
  const row = await db.getFirstAsync<Food>(
    'SELECT id, nama, kalori_100g, protein_100g FROM foods WHERE id = ?',
    [id]
  );
  return row ?? null;
}

/**
 * Mengambil daftar catatan makanan pada tanggal tertentu, di-join dengan tabel foods.
 */
export async function getFoodLogsByDate(
  db: SQLiteDatabase,
  tanggal: string
): Promise<FoodLogItem[]> {
  return await db.getAllAsync<FoodLogItem>(
    `SELECT fl.id, fl.tanggal, fl.food_id, fl.gram, fl.kalori, fl.protein, f.nama
     FROM food_logs fl
     JOIN foods f ON fl.food_id = f.id
     WHERE fl.tanggal = ?
     ORDER BY fl.id DESC`,
    [tanggal]
  );
}

/**
 * Menambahkan catatan makanan baru.
 * kalori dan protein disimpan hasil hitung saat dicatat = nilai_100g * gram / 100.
 */
export async function insertFoodLog(
  db: SQLiteDatabase,
  log: {
    tanggal: string;
    food_id: number;
    gram: number;
    kalori: number;
    protein: number;
  }
): Promise<void> {
  await db.runAsync(
    `INSERT INTO food_logs (tanggal, food_id, gram, kalori, protein)
     VALUES (?, ?, ?, ?, ?)`,
    [log.tanggal, log.food_id, log.gram, log.kalori, log.protein]
  );
}

/**
 * Menghapus catatan makanan berdasarkan ID.
 */
export async function deleteFoodLog(db: SQLiteDatabase, id: number): Promise<void> {
  await db.runAsync('DELETE FROM food_logs WHERE id = ?', [id]);
}
