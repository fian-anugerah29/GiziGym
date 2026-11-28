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

function escapeLikePattern(value: string): string {
  return value.replace(/[\\%_]/g, '\\$&');
}

/**
 * Mencari makanan berdasarkan nama dengan dukungan beberapa kata (case-insensitive).
 * Jika query kosong, menampilkan seluruh daftar makanan.
 * Langkah 1: memuat semua kata (urutan bebas).
 * Langkah 2 (jika langkah 1 kosong & >= 2 kata): memuat salah satu kata, diurutkan dari kecocokan terbanyak lalu nama (maks 50).
 */
export async function searchFoods(db: SQLiteDatabase, query: string): Promise<Food[]> {
  const normalized = query.toLowerCase().trim();
  const words = Array.from(new Set(normalized.split(/\s+/).filter(Boolean)));

  if (words.length === 0) {
    return await db.getAllAsync<Food>(
      'SELECT id, nama, kalori_100g, protein_100g FROM foods ORDER BY nama ASC'
    );
  }

  const patterns = words.map((word) => `%${escapeLikePattern(word)}%`);

  // Langkah 1: makanan yang namanya memuat SEMUA kata
  const allWordsWhere = words
    .map(() => "LOWER(nama) LIKE ? ESCAPE '\\'")
    .join(' AND ');
  const exactResults = await db.getAllAsync<Food>(
    `SELECT id, nama, kalori_100g, protein_100g FROM foods WHERE ${allWordsWhere} ORDER BY nama ASC`,
    patterns
  );

  if (exactResults.length > 0 || words.length < 2) {
    return exactResults;
  }

  // Langkah 2: memuat SALAH SATU kata, diurutkan berdasarkan jumlah kata yang cocok lalu nama
  const matchCountExpr = words
    .map(() => "(CASE WHEN LOWER(nama) LIKE ? ESCAPE '\\' THEN 1 ELSE 0 END)")
    .join(' + ');

  return await db.getAllAsync<Food>(
    `SELECT id, nama, kalori_100g, protein_100g
     FROM (
       SELECT id, nama, kalori_100g, protein_100g, (${matchCountExpr}) AS match_count
       FROM foods
     )
     WHERE match_count > 0
     ORDER BY match_count DESC, nama ASC
     LIMIT 50`,
    patterns
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
