"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createStoreOnboardingAction } from "@/app/(auth)/actions";
import { Loader2, AlertCircle, CheckCircle2, Lock } from "lucide-react";

const SUBSECTORS = [
  { value: "kuliner", label: "Kuliner & F&B" },
  { value: "kriya", label: "Kriya & Kerajinan Tangan" },
  { value: "fashion", label: "Fashion & Pakaian Lokal" },
  { value: "desain", label: "Desain Grafis / Produk" },
  { value: "seni_pertunjukan", label: "Seni Pertunjukan & Musik" },
  { value: "fotografi", label: "Fotografi & Videografi" },
  { value: "musik", label: "Karya Musik & Audio" },
  { value: "penerbitan", label: "Penerbitan & Buku" },
  { value: "aplikasi_game", label: "Game & Aplikasi Digital" },
  { value: "lainnya", label: "Sektor Kreatif Lainnya" },
] as const;

function toSlug(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function OnboardingForm() {
  const router = useRouter();
  const [name, setName] = React.useState("");
  const [slug, setSlug] = React.useState("");
  const [subsector, setSubsector] = React.useState<string>("kuliner");
  const [whatsappNumber, setWhatsappNumber] = React.useState("628");
  const [city, setCity] = React.useState("");
  const [address, setAddress] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);
  const [isPending, startTransition] = React.useTransition();

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setName(val);
    setSlug(toSlug(val));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    startTransition(async () => {
      const computedSlug = slug || toSlug(name);
      const res = await createStoreOnboardingAction({
        name: name.trim(),
        slug: computedSlug,
        subsector: subsector as any,
        whatsappNumber,
        city,
        address: address || undefined,
        description: description || undefined,
      });

      if (!res.success) {
        setErrorMsg(res.error);
        return;
      }

      router.push("/dashboard/management/overview");
      router.refresh();
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {errorMsg && (
        <div className="flex items-start gap-2.5 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive">
          <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Nama Toko */}
      <div className="space-y-1.5">
        <label htmlFor="name" className="text-xs font-semibold text-foreground">
          Nama Usaha / Toko UMKM <span className="text-destructive">*</span>
        </label>
        <Input
          id="name"
          type="text"
          placeholder="Contoh: Kopi Seduh Nusantara"
          value={name}
          onChange={handleNameChange}
          required
          disabled={isPending}
        />
      </div>

      {/* Slug URL (Auto-generated & Locked) */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <label htmlFor="slug" className="text-xs font-semibold text-foreground flex items-center gap-1.5">
            <span>Alamat Tautan Katalog Publik</span>
            <span className="rounded bg-secondary px-1.5 py-0.5 text-[10px] font-semibold text-muted-foreground">
              Otomatis
            </span>
          </label>
          <span className="text-[11px] text-muted-foreground font-mono">
            niagarupa.id/store/{slug || "slug-toko"}
          </span>
        </div>
        <div className="relative flex items-center rounded-md border border-input bg-muted/40 focus-within:ring-1 focus-within:ring-ring">
          <span className="pl-3 pr-1 text-xs font-mono text-muted-foreground select-none">
            /store/
          </span>
          <input
            id="slug"
            type="text"
            readOnly
            tabIndex={-1}
            value={slug}
            placeholder="terisi-otomatis-dari-nama-usaha"
            className="flex h-9 w-full bg-transparent px-2 py-1 font-mono text-sm text-foreground placeholder:text-muted-foreground focus:outline-none cursor-not-allowed select-all"
            required
          />
          <span className="pr-3 text-muted-foreground" title="Dibuat otomatis dari nama usaha">
            <Lock className="h-3.5 w-3.5" />
          </span>
        </div>
        <p className="text-[11px] text-muted-foreground">
          Dibuat otomatis dari nama usaha Anda untuk alamat etalase toko.
        </p>
      </div>

      {/* Subsektor Ekonomi Kreatif */}
      <div className="space-y-1.5">
        <label htmlFor="subsector" className="text-xs font-semibold text-foreground">
          Sektor Ekonomi Kreatif <span className="text-destructive">*</span>
        </label>
        <select
          id="subsector"
          value={subsector}
          onChange={(e) => setSubsector(e.target.value)}
          className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
          disabled={isPending}
        >
          {SUBSECTORS.map((sub) => (
            <option key={sub.value} value={sub.value} className="bg-background text-foreground">
              {sub.label}
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Nomor WhatsApp */}
        <div className="space-y-1.5">
          <label htmlFor="whatsappNumber" className="text-xs font-semibold text-foreground">
            Nomor WhatsApp Bisnis <span className="text-destructive">*</span>
          </label>
          <Input
            id="whatsappNumber"
            type="text"
            placeholder="6281234567890"
            value={whatsappNumber}
            onChange={(e) => setWhatsappNumber(e.target.value)}
            required
            disabled={isPending}
          />
          <p className="text-[11px] text-muted-foreground">
            Wajib diawali dengan kode negara 628...
          </p>
        </div>

        {/* Kota / Kabupaten */}
        <div className="space-y-1.5">
          <label htmlFor="city" className="text-xs font-semibold text-foreground">
            Kota / Kabupaten Asal <span className="text-destructive">*</span>
          </label>
          <Input
            id="city"
            type="text"
            placeholder="Contoh: Bandung, Yogyakarta"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            required
            disabled={isPending}
          />
        </div>
      </div>

      {/* Alamat Fisik / Workshop */}
      <div className="space-y-1.5">
        <label htmlFor="address" className="text-xs font-semibold text-foreground">
          Alamat Fisik / Workshop Toko (Opsional)
        </label>
        <Input
          id="address"
          type="text"
          placeholder="Jl. Malioboro No. 45"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          disabled={isPending}
        />
      </div>

      {/* Deskripsi Singkat */}
      <div className="space-y-1.5">
        <label htmlFor="description" className="text-xs font-semibold text-foreground">
          Deskripsi Usaha Singkat (Opsional)
        </label>
        <textarea
          id="description"
          rows={3}
          placeholder="Ceritakan keunikan produk atau latar belakang usaha Anda..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
          disabled={isPending}
        />
      </div>

      <Button type="submit" className="w-full" disabled={isPending}>
        {isPending ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
            <span>Menyimpan Profil Toko...</span>
          </>
        ) : (
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="h-4 w-4" />
            <span>Selesaikan & Buka Dashboard</span>
          </div>
        )}
      </Button>
    </form>
  );
}
