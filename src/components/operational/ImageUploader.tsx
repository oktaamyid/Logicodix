"use client";

import React, { useRef, useState } from "react";
import Image from "next/image";
import { Upload, X, RefreshCw, ImageIcon, AlertCircle } from "lucide-react";
import { uploadMediaImageAction } from "@/app/dashboard/upload/actions";

interface ImageUploaderProps {
  storeId: string;
  folder: "store" | "products";
  value: string | null | undefined;
  onChange: (url: string | null) => void;
  label: string;
  hint?: string;
  aspectRatio?: "square" | "banner";
  disabled?: boolean;
}

export function ImageUploader({
  storeId,
  folder,
  value,
  onChange,
  label,
  hint = "Format JPG, PNG, atau WebP (maks. 3 MB)",
  aspectRatio = "square",
  disabled = false,
}: ImageUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setErrorMsg(null);

    if (!["image/jpeg", "image/png", "image/webp", "image/gif"].includes(file.type)) {
      setErrorMsg("Format gambar harus JPG, PNG, WebP, atau GIF.");
      return;
    }

    if (file.size > 3 * 1024 * 1024) {
      setErrorMsg("Ukuran file maksimal 3 MB.");
      return;
    }

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("storeId", storeId);
      formData.append("folder", folder);
      formData.append("file", file);

      const res = await uploadMediaImageAction(formData);
      if (!res.success) {
        setErrorMsg(res.error);
        return;
      }

      onChange(res.data.url);
    } catch {
      setErrorMsg("Gagal mengunggah gambar. Periksa koneksi Anda.");
    } finally {
      setIsUploading(false);
      if (inputRef.current) {
        inputRef.current.value = "";
      }
    }
  }

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between gap-2">
        <label className="text-xs font-semibold text-foreground">{label}</label>
        {value && !disabled && (
          <button
            type="button"
            onClick={() => onChange(null)}
            className="text-[11px] font-medium text-red-600 hover:underline inline-flex items-center gap-1"
          >
            <X className="h-3 w-3" />
            <span>Hapus Foto</span>
          </button>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        onChange={handleFileChange}
        disabled={disabled || isUploading}
        className="hidden"
      />

      {value ? (
        <div
          className={`relative overflow-hidden rounded-xl border border-border bg-muted/30 group ${
            aspectRatio === "banner" ? "h-36 w-full" : "h-32 w-32"
          }`}
        >
          <Image
            src={value}
            alt={label}
            fill
            unoptimized
            className="object-cover"
          />
          {!disabled && (
            <button
              type="button"
              disabled={isUploading}
              onClick={() => inputRef.current?.click()}
              className="absolute inset-0 bg-slate-950/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1 text-white text-xs font-semibold"
            >
              {isUploading ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  <span>Mengunggah...</span>
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4" />
                  <span>Ganti Foto</span>
                </>
              )}
            </button>
          )}
        </div>
      ) : (
        <button
          type="button"
          disabled={disabled || isUploading}
          onClick={() => inputRef.current?.click()}
          className={`flex flex-col items-center justify-center gap-1.5 rounded-xl border-2 border-dashed border-border bg-muted/20 hover:bg-muted/40 hover:border-emerald-600/60 transition-colors text-center p-4 disabled:opacity-50 ${
            aspectRatio === "banner" ? "h-36 w-full" : "h-32 w-full"
          }`}
        >
          {isUploading ? (
            <>
              <RefreshCw className="h-5 w-5 animate-spin text-emerald-700" />
              <span className="text-xs font-medium text-foreground">
                Mengunggah ke Supabase Storage...
              </span>
            </>
          ) : (
            <>
              <div className="h-9 w-9 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
                <ImageIcon className="h-4 w-4" />
              </div>
              <span className="text-xs font-semibold text-foreground">
                Klik untuk Unggah Gambar
              </span>
              <span className="text-[11px] text-muted-foreground">{hint}</span>
            </>
          )}
        </button>
      )}

      {errorMsg && (
        <p className="text-[11px] text-red-600 flex items-center gap-1 mt-1">
          <AlertCircle className="h-3.5 w-3.5 shrink-0" />
          <span>{errorMsg}</span>
        </p>
      )}
    </div>
  );
}
