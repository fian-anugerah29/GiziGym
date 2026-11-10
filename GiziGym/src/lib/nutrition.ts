import { JenisKelamin, NutritionTargets, TingkatAktivitas, Tujuan } from '../types';

export const AKTIVITAS_FAKTOR: Record<TingkatAktivitas, number> = {
  ringan: 1.375,
  sedang: 1.55,
  berat: 1.725,
};

export interface ProfileInputValues {
  jenis_kelamin: JenisKelamin;
  usia: number;
  berat: number;
  tinggi: number;
  aktivitas: TingkatAktivitas;
  tujuan: Tujuan;
}

export interface ValidationErrors {
  usia?: string;
  berat?: string;
  tinggi?: string;
}

export function parseNumberInput(value: string): number {
  if (!value || typeof value !== 'string') return NaN;
  const normalized = value.trim().replace(',', '.');
  return parseFloat(normalized);
}

export function validateProfile(usia?: number, berat?: number, tinggi?: number): {
  isValid: boolean;
  errors: ValidationErrors;
} {
  const errors: ValidationErrors = {};

  if (usia === undefined || usia === null || isNaN(usia)) {
    errors.usia = 'Usia wajib diisi';
  } else if (usia < 17 || usia > 70) {
    errors.usia = 'Usia harus antara 17 - 70 tahun';
  }

  if (berat === undefined || berat === null || isNaN(berat)) {
    errors.berat = 'Berat wajib diisi';
  } else if (berat < 30 || berat > 300) {
    errors.berat = 'Berat harus antara 30 - 300 kg';
  }

  if (tinggi === undefined || tinggi === null || isNaN(tinggi)) {
    errors.tinggi = 'Tinggi wajib diisi';
  } else if (tinggi < 100 || tinggi > 250) {
    errors.tinggi = 'Tinggi harus antara 100 - 250 cm';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

export function calculateNutrition(params: ProfileInputValues): NutritionTargets {
  const { jenis_kelamin, usia, berat, tinggi, aktivitas, tujuan } = params;

  // Mifflin-St Jeor
  const bmrRaw =
    jenis_kelamin === 'pria'
      ? 10 * berat + 6.25 * tinggi - 5 * usia + 5
      : 10 * berat + 6.25 * tinggi - 5 * usia - 161;

  const faktor = AKTIVITAS_FAKTOR[aktivitas];
  const tdeeRaw = bmrRaw * faktor;

  let targetKaloriRaw: number;
  if (tujuan === 'bulking') {
    targetKaloriRaw = tdeeRaw + 300;
  } else {
    // cutting: target = TDEE - 500, tetapi tidak pernah di bawah BMR
    targetKaloriRaw = Math.max(tdeeRaw - 500, bmrRaw);
  }

  const targetProteinRaw = 1.8 * berat;

  return {
    bmr: Math.round(bmrRaw),
    tdee: Math.round(tdeeRaw),
    targetKalori: Math.round(targetKaloriRaw),
    targetProtein: Math.round(targetProteinRaw * 10) / 10,
  };
}

export function formatKalori(kalori: number): string {
  return Math.round(kalori).toString();
}

export function formatProtein(protein: number): string {
  const rounded = Math.round(protein * 10) / 10;
  return rounded.toFixed(1).replace('.', ',');
}

export function calculatePortionNutrition(
  kalori100g: number,
  protein100g: number,
  gram: number
): { kalori: number; protein: number } {
  const kalori = (kalori100g * gram) / 100;
  const protein = (protein100g * gram) / 100;
  return { kalori, protein };
}
