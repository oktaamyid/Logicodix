"use client";

import { useState } from "react";
import { recordExpenseAction } from "@/lib/actions/management/finance";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PlusCircle, Loader2 } from "lucide-react";

interface RecordExpenseDialogProps {
  storeId: string;
}

const CATEGORY_OPTIONS = [
  { value: "raw_material", label: "Bahan Baku & Produksi" },
  { value: "operational", label: "Operasional Toko" },
  { value: "salary", label: "Gaji & Upah Karyawan" },
  { value: "rent", label: "Sewa Tempat / Ruko" },
  { value: "utilities", label: "Listrik, Air & Internet" },
  { value: "marketing", label: "Iklan & Pemasaran" },
  { value: "other", label: "Pengeluaran Lainnya" },
];

export function RecordExpenseDialog({ storeId }: RecordExpenseDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const [category, setCategory] = useState<string>("operational");
  const [amount, setAmount] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [date, setDate] = useState<string>(
    new Date().toISOString().split("T")[0]
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    const numAmount = parseInt(amount.replace(/\D/g, ""), 10);
    if (isNaN(numAmount) || numAmount < 500) {
      setErrorMsg("Nominal pengeluaran minimal Rp 500");
      return;
    }

    if (!description.trim() || description.trim().length < 3) {
      setErrorMsg("Keterangan pengeluaran minimal 3 karakter");
      return;
    }

    setLoading(true);
    try {
      const res = await recordExpenseAction({
        storeId,
        expenseCategory: category as any,
        amount: numAmount,
        description: description.trim(),
        transactionDate: new Date(date),
      });

      if (!res.success) {
        setErrorMsg(res.error || "Gagal menyimpan pengeluaran");
      } else {
        setSuccessMsg("Pengeluaran operasional berhasil dicatat!");
        setAmount("");
        setDescription("");
        setTimeout(() => {
          setIsOpen(false);
          setSuccessMsg(null);
        }, 1200);
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Terjadi kesalahan sistem");
    } finally {
      setLoading(false);
    }
  };

  const formatRupiahInput = (val: string) => {
    const raw = val.replace(/\D/g, "");
    if (!raw) return "";
    return new Intl.NumberFormat("id-ID").format(parseInt(raw, 10));
  };

  return (
    <>
      <Button
        onClick={() => setIsOpen(true)}
        className="gap-2 bg-amber-600 hover:bg-amber-700 text-white font-medium shadow-sm"
      >
        <PlusCircle className="h-4 w-4" />
        <span>Catat Beban Pengeluaran</span>
      </Button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-xl bg-card border shadow-2xl p-6 space-y-4">
            <div className="flex justify-between items-center border-b pb-3">
              <div>
                <h3 className="text-lg font-bold">Catat Pengeluaran Baru</h3>
                <p className="text-xs text-muted-foreground">
                  Catat biaya operasional toko untuk perhitungan laba bersih.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="text-muted-foreground hover:text-foreground text-sm font-semibold p-1"
              >
                ✕
              </button>
            </div>

            {errorMsg && (
              <div className="p-3 text-xs bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300 rounded-md border border-red-200">
                {errorMsg}
              </div>
            )}

            {successMsg && (
              <div className="p-3 text-xs bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 rounded-md border border-emerald-200">
                {successMsg}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold mb-1 text-foreground">
                  Kategori Biaya
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full h-10 px-3 text-sm rounded-md border bg-background focus:outline-none focus:ring-2 focus:ring-amber-500"
                >
                  {CATEGORY_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1 text-foreground">
                  Nominal (Rp)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-xs font-medium text-muted-foreground">
                    Rp
                  </span>
                  <Input
                    type="text"
                    required
                    value={amount}
                    onChange={(e) => setAmount(formatRupiahInput(e.target.value))}
                    placeholder="Contoh: 150.000"
                    className="pl-9 font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1 text-foreground">
                  Keterangan / Deskripsi
                </label>
                <Input
                  type="text"
                  required
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Contoh: Pembelian cup & sedotan boba 500 pcs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1 text-foreground">
                  Tanggal Transaksi
                </label>
                <Input
                  type="date"
                  required
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsOpen(false)}
                  disabled={loading}
                >
                  Batal
                </Button>
                <Button
                  type="submit"
                  disabled={loading}
                  className="bg-amber-600 hover:bg-amber-700 text-white min-w-28"
                >
                  {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    "Simpan Catatan"
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

