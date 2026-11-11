"use client";

import { Button } from "@/components/ui/button";
import { Download, Printer } from "lucide-react";
import { type FinancialEntry } from "@/lib/db/schema/management";

interface ExportFinanceReportProps {
  storeName: string;
  entries: FinancialEntry[];
  totalIncome: number;
  totalExpense: number;
  netProfit: number;
}

const CATEGORY_NAMES: Record<string, string> = {
  raw_material: "Bahan Baku & Produksi",
  operational: "Operasional Toko",
  salary: "Gaji & Upah Karyawan",
  rent: "Sewa Tempat",
  utilities: "Listrik & Utilitas",
  marketing: "Iklan & Pemasaran",
  other: "Lainnya",
};

export function ExportFinanceReportButton({
  storeName,
  entries,
  totalIncome,
  totalExpense,
  netProfit,
}: ExportFinanceReportProps) {
  const handleExportCSV = () => {
    if (!entries || entries.length === 0) {
      alert("Belum ada riwayat transaksi untuk diekspor.");
      return;
    }

    const headers = [
      "Tanggal",
      "Tipe Transaksi",
      "Kategori",
      "Keterangan",
      "Nominal (IDR)",
    ];

    const rows = entries.map((e) => {
      const dateStr = new Date(e.transactionDate).toLocaleDateString("id-ID");
      const typeStr = e.type === "income" ? "Pemasukan" : "Pengeluaran";
      const catStr = e.expenseCategory
        ? CATEGORY_NAMES[e.expenseCategory] || e.expenseCategory
        : "-";
      const cleanDesc = `"${(e.description || "").replace(/"/g, '""')}"`;
      const amountSigned = e.type === "income" ? e.amount : -e.amount;

      return [dateStr, typeStr, `"${catStr}"`, cleanDesc, amountSigned].join(
        ","
      );
    });

    // Ringkasan di baris bawah
    rows.push("");
    rows.push(`"--- RINGKASAN PEMBUKUAN ---",,,,`);
    rows.push(`"Total Pemasukan",,,,${totalIncome}`);
    rows.push(`"Total Pengeluaran",,,,${totalExpense}`);
    rows.push(`"Laba Bersih",,,,${netProfit}`);

    const csvContent =
      "data:text/csv;charset=utf-8,\uFEFF" + [headers.join(","), ...rows].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `laporan-keuangan-${storeName.toLowerCase().replace(/\s+/g, "-")}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="flex items-center gap-2 print:hidden">
      <Button
        variant="outline"
        size="sm"
        onClick={handlePrint}
        className="gap-1.5 text-xs text-muted-foreground hover:text-foreground"
      >
        <Printer className="h-3.5 w-3.5" />
        <span>Cetak</span>
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={handleExportCSV}
        className="gap-1.5 text-xs text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800 hover:bg-amber-50 dark:hover:bg-amber-950/40"
      >
        <Download className="h-3.5 w-3.5" />
        <span>Ekspor CSV</span>
      </Button>
    </div>
  );
}

