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
  Copy,
  Check,
  Receipt,
  Share2,
  RefreshCw,
  Info,
  UserPlus,
  Trash2,
} from "lucide-react";
import Link from "next/link";
import {
  updateStoreSettingsAction,
  updateStoreMemberRoleAction,
  addStoreMemberAction,
  removeStoreMemberAction,
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
  const [subsector, setSubsector] = useState<(typeof CREATIVE_SUBSECTORS)[number]>(
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

  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedId, setCopiedId] = useState(false);

  const [newMemberEmail, setNewMemberEmail] = useState("");
  const [newMemberRole, setNewMemberRole] = useState<"cashier" | "staff">("cashier");

  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const canEditStore =
    currentUserRole === "owner" || currentUserRole === "platform_admin";

  const storeUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/store/${slug}`
      : `/store/${slug}`;

  function handleCopyStoreLink() {
    navigator.clipboard.writeText(storeUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  }

  function handleCopyTenantId() {
    navigator.clipboard.writeText(store.id);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  }

  function handleSyncSlugFromName() {
    const generated = name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
    if (generated) {
      setSlug(generated);
    }
  }

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

  function handleAddMember(e: React.FormEvent) {
    e.preventDefault();
    if (!newMemberEmail.trim()) return;
    setFeedback(null);
    startTransition(async () => {
      const res = await addStoreMemberAction({
        storeId: store.id,
        email: newMemberEmail.trim(),
        role: newMemberRole,
      });

      if (!res.success) {
        setFeedback({ type: "error", message: res.error });
        return;
      }

      setNewMemberEmail("");
      setFeedback({
        type: "success",
        message: `Karyawan "${res.data.email || newMemberEmail}" berhasil ditambahkan sebagai ${
          newMemberRole === "cashier" ? "Kasir POS" : "Staf Gudang"
        }.`,
      });
      router.refresh();
    });
  }

  function handleRemoveMember(memberId: string, label: string) {
    setFeedback(null);
    startTransition(async () => {
      const res = await removeStoreMemberAction({
        storeId: store.id,
        memberId,
      });

      if (!res.success) {
        setFeedback({ type: "error", message: res.error });
        return;
      }

      setFeedback({
        type: "success",
        message: `Akses tim untuk "${label}" telah dihapus.`,
      });
      router.refresh();
    });
  }

  const roleMeta = ROLE_LABELS[currentUserRole];

  return (
    <div className="space-y-8 w-full">
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
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleCopyStoreLink}
            className="inline-flex min-h-[44px] items-center gap-2 rounded-lg border border-border bg-card px-4 py-2 text-sm font-semibold text-foreground shadow-xs transition-colors hover:bg-secondary"
          >
            {copiedLink ? (
              <>
                <Check className="h-4 w-4 text-emerald-700" />
                <span>Tautan Disalin</span>
              </>
            ) : (
              <>
                <Copy className="h-4 w-4 text-muted-foreground" />
                <span>Salin Tautan Toko</span>
              </>
            )}
          </button>
          <Link
            href={`/store/${store.slug}`}
            target="_blank"
            className="inline-flex min-h-[44px] items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-xs transition-colors hover:bg-primary/90"
          >
            <span>Buka Etalase</span>
            <ExternalLink className="h-4 w-4" />
          </Link>
        </div>
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

      {/* Balanced 2-Column Grid */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 items-start">
        {/* Left Column: Essential Store Cards & Previews */}
        <div className="space-y-6 lg:col-span-5">
          {/* Card 1: Shareable Storefront Link */}
          <section className="rounded-xl border border-border bg-card p-5 shadow-xs space-y-3">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-100 text-emerald-800 shrink-0">
                <Share2 className="h-4 w-4" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-foreground">
                  Tautan Etalase Katalog Toko
                </h2>
                <p className="text-xs text-muted-foreground">
                  Bagikan tautan ini ke pelanggan atau bio media sosial
                </p>
              </div>
            </div>

            <div className="rounded-lg border border-border bg-secondary/50 p-3 font-mono text-xs text-foreground break-all select-all">
              /store/{slug}
            </div>

            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                onClick={handleCopyStoreLink}
                className="flex-1 min-h-[40px] inline-flex items-center justify-center gap-1.5 rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-secondary transition-colors"
              >
                {copiedLink ? (
                  <>
                    <Check className="h-3.5 w-3.5 text-emerald-700" />
                    <span>Tersalin ke Clipboard</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5 text-muted-foreground" />
                    <span>Salin Alamat Lengkap</span>
                  </>
                )}
              </button>
              <Link
                href={`/store/${slug}`}
                target="_blank"
                className="inline-flex min-h-[40px] items-center justify-center gap-1.5 rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-secondary transition-colors"
              >
                <span>Lihat Toko</span>
                <ExternalLink className="h-3.5 w-3.5 text-muted-foreground" />
              </Link>
            </div>
          </section>

          {/* Card 2: Live Receipt & Invoice Preview */}
          <section className="rounded-xl border border-border bg-card p-5 shadow-xs space-y-3">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-800 shrink-0">
                  <Receipt className="h-4 w-4" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-foreground">
                    Pratinjau Struk Kasir & Nota WA
                  </h2>
                  <p className="text-[11px] text-muted-foreground">
                    Tampilan identitas toko pada nota belanja pembeli
                  </p>
                </div>
              </div>
            </div>

            {/* Receipt Simulation Box */}
            <div className="rounded-lg border border-dashed border-border bg-secondary/30 p-4 space-y-2 text-center">
              <p className="font-bold text-sm text-foreground uppercase tracking-wide">
                {name || "Nama Toko Anda"}
              </p>
              <p className="text-xs text-muted-foreground">
                {city ? city : "Kota Operasional"}
                {whatsappNumber ? ` • WA: ${whatsappNumber}` : ""}
              </p>
              {address && (
                <p className="text-[11px] text-muted-foreground max-w-xs mx-auto line-clamp-2">
                  {address}
                </p>
              )}
              <div className="border-t border-border/80 pt-2 text-[10px] text-muted-foreground font-mono">
                === STRUK RESMI PENJUALAN ===
              </div>
            </div>

            <p className="text-[11px] text-muted-foreground leading-relaxed flex items-start gap-1.5 pt-1">
              <Info className="h-3.5 w-3.5 shrink-0 text-primary mt-0.5" />
              <span>
                Nama toko, kota, dan alamat pada form di sebelah kanan akan
                otomatis tercetak pada struk kasir POS serta pesan WhatsApp pesanan.
              </span>
            </p>
          </section>

          {/* Card 3: Active Session & Role Access */}
          <section className="rounded-xl border border-border bg-card p-5 shadow-xs space-y-4">
            <div className="flex items-center gap-3 border-b border-border pb-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-100 text-emerald-800 shrink-0">
                <ShieldCheck className="h-4 w-4" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-foreground">
                  Akun & Hak Akses Sesi
                </h2>
                <p className="text-xs text-muted-foreground">
                  Identitas akun yang sedang masuk
                </p>
              </div>
            </div>

            <dl className="space-y-3 text-xs">
              <div>
                <dt className="font-medium text-muted-foreground">
                  Email Terdaftar
                </dt>
                <dd className="mt-0.5 font-mono text-xs font-semibold text-foreground break-all">
                  {currentUserEmail}
                </dd>
              </div>
              <div>
                <dt className="font-medium text-muted-foreground">
                  Peran di Toko Ini
                </dt>
                <dd className="mt-1">
                  <span className="inline-flex items-center rounded-md bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-900">
                    {roleMeta.label}
                  </span>
                </dd>
                <p className="mt-1 text-[11px] text-muted-foreground leading-relaxed">
                  {roleMeta.description}
                </p>
              </div>
              <div className="pt-2 border-t border-border flex items-center justify-between">
                <div>
                  <dt className="font-medium text-muted-foreground">
                    ID Tenant Toko
                  </dt>
                  <dd className="mt-0.5 font-mono text-[11px] text-muted-foreground truncate max-w-[200px]">
                    {store.id}
                  </dd>
                </div>
                <button
                  type="button"
                  onClick={handleCopyTenantId}
                  className="text-[11px] font-semibold text-primary hover:underline inline-flex items-center gap-1"
                >
                  {copiedId ? "Tersalin" : "Salin ID"}
                </button>
              </div>
            </dl>
          </section>

          {/* Card 4: Store Members & Team Roles */}
          <section className="rounded-xl border border-border bg-card p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 text-slate-800 shrink-0">
                  <Users className="h-4 w-4" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-foreground">
                    Anggota Tim Toko ({members.length})
                  </h2>
                  <p className="text-xs text-muted-foreground">
                    Akses operasional untuk kasir dan staf gudang
                  </p>
                </div>
              </div>
            </div>

            <div className="divide-y divide-border">
              {members.length === 0 ? (
                <p className="py-2 text-xs text-muted-foreground">
                  Belum ada anggota staf tambahan yang terdaftar pada toko ini.
                </p>
              ) : (
                members.map((member) => {
                  const displayIdentity =
                    member.fullName ||
                    member.email ||
                    `UID: ${member.userId.slice(0, 12)}...`;
                  return (
                    <div
                      key={member.id}
                      className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-foreground truncate">
                          {displayIdentity}
                        </p>
                        {member.email && member.fullName && (
                          <p className="text-[11px] font-mono text-muted-foreground truncate">
                            {member.email}
                          </p>
                        )}
                        <p className="text-[11px] text-muted-foreground">
                          Terdaftar{" "}
                          {new Date(member.createdAt).toLocaleDateString("id-ID", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                        </p>
                      </div>
                      {member.role === "owner" ? (
                        <span className="inline-flex items-center rounded-md bg-slate-900 px-2 py-0.5 text-xs font-semibold text-white self-start sm:self-center">
                          Pemilik Utama
                        </span>
                      ) : (
                        <div className="flex items-center gap-1.5 self-start sm:self-center">
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
                            className="min-h-[36px] rounded-lg border border-input bg-background px-2.5 py-1 text-xs font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
                          >
                            <option value="cashier">Kasir POS</option>
                            <option value="staff">Staf Gudang</option>
                          </select>
                          {canEditStore && (
                            <button
                              type="button"
                              disabled={isPending}
                              onClick={() =>
                                handleRemoveMember(member.id, displayIdentity)
                              }
                              aria-label={`Hapus akses ${displayIdentity}`}
                              title="Hapus akses karyawan"
                              className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border text-muted-foreground hover:bg-red-50 hover:text-red-700 hover:border-red-200 transition-colors disabled:opacity-50"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>

            {/* Form Tambah Karyawan / Hak Akses */}
            {canEditStore && (
              <form
                onSubmit={handleAddMember}
                className="pt-3 border-t border-border space-y-2.5"
              >
                <p className="text-xs font-bold text-foreground flex items-center gap-1.5">
                  <UserPlus className="h-3.5 w-3.5 text-emerald-700" />
                  <span>Tambah Karyawan / Hak Akses Baru</span>
                </p>
                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="email"
                    required
                    value={newMemberEmail}
                    onChange={(e) => setNewMemberEmail(e.target.value)}
                    placeholder="Email akun karyawan..."
                    className="flex-1 min-h-[40px] rounded-lg border border-input bg-background px-3 py-1.5 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                  <select
                    aria-label="Pilih peran karyawan baru"
                    value={newMemberRole}
                    onChange={(e) =>
                      setNewMemberRole(e.target.value as "cashier" | "staff")
                    }
                    className="min-h-[40px] rounded-lg border border-input bg-background px-2.5 py-1.5 text-xs font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  >
                    <option value="cashier">Kasir POS</option>
                    <option value="staff">Staf Gudang</option>
                  </select>
                  <button
                    type="submit"
                    disabled={isPending || !newMemberEmail.trim()}
                    className="inline-flex min-h-[40px] items-center justify-center gap-1.5 rounded-lg bg-emerald-700 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-emerald-800 transition-colors disabled:opacity-50"
                  >
                    <UserPlus className="h-3.5 w-3.5" />
                    <span>Tambah</span>
                  </button>
                </div>
                <p className="text-[11px] text-muted-foreground">
                  Pastikan karyawan sudah mendaftar akun di Niagarupa menggunakan email tersebut.
                </p>
              </form>
            )}

            {/* Quick Role Guide */}
            <div className="rounded-lg bg-secondary/50 p-3 text-[11px] text-muted-foreground space-y-1">
              <p className="font-semibold text-foreground">Panduan Hak Akses Tim:</p>
              <p>• <strong>Kasir</strong>: Membuka terminal kasir POS dan memproses pesanan masuk.</p>
              <p>• <strong>Staf</strong>: Menambah produk dan mencatat mutasi stok opname.</p>
              <p>• <strong>Pemilik</strong>: Memiliki akses penuh termasuk buku kas dan laporan laba rugi.</p>
            </div>
          </section>
        </div>

        {/* Right Column: Store Profile Configuration Form */}
        <div className="lg:col-span-7">
          <form
            onSubmit={handleSaveSettings}
            className="rounded-xl border border-border bg-card p-6 shadow-xs space-y-6"
          >
            <div className="flex items-center gap-3 border-b border-border pb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-100 text-emerald-800 shrink-0">
                <StoreIcon className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-foreground">
                  Profil & Konfigurasi Toko UMKM
                </h2>
                <p className="text-xs text-muted-foreground">
                  Perubahan data toko akan langsung diterapkan ke katalog publik dan kasir
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <div className="sm:col-span-2 space-y-1.5">
                <label
                  htmlFor="store-name"
                  className="block text-xs font-semibold text-foreground"
                >
                  Nama Usaha / Toko <span className="text-red-500">*</span>
                </label>
                <input
                  id="store-name"
                  type="text"
                  required
                  disabled={!canEditStore || isPending}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full min-h-[44px] rounded-lg border border-input bg-background px-3.5 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-60"
                  placeholder="Contoh: Kopi Seduh Nusantara"
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label
                    htmlFor="store-slug"
                    className="block text-xs font-semibold text-foreground"
                  >
                    Slug Tautan Etalase <span className="text-red-500">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={handleSyncSlugFromName}
                    className="text-[11px] font-semibold text-primary hover:underline inline-flex items-center gap-1"
                  >
                    <RefreshCw className="h-3 w-3" />
                    <span>Sesuaikan Nama</span>
                  </button>
                </div>
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

              <div className="space-y-1.5">
                <label
                  htmlFor="store-subsector"
                  className="block text-xs font-semibold text-foreground"
                >
                  Subsektor Ekonomi Kreatif <span className="text-red-500">*</span>
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

              <div className="space-y-1.5">
                <label
                  htmlFor="store-wa"
                  className="block text-xs font-semibold text-foreground"
                >
                  Nomor WhatsApp Penerima Pesanan <span className="text-red-500">*</span>
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
                <p className="text-[11px] text-muted-foreground">
                  Gunakan awalan 62 atau 08 untuk pengalihan otomatis pesanan.
                </p>
              </div>

              <div className="space-y-1.5">
                <label
                  htmlFor="store-city"
                  className="block text-xs font-semibold text-foreground"
                >
                  Kota / Kabupaten Operasional <span className="text-red-500">*</span>
                </label>
                <input
                  id="store-city"
                  type="text"
                  required
                  disabled={!canEditStore || isPending}
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="Contoh: Bandung, Sleman"
                  className="w-full min-h-[44px] rounded-lg border border-input bg-background px-3.5 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-60"
                />
              </div>

              <div className="sm:col-span-2 space-y-1.5">
                <label
                  htmlFor="store-address"
                  className="block text-xs font-semibold text-foreground"
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

              <div className="sm:col-span-2 space-y-1.5">
                <label
                  htmlFor="store-desc"
                  className="block text-xs font-semibold text-foreground"
                >
                  Deskripsi Singkat Toko & Cerita Karya
                </label>
                <textarea
                  id="store-desc"
                  rows={4}
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
                className="inline-flex min-h-[44px] items-center gap-2 rounded-lg bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground shadow-xs transition-colors hover:bg-primary/90 disabled:opacity-50"
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
