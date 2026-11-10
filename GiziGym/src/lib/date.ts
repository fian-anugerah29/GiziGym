/**
 * Mengambil tanggal lokal perangkat dalam format "YYYY-MM-DD".
 * Menggunakan waktu lokal (getFullYear, getMonth, getDate), BUKAN toISOString() yang memakai UTC.
 */
export function getLocalDateString(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

const BULAN_INDONESIA = [
  'Januari',
  'Februari',
  'Maret',
  'April',
  'Mei',
  'Juni',
  'Juli',
  'Agustus',
  'September',
  'Oktober',
  'November',
  'Desember',
];

/**
 * Format tanggal YYYY-MM-DD ke format tampilan Indonesia tanpa Intl/toLocaleString,
 * contoh: "10 November 2026"
 */
export function formatDisplayDate(dateStr: string): string {
  const parts = dateStr.split('-');
  if (parts.length !== 3) return dateStr;
  const year = parts[0];
  const monthIndex = parseInt(parts[1], 10) - 1;
  const day = parseInt(parts[2], 10);
  const bulan = BULAN_INDONESIA[monthIndex] ?? parts[1];
  return `${day} ${bulan} ${year}`;
}
