import React, { ReactNode } from 'react';

export interface ColumnDef<T> {
  /**
   * Teks atau komponen yang akan ditampilkan di Header kolom (th).
   */
  header: string | ReactNode;
  /**
   * Fungsi atau fungsi komponen (JSX) untuk melakukan render isi dari sel (td) pada setiap baris data.
   */
  cell: (row: T, index: number) => ReactNode;
  /**
   * Kustomisasi kelas Tailwind tambahan untuk sel header.
   */
  headerClassName?: string;
  /**
   * Kustomisasi kelas Tailwind tambahan untuk sel konten.
   */
  cellClassName?: string;
}

export interface DataTableProps<T> {
  /**
   * Definisi struktur kolom (header dan render custom per sel).
   */
  columns: ColumnDef<T>[];
  /**
   * Data array yang akan dirender (tipe T).
   */
  data: T[];
  /**
   * Menentukan *key* unik untuk setiap elemen baris `tr`. Sebaiknya nama properti dari T (misal: 'id').
   * Jika tidak diset, *fallback* menggunakan *index* (kurang direkomendasikan jika data dinamis).
   */
  keyExtractor?: (row: T, index: number) => string | number;
  /**
   * Kondisi ketika data sedang dimuat, berguna untuk menampilkan state skeleton (opsional).
   */
  isLoading?: boolean;
  /**
   * Teks atau komponen yang ditampilkan jika data array kosong.
   */
  emptyState?: ReactNode;
  /**
   * Kustomisasi kelas Tailwind tambahan untuk kontainer pembungkus tabel (berguna untuk max-height).
   */
  containerClassName?: string;
}

/**
 * Reusable Data Table Component
 * Komponen ini berfungsi merender struktur HTML `table` yang bebas disesuaikan isi barisnya (*Headless UI pattern*).
 */
export function DataTable<T>({
  columns,
  data,
  keyExtractor,
  isLoading = false,
  emptyState = 'Tidak ada data',
  containerClassName,
}: DataTableProps<T>) {
  return (
    <div className={containerClassName || "w-full overflow-x-auto rounded-xl"}>
      <table className="w-full text-left relative">
        <thead className="bg-slate-50 dark:bg-zinc-900 sticky top-0 z-20 shadow-sm">
          <tr>
            {columns.map((col, idx) => (
              <th
                key={idx}
                className={`px-6 py-4 text-xs font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider ${col.headerClassName || ''}`}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-50 dark:divide-zinc-800/50">
          {isLoading ? (
            // Simple loading state
            <tr>
              <td colSpan={columns.length} className="px-6 py-8 text-center text-slate-500 dark:text-zinc-400">
                Memuat data...
              </td>
            </tr>
          ) : data.length === 0 ? (
            // Empty state
            <tr>
              <td colSpan={columns.length} className="px-6 py-12 text-center text-slate-500 dark:text-zinc-400">
                {emptyState}
              </td>
            </tr>
          ) : (
            // Render actual rows based on generic data type T
            data.map((row, rowIndex) => {
              const rowKey = keyExtractor ? keyExtractor(row, rowIndex) : rowIndex;
              
              return (
                <tr
                  key={rowKey}
                  className="hover:bg-slate-50 dark:hover:bg-zinc-900/50 transition-colors group"
                >
                  {columns.map((col, colIndex) => (
                    <td
                      key={colIndex}
                      className={`px-6 py-4 align-middle ${col.cellClassName || ''}`}
                    >
                      {col.cell(row, rowIndex)}
                    </td>
                  ))}
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}
