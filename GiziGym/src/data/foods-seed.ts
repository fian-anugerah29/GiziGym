/**
 * CONTOH. Lengkapi sampai 50-100 makanan dari TKPI 2020 (Kemenkes) dan verifikasi tiap angka. Jangan mengarang nilai gizi.
 */

export interface FoodSeedItem {
  nama: string;
  kalori_100g: number;
  protein_100g: number;
}

export const FOODS_SEED: FoodSeedItem[] = [
  { nama: 'Nasi', kalori_100g: 180, protein_100g: 3.0 },
  { nama: 'Nasi tim', kalori_100g: 120, protein_100g: 2.4 },
  { nama: 'Nasi beras merah', kalori_100g: 149, protein_100g: 2.8 },
  { nama: 'Ketupat ketan', kalori_100g: 212, protein_100g: 4.0 },
  { nama: 'Mi basah', kalori_100g: 88, protein_100g: 0.6 },
  { nama: 'Roti putih', kalori_100g: 248, protein_100g: 8.0 },
];
