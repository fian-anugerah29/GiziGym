export type JenisKelamin = 'pria' | 'wanita';
export type TingkatAktivitas = 'ringan' | 'sedang' | 'berat';
export type Tujuan = 'cutting' | 'bulking';

export interface Profile {
  id: number;
  jenis_kelamin: JenisKelamin;
  usia: number;
  berat: number;
  tinggi: number;
  aktivitas: TingkatAktivitas;
  tujuan: Tujuan;
}

export interface Food {
  id: number;
  nama: string;
  kalori_100g: number;
  protein_100g: number;
}

export interface FoodLog {
  id: number;
  tanggal: string;
  food_id: number;
  gram: number;
  kalori: number;
  protein: number;
}

export interface FoodLogItem extends FoodLog {
  nama: string;
}

export interface NutritionTargets {
  bmr: number;
  tdee: number;
  targetKalori: number;
  targetProtein: number;
}
