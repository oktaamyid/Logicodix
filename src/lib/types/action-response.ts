/**
 * Standar tipe kembalian (return type) untuk seluruh Next.js Server Actions.
 * Memastikan penanganan hasil sukses dan error yang konsisten di seluruh domain.
 */
export type ActionResponse<T> =
  | { success: true; data: T }
  | { success: false; error: string; code?: string };

/**
 * Helper untuk membuat respons sukses terstandarisasi dari Server Action.
 *
 * @param data - Payload hasil eksekusi yang dikembalikan ke pemanggil
 * @returns Objek ActionResponse dengan status success: true
 */
export function actionSuccess<T>(data: T): ActionResponse<T> {
  return { success: true, data };
}

/**
 * Helper untuk membuat respons gagal terstandarisasi dari Server Action.
 *
 * @param error - Pesan kesalahan yang aman ditampilkan ke pengguna
 * @param code - Kode error opsional untuk identifikasi terprogram (contoh: 'VALIDATION_ERROR', 'OUT_OF_STOCK')
 * @returns Objek ActionResponse dengan status success: false
 */
export function actionError<T = never>(
  error: string,
  code?: string
): ActionResponse<T> {
  return { success: false, error, code };
}
