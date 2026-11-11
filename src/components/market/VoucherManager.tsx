"use client";

import { useState } from "react";
import { formatIDR } from "@/lib/utils";
import { createVoucherAction } from "@/app/(market)/actions";
import { Tag, Plus, CheckCircle, AlertCircle, Sparkles } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export interface VoucherItemData {
  id: string;
  code: string;
  discountAmount: number;
  minPurchase: number;
  quota: number;
  usedCount: number;
  isActive: boolean;
  validUntil: Date | string | null;
}

interface VoucherManagerProps {
  initialVouchers: VoucherItemData[];
  storeId: string;
}

export function VoucherManager({ initialVouchers, storeId }: VoucherManagerProps) {
  const [vouchersList, setVouchersList] = useState<VoucherItemData[]>(initialVouchers);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form states
  const [code, setCode] = useState("");
  const [discountAmount, setDiscountAmount] = useState<number>(10000);
  const [minPurchase, setMinPurchase] = useState<number>(50000);
  const [quota, setQuota] = useState<number>(50);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleCreateVoucher = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setIsSubmitting(true);

    const cleanCode = code.trim().toUpperCase();

    const res = await createVoucherAction({
      storeId,
      code: cleanCode,
      discountAmount,
      minPurchase,
      quota,
    });

    if (!res.success) {
      setErrorMessage(res.error);
      setIsSubmitting(false);
      return;
    }

    setVouchersList((prev) => [
      {
        id: Math.random().toString(),
        code: cleanCode,
        discountAmount,
        minPurchase,
        quota,
        usedCount: 0,
        isActive: true,
        validUntil: null,
      },
      ...prev,
    ]);

    setIsSubmitting(false);
    setIsModalOpen(false);
    setCode("");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-bold">Daftar Voucher Aktif</h3>
          <p className="text-xs text-muted-foreground">
            Kupon promo yang dapat digunakan pelanggan di micro-storefront Anda.
          </p>
        </div>

        <Button onClick={() => setIsModalOpen(true)} size="sm" className="gap-1.5 text-xs">
          <Plus className="h-4 w-4" />
          <span>Buat Voucher Baru</span>
        </Button>
      </div>

      {/* Grid Kupon */}
      {vouchersList.length === 0 ? (
        <div className="rounded-xl border border-dashed p-10 text-center bg-card">
          <Tag className="h-10 w-10 mx-auto text-muted-foreground mb-3 opacity-40" />
          <p className="font-semibold text-sm">Belum Ada Kupon Promo</p>
          <p className="text-xs text-muted-foreground mt-1">
            Buat kupon promo untuk menarik lebih banyak pembeli ke toko online Anda.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {vouchersList.map((v) => (
            <div
              key={v.id}
              className="rounded-xl border bg-card p-4 space-y-3 relative overflow-hidden shadow-xs"
            >
              <div className="flex items-center justify-between">
                <span className="font-mono font-black text-sm px-2.5 py-1 rounded-md bg-primary/10 text-primary border border-primary/20">
                  {v.code}
                </span>
                <span className="text-[10px] font-bold uppercase text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                  Aktif
                </span>
              </div>

              <div className="space-y-1">
                <div className="text-lg font-black text-foreground">
                  Potongan {formatIDR(v.discountAmount)}
                </div>
                <div className="text-xs text-muted-foreground">
                  Min. Belanja: {formatIDR(v.minPurchase)}
                </div>
              </div>

              <div className="border-t pt-2 flex items-center justify-between text-[11px] text-muted-foreground">
                <span>
                  Terpakai: <strong>{v.usedCount}</strong> / {v.quota}
                </span>
                <span className="text-[10px] text-muted-foreground">
                  Sisa Kuota: {Math.max(0, v.quota - v.usedCount)}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Buat Kupon */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-background rounded-2xl shadow-2xl border p-6 space-y-5">
            <div>
              <h3 className="font-bold text-lg">Buat Voucher Promo Baru</h3>
              <p className="text-xs text-muted-foreground">
                Tentukan kode kupon, potongan nominal, dan batas minimal pembelian.
              </p>
            </div>

            {errorMessage && (
              <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-xs flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            <form onSubmit={handleCreateVoucher} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold">Kode Voucher</label>
                <Input
                  required
                  placeholder="Contoh: MERDEKA50, HEMAT10"
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  className="font-mono uppercase text-sm"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold">Nominal Diskon (Rupiah)</label>
                <Input
                  type="number"
                  required
                  min={1000}
                  step={1000}
                  value={discountAmount}
                  onChange={(e) => setDiscountAmount(Number(e.target.value))}
                  className="text-sm"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold">Minimal Belanja (Rupiah)</label>
                <Input
                  type="number"
                  required
                  min={0}
                  step={5000}
                  value={minPurchase}
                  onChange={(e) => setMinPurchase(Number(e.target.value))}
                  className="text-sm"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold">Batas Kuota Pemakaian</label>
                <Input
                  type="number"
                  required
                  min={1}
                  value={quota}
                  onChange={(e) => setQuota(Number(e.target.value))}
                  className="text-sm"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsModalOpen(false)}
                  className="text-xs"
                >
                  Batal
                </Button>
                <Button type="submit" disabled={isSubmitting} className="text-xs">
                  {isSubmitting ? "Menyimpan..." : "Simpan Voucher"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

