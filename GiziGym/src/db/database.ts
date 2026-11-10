import { type SQLiteDatabase } from 'expo-sqlite';
import { FOODS_SEED } from '../data/foods-seed';

export const DATABASE_NAME = 'gizigym.db';

export async function migrateDbIfNeeded(db: SQLiteDatabase): Promise<void> {
  const result = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version');
  let currentDbVersion = result?.user_version ?? 0;

  if (currentDbVersion < 1) {
    await db.execAsync(`
      PRAGMA journal_mode = WAL;

      CREATE TABLE IF NOT EXISTS profile (
        id INTEGER PRIMARY KEY,
        jenis_kelamin TEXT NOT NULL,
        usia INTEGER NOT NULL,
        berat REAL NOT NULL,
        tinggi REAL NOT NULL,
        aktivitas TEXT NOT NULL,
        tujuan TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS foods (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nama TEXT NOT NULL,
        kalori_100g REAL NOT NULL,
        protein_100g REAL NOT NULL
      );

      CREATE TABLE IF NOT EXISTS food_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        tanggal TEXT NOT NULL,
        food_id INTEGER NOT NULL,
        gram REAL NOT NULL,
        kalori REAL NOT NULL,
        protein REAL NOT NULL,
        FOREIGN KEY (food_id) REFERENCES foods (id)
      );

      CREATE INDEX IF NOT EXISTS idx_food_logs_tanggal ON food_logs(tanggal);
      CREATE INDEX IF NOT EXISTS idx_foods_nama ON foods(nama);
    `);

    // Isi tabel foods dari FOODS_SEED jika tabel masih kosong
    const countResult = await db.getFirstAsync<{ count: number }>(
      'SELECT COUNT(*) as count FROM foods'
    );
    if (!countResult || countResult.count === 0) {
      for (const item of FOODS_SEED) {
        await db.runAsync(
          'INSERT INTO foods (nama, kalori_100g, protein_100g) VALUES (?, ?, ?)',
          [item.nama, item.kalori_100g, item.protein_100g]
        );
      }
    }

    await db.execAsync('PRAGMA user_version = 1');
  }
}
