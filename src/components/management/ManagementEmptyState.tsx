import { Store, ShoppingCart, PlusCircle, ArrowRight } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

interface ManagementEmptyStateProps {
  type: "finance" | "analytics";
  storeName: string;
}

export function ManagementEmptyState({ type, storeName }: ManagementEmptyStateProps) {
  const isFinance = type === "finance";

  return (
    <div className="rounded-xl border border-dashed bg-card/60 p-8 sm:p-12 text-center max-w-2xl mx-auto space-y-4">
      <div className="mx-auto w-12 h-12 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-600 flex items-center justify-center">
        {isFinance ? <Store className="h-6 w-6" /> : <ShoppingCart className="h-6 w-6" />}
      </div>

      <div className="space-y-1.5">
        <h3 className="text-lg font-bold text-foreground">
          {isFinance ? "Belum Ada Transaksi Buku Kas" : "Data Analitik Belum Tersedia"}
        </h3>
        <p className="text-xs sm:text-sm text-muted-foreground max-w-md mx-auto">
          Toko <strong>{storeName}</strong> belum mencatat riwayat transaksi pesanan selesai atau pengeluaran operasional.
        </p>
      </div>

      <div className="pt-2 flex flex-wrap justify-center gap-3">
        <Link href="/dashboard/operational/pos">
          <Button size="sm" className="bg-amber-600 hover:bg-amber-700 text-white gap-1.5 text-xs">
            <ShoppingCart className="h-3.5 w-3.5" />
            <span>Mulai Transaksi Kasir (POS)</span>
          </Button>
        </Link>
        <Link href="/dashboard/operational/products">
          <Button variant="outline" size="sm" className="gap-1.5 text-xs">
            <span>Atur Produk & Stok</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Button>
        </Link>
      </div>
    </div>
  );
}

