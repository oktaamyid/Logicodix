"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Store as StoreIcon,
  ShieldCheck,
  Users,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  Save,
} from "lucide-react";
import Link from "next/link";
import {
  updateStoreSettingsAction,
  updateStoreMemberRoleAction,
  type StoreSettingsBundle,
} from "@/app/dashboard/settings/actions";
import { CREATIVE_SUBSECTORS } from "@/lib/schemas/operational.schema";

interface StoreSettingsViewProps {
  initialData: StoreSettingsBundle;
}

const SUBSECTOR_LABELS: Record<(typeof CREATIVE_SUBSECTORS)[number], string> = {
  kuliner: "Kuliner & Olahan Pangan",
  kriya: "Kriya & Kerajinan Tangan",
  fashion: "Fesyen & Wastra Nusantara",
  desain: "Desain & Komunikasi Visual",
  seni_pertunjukan: "Seni Pertunjukan",
  fotografi: "Fotografi & Studio Kreatif",
  musik: "Musik & Audio",
  penerbitan: "Penerbitan & Literasi",
  aplikasi_game: "Aplikasi & Permainan Interaktif",
  lainnya: "Sektor UMKM Lainnya",
};

const ROLE_LABELS: Record<
  StoreSettingsBundle["currentUserRole"],
  { label: string; description: string }
> = {
  owner: {
    label: "Pemilik Toko (Owner)",
    description:
      "Akses penuh ke kasir, katalog produk, opname stok, buku kas, dan pengaturan toko.",
  },
  platform_admin: {
    label: "Admin Platform (Superadmin)",
    description:
      "Akses lintas toko untuk pemantauan ekosistem, kurasi direktori, dan pendampingan UMKM.",
  },
  cashier: {
    label: "Kasir Operasional",
    description:
      "Akses ke terminal kasir POS dan pembaruan status pesanan pelanggan.",
  },
  staff: {
    label: "Staf Gudang & Katalog",
    description:
      "Akses ke manajemen produk dan pencatatan mutasi stok gudang.",
  },
};

