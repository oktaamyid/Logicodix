"use client";

import { useTransition } from "react";
import { deleteFinancialEntryAction } from "@/lib/actions/management/finance";
import { type FinancialEntry } from "@/lib/db/schema/management";
import { ArrowDownLeft, ArrowUpRight, Trash2 } from "lucide-react";

interface FinancialTransactionsTableProps {
  entries: FinancialEntry[];
  storeId: string;
}

const CATEGORY_NAMES: Record<string, string> = {
  raw_material: "Bahan Baku",
  operational: "Operasional",
  salary: "Gaji Karyawan",
  rent: "Sewa Tempat",
  utilities: "Listrik & Utilitas",
  marketing: "Pemasaran / Ads",
  other: "Lainnya",
};

export function FinancialTransactionsTable({
  entries,
  storeId,
}: FinancialTransactionsTableProps) {
  const [isPending, startTransition] = useTransition();

  const formatIDR = (num: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(num);
  };

  const formatDate = (date: Date | string) => {
    const d = new Date(date);
    return d.toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const handleDelete = (id: string) => {
    if (confirm("Hapus catatan transaksi ini dari buku kas?")) {
      startTransition(async () => {
        await deleteFinancialEntryAction(storeId, id);
      });
    }
  };

  if (!entries || entries.length === 0) {
    return (
      <div className="rounded-xl border bg-card p-12 text-center text-muted-foreground">
        <p className="text-base font-semibold">Belum Ada Catatan Transaksi</p>
        <p className="text-sm mt-1">
          Catat pengeluaran operasional atau selesaikan pesanan kasir untuk mencatat riwayat buku kas.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border bg-card overflow-hidden shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-muted/50 border-b text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="px-5 py-3.5">Tanggal</th>
              <th className="px-5 py-3.5">Tipe</th>
              <th className="px-5 py-3.5">Kategori / Keterangan</th>
              <th className="px-5 py-3.5 text-right">Nominal</th>
              <th className="px-5 py-3.5 text-center">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {entries.map((entry) => {
              const isIncome = entry.type === "income";
              return (
                <tr key={entry.id} className="hover:bg-muted/30 transition-colors">
                  <td className="px-5 py-4 whitespace-nowrap text-muted-foreground text-xs font-medium">
                    {formatDate(entry.transactionDate)}
                  </td>
                  <td className="px-5 py-4 whitespace-nowrap">
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${
                        isIncome
                          ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                          : "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300"
                      }`}
                    >
                      {isIncome ? (
                        <>
                          <ArrowUpRight className="h-3.5 w-3.5" />
                          <span>Pemasukan</span>
                        </>
                      ) : (
                        <>
                          <ArrowDownLeft className="h-3.5 w-3.5" />
                          <span>Pengeluaran</span>
                        </>
                      )}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <div className="font-medium text-foreground">
                      {entry.description}
                    </div>
                    {entry.expenseCategory && (
                      <div className="text-xs text-muted-foreground mt-0.5">
                        Kategori: {CATEGORY_NAMES[entry.expenseCategory] || entry.expenseCategory}
                      </div>
                    )}
                  </td>
                  <td
                    className={`px-5 py-4 text-right font-bold whitespace-nowrap ${
                      isIncome
                        ? "text-emerald-600 dark:text-emerald-400"
                        : "text-rose-600 dark:text-rose-400"
                    }`}
                  >
                    {isIncome ? "+" : "-"} {formatIDR(entry.amount)}
                  </td>
                  <td className="px-5 py-4 text-center whitespace-nowrap">
                    {/* Hanya entri manual (bukan referensi order otomatis) yang dapat dihapus bebas */}
                    {!entry.referenceOrderId ? (
                      <button
                        onClick={() => handleDelete(entry.id)}
                        disabled={isPending}
                        title="Hapus entri"
                        className="p-1.5 text-muted-foreground hover:text-rose-600 rounded-md hover:bg-muted transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    ) : (
                      <span className="text-[11px] font-mono text-muted-foreground bg-muted px-2 py-0.5 rounded">
                        Auto POS
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

