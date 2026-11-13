"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Calendar } from "lucide-react";

const PERIOD_OPTIONS = [
  { value: "7d", label: "7 Hari Terakhir" },
  { value: "30d", label: "30 Hari Terakhir" },
  { value: "90d", label: "3 Bulan Terakhir" },
  { value: "all", label: "Semua Waktu" },
];

export function DateRangeSelector() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const currentPeriod = searchParams.get("period") || "30d";

  const handleSelect = (val: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("period", val);
    router.push(`${pathname}?${params.toString()}`);
  };

  return (
    <div className="flex items-center gap-1.5 p-1 rounded-lg bg-muted/60 border text-xs">
      <div className="flex items-center gap-1 px-2 text-muted-foreground font-medium">
        <Calendar className="h-3.5 w-3.5" />
        <span className="hidden sm:inline">Periode:</span>
      </div>
      {PERIOD_OPTIONS.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => handleSelect(opt.value)}
          className={`px-2.5 py-1 rounded-md font-medium transition-all ${
            currentPeriod === opt.value
              ? "bg-background text-foreground shadow-sm font-semibold"
              : "text-muted-foreground hover:text-foreground hover:bg-background/50"
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