export function StoreSettingsView({ initialData }: StoreSettingsViewProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const { store, members, currentUserEmail, currentUserRole } = initialData;

  const [name, setName] = useState(store.name);
  const [slug, setSlug] = useState(store.slug);
  const [subsector, setSubsector] = useState<
    (typeof CREATIVE_SUBSECTORS)[number]
  >(
    (CREATIVE_SUBSECTORS.includes(
      store.subsector as (typeof CREATIVE_SUBSECTORS)[number]
    )
      ? store.subsector
      : "kuliner") as (typeof CREATIVE_SUBSECTORS)[number]
  );
  const [whatsappNumber, setWhatsappNumber] = useState(store.whatsappNumber);
  const [city, setCity] = useState(store.city);
  const [address, setAddress] = useState(store.address ?? "");
  const [description, setDescription] = useState(store.description ?? "");
  const [isActive, setIsActive] = useState(store.isActive);

  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const canEditStore =
    currentUserRole === "owner" || currentUserRole === "platform_admin";

  function handleSaveSettings(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setFeedback(null);

    startTransition(async () => {
      const res = await updateStoreSettingsAction({
        storeId: store.id,
        name: name.trim(),
        slug: slug.trim().toLowerCase(),
        subsector,
        whatsappNumber: whatsappNumber.trim(),
        city: city.trim(),
        address: address.trim(),
        description: description.trim(),
        isActive,
      });

      if (!res.success) {
        setFeedback({ type: "error", message: res.error });
        return;
      }

      setFeedback({
        type: "success",
        message: "Profil dan pengaturan operasional toko berhasil diperbarui.",
      });
      router.refresh();
    });
  }

  function handleRoleChange(memberId: string, newRole: "cashier" | "staff") {
    setFeedback(null);
    startTransition(async () => {
      const res = await updateStoreMemberRoleAction({
        storeId: store.id,
        memberId,
        role: newRole,
      });

      if (!res.success) {
        setFeedback({ type: "error", message: res.error });
        return;
      }

      setFeedback({
        type: "success",
        message: "Peran anggota tim berhasil diperbarui.",
      });
      router.refresh();
    });
  }

  const roleMeta = ROLE_LABELS[currentUserRole];

  return (
    <div className="space-y-8 max-w-5xl">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-border pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Pengaturan Toko & Akun UMKM
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Kelola identitas etalase publik, nomor WhatsApp pesanan, dan hak
            akses tim operasional toko Anda.
          </p>
        </div>
        <Link
          href={`/store/${store.slug}`}
          target="_blank"
          className="inline-flex min-h-[44px] items-center gap-2 rounded-lg border border-border bg-white px-4 py-2.5 text-sm font-semibold text-foreground shadow-sm transition-colors hover:bg-secondary"
        >
          <span>Lihat Etalase Publik</span>
          <ExternalLink className="h-4 w-4 text-muted-foreground" />
        </Link>
      </div>

      {/* Feedback Banner */}
      {feedback && (
        <div
          role={feedback.type === "error" ? "alert" : "status"}
          className={`flex items-start gap-3 rounded-lg border p-4 text-sm ${
            feedback.type === "success"
              ? "border-emerald-300 bg-emerald-50 text-emerald-950"
              : "border-red-300 bg-red-50 text-red-950"
          }`}
        >
          {feedback.type === "success" ? (
            <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-700 mt-0.5" />
          ) : (
            <AlertCircle className="h-5 w-5 shrink-0 text-red-700 mt-0.5" />
          )}
          <div className="font-medium">{feedback.message}</div>
        </div>
      )}

      {/* Grid: Left (Account Summary + Team Roles), Right (Store Profile Form) */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
        {/* Left Column: Account Identity & Team Members */}
        <div className="space-y-6 lg:col-span-5">
          {/* Active Session Card */}
          <section className="rounded-xl border border-border bg-card p-6 shadow-sm">
            <div className="flex items-center gap-3 border-b border-border pb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50 text-emerald-800">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-foreground">
                  Akun & Hak Akses Aktif
                </h2>
                <p className="text-xs text-muted-foreground">
                  Sesi masuk yang sedang terhubung
                </p>
              </div>
            </div>

            <dl className="mt-4 space-y-3 text-sm">
              <div>
                <dt className="text-xs font-medium text-muted-foreground">
                  Email Terdaftar
                </dt>
                <dd className="mt-0.5 font-mono text-sm font-semibold text-foreground break-all">
                  {currentUserEmail}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-medium text-muted-foreground">
                  Peran di Toko Ini
                </dt>
                <dd className="mt-1">
                  <span className="inline-flex items-center rounded-md bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-900">
                    {roleMeta.label}
                  </span>
                </dd>
                <p className="mt-1.5 text-xs text-muted-foreground leading-relaxed">
                  {roleMeta.description}
                </p>
              </div>
              <div className="pt-2 border-t border-border">
                <dt className="text-xs font-medium text-muted-foreground">
                  ID Tenant Toko
                </dt>
                <dd className="mt-0.5 font-mono text-xs text-muted-foreground">
                  {store.id}
                </dd>
              </div>
            </dl>
          </section>

          {/* Store Members / Staff List */}
          <section className="rounded-xl border border-border bg-card p-6 shadow-sm">
            <div className="flex items-center justify-between border-b border-border pb-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100 text-slate-800">
                  <Users className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-foreground">
                    Anggota Tim Toko ({members.length})
                  </h2>
                  <p className="text-xs text-muted-foreground">
                    Daftar pengguna dengan akses operasional
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-4 divide-y divide-border">
              {members.length === 0 ? (
                <p className="py-4 text-sm text-muted-foreground">
                  Belum ada anggota staf tambahan yang terdaftar pada toko ini.
                </p>
              ) : (
                members.map((member) => (
                  <div
                    key={member.id}
                    className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="min-w-0">
                      <p className="text-xs font-mono text-foreground truncate">
                        UID: {member.userId.slice(0, 12)}...
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Terdaftar{" "}
                        {new Date(member.createdAt).toLocaleDateString(
                          "id-ID",
                          {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          }
                        )}
                      </p>
                    </div>
                    {member.role === "owner" ? (
                      <span className="inline-flex items-center rounded-md bg-slate-900 px-2.5 py-1 text-xs font-semibold text-white">
                        Pemilik Utama
                      </span>
                    ) : (
                      <select
                        aria-label="Ubah peran staf"
                        disabled={!canEditStore || isPending}
                        value={member.role}
                        onChange={(e) =>
                          handleRoleChange(
                            member.id,
                            e.target.value as "cashier" | "staff"
                          )
                        }
                        className="min-h-[44px] rounded-lg border border-input bg-background px-3 py-1.5 text-xs font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
                      >
                        <option value="cashier">Kasir POS</option>
                        <option value="staff">Staf Gudang</option>
                      </select>
                    )}
                  </div>
                ))
              )}
            </div>
          </section>
        </div>

        {/* Right Column: Store Profile Configuration Form */}
        <div className="lg:col-span-7">
          <form
            onSubmit={handleSaveSettings}
            className="rounded-xl border border-border bg-card p-6 shadow-sm space-y-5"
          >
            <div className="flex items-center gap-3 border-b border-border pb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50 text-emerald-800">
                <StoreIcon className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-foreground">
                  Profil & Konfigurasi Etalase UMKM
                </h2>
                <p className="text-xs text-muted-foreground">
                  Data ini ditampilkan pada halaman katalog publik dan struk
                  kasir
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label
                  htmlFor="store-name"
                  className="block text-sm font-semibold text-foreground mb-1.5"
                >
                  Nama Usaha / Toko
                </label>
                <input
                  id="store-name"
                  type="text"
                  required
                  disabled={!canEditStore || isPending}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full min-h-[44px] rounded-lg border border-input bg-background px-3.5 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-60"
                />
              </div>

              <div>
                <label
                  htmlFor="store-slug"
                  className="block text-sm font-semibold text-foreground mb-1.5"
                >
                  Slug Tautan Etalase
                </label>
                <div className="flex items-center rounded-lg border border-input bg-secondary/40 focus-within:ring-2 focus-within:ring-ring">
                  <span className="pl-3 pr-1 text-xs font-mono text-muted-foreground select-none">
                    /store/
                  </span>
                  <input
                    id="store-slug"
                    type="text"
                    required
                    disabled={!canEditStore || isPending}
                    value={slug}
                    onChange={(e) =>
                      setSlug(
                        e.target.value
                          .toLowerCase()
                          .replace(/[^a-z0-9-]/g, "-")
                          .replace(/-+/g, "-")
                      )
                    }
                    className="w-full min-h-[44px] rounded-r-lg bg-background px-2.5 py-2 font-mono text-sm text-foreground focus:outline-none disabled:opacity-60"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="store-subsector"
                  className="block text-sm font-semibold text-foreground mb-1.5"
                >
                  Subsektor Ekonomi Kreatif
                </label>
                <select
                  id="store-subsector"
                  disabled={!canEditStore || isPending}
                  value={subsector}
                  onChange={(e) =>
                    setSubsector(
                      e.target.value as (typeof CREATIVE_SUBSECTORS)[number]
                    )
                  }
                  className="w-full min-h-[44px] rounded-lg border border-input bg-background px-3.5 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-60"
                >
                  {CREATIVE_SUBSECTORS.map((item) => (
                    <option key={item} value={item}>
                      {SUBSECTOR_LABELS[item]}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label
                  htmlFor="store-wa"
                  className="block text-sm font-semibold text-foreground mb-1.5"
                >
                  Nomor WhatsApp Penerima Pesanan
                </label>
                <input
                  id="store-wa"
                  type="tel"
                  required
                  disabled={!canEditStore || isPending}
                  value={whatsappNumber}
                  onChange={(e) => setWhatsappNumber(e.target.value)}
                  placeholder="6281234567890"
                  className="w-full min-h-[44px] rounded-lg border border-input bg-background px-3.5 py-2 font-mono text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-60"
                />
                <p className="mt-1 text-xs text-muted-foreground">
                  Gunakan awalan 62 atau 08 untuk pengalihan otomatis pesanan.
                </p>
              </div>

              <div>
                <label
                  htmlFor="store-city"
                  className="block text-sm font-semibold text-foreground mb-1.5"
                >
                  Kota / Kabupaten Operasional
                </label>
                <input
                  id="store-city"
                  type="text"
                  required
                  disabled={!canEditStore || isPending}
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="w-full min-h-[44px] rounded-lg border border-input bg-background px-3.5 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-60"
                />
              </div>

              <div className="sm:col-span-2">
                <label
                  htmlFor="store-address"
                  className="block text-sm font-semibold text-foreground mb-1.5"
                >
                  Alamat Lengkap Gerai / Rumah Produksi
                </label>
                <input
                  id="store-address"
                  type="text"
                  disabled={!canEditStore || isPending}
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Jl. Braga No. 18, Kecamatan Sumur Bandung"
                  className="w-full min-h-[44px] rounded-lg border border-input bg-background px-3.5 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-60"
                />
              </div>

              <div className="sm:col-span-2">
                <label
                  htmlFor="store-desc"
                  className="block text-sm font-semibold text-foreground mb-1.5"
                >
                  Deskripsi Singkat Toko & Cerita Karya
                </label>
                <textarea
                  id="store-desc"
                  rows={3}
                  disabled={!canEditStore || isPending}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Ceritakan keunggulan bahan baku lokal atau ciri khas produk toko Anda..."
                  className="w-full rounded-lg border border-input bg-background px-3.5 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-60"
                />
              </div>

              <div className="sm:col-span-2 rounded-lg border border-border bg-secondary/40 p-4">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    disabled={!canEditStore || isPending}
                    checked={isActive}
                    onChange={(e) => setIsActive(e.target.checked)}
                    className="mt-1 h-4 w-4 rounded border-input text-primary focus:ring-ring"
                  />
                  <div>
                    <span className="block text-sm font-semibold text-foreground">
                      Buka Etalase Publik & Terima Pesanan Online
                    </span>
                    <span className="block text-xs text-muted-foreground mt-0.5">
                      Jika dinonaktifkan, toko tetap bisa menggunakan kasir POS
                      internal namun tidak tampil di direktori publik.
                    </span>
                  </div>
                </label>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 border-t border-border pt-4">
              <button
                type="submit"
                disabled={!canEditStore || isPending}
                className="inline-flex min-h-[44px] items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90 disabled:opacity-50"
              >
                <Save className="h-4 w-4" />
                <span>
                  {isPending ? "Menyimpan Perubahan..." : "Simpan Pengaturan Toko"}
                </span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
