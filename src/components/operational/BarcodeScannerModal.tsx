"use client";

import React, { useEffect, useId, useRef, useState } from "react";
import { Camera, RefreshCw, X, AlertCircle, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface BarcodeScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScanSuccess: (decodedText: string) => void;
  title?: string;
  description?: string;
  continuous?: boolean;
}

interface CameraDevice {
  id: string;
  label: string;
}

/**
 * Modal pemindai barcode (EAN-13, UPC, Code-128) dan QR code berbasis kamera browser.
 * Berjalan 100% di sisi klien menggunakan html5-qrcode tanpa dependensi server.
 */
export function BarcodeScannerModal({
  isOpen,
  onClose,
  onScanSuccess,
  title = "Scan Barcode / QR Produk",
  description = "Arahkan kamera ke barcode atau QR code pada kemasan produk.",
  continuous = false,
}: BarcodeScannerModalProps) {
  const rawId = useId();
  const readerId = `barcode-reader-${rawId.replace(/:/g, "")}`;

  const [cameras, setCameras] = useState<CameraDevice[]>([]);
  const [selectedCameraId, setSelectedCameraId] = useState<string>("");
  const [isStarting, setIsStarting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [lastScanned, setLastScanned] = useState<string | null>(null);

  const onScanSuccessRef = useRef(onScanSuccess);
  const onCloseRef = useRef(onClose);
  const lastScanTimeRef = useRef<number>(0);
  const lastScanCodeRef = useRef<string>("");

  useEffect(() => {
    onScanSuccessRef.current = onScanSuccess;
  }, [onScanSuccess]);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  // Tutup modal dengan tombol Escape
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onCloseRef.current();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) {
      setErrorMessage(null);
      setLastScanned(null);
      return;
    }

    let isCancelled = false;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let scannerInstance: any = null;

    const startScanner = async () => {
      setIsStarting(true);
      setErrorMessage(null);

      try {
        if (
          typeof window !== "undefined" &&
          !window.isSecureContext &&
          window.location.hostname !== "localhost" &&
          window.location.hostname !== "127.0.0.1"
        ) {
          throw new Error(
            "Akses kamera memerlukan koneksi aman (HTTPS) atau dijalankan di localhost."
          );
        }

        const { Html5Qrcode } = await import("html5-qrcode");
        if (isCancelled) return;

        // Ambil daftar kamera yang tersedia
        let availableCameras: CameraDevice[] = [];
        try {
          const devices = await Html5Qrcode.getCameras();
          availableCameras = devices.map((d, idx) => ({
            id: d.id,
            label: d.label || `Kamera ${idx + 1}`,
          }));
          if (!isCancelled) {
            setCameras(availableCameras);
          }
        } catch {
          // Lanjutkan dengan facingMode environment jika enumerasi gagal
        }

        if (isCancelled) return;

        scannerInstance = new Html5Qrcode(readerId);

        const cameraConfig: string | { facingMode: string } = selectedCameraId
          ? selectedCameraId
          : { facingMode: "environment" };

        await scannerInstance.start(
          cameraConfig,
          {
            fps: 10,
            qrbox: { width: 260, height: 150 },
            aspectRatio: 1.333334,
          },
          (decodedText: string) => {
            const cleanCode = decodedText.trim();
            if (!cleanCode) return;

            const now = Date.now();
            // Hindari pembacaan ganda beruntun dalam 1.2 detik untuk kode yang sama
            if (
              cleanCode === lastScanCodeRef.current &&
              now - lastScanTimeRef.current < 1200
            ) {
              return;
            }
            lastScanCodeRef.current = cleanCode;
            lastScanTimeRef.current = now;

            setLastScanned(cleanCode);
            onScanSuccessRef.current(cleanCode);

            if (!continuous) {
              onCloseRef.current();
            }
          },
          () => {
            // Abaikan error frame individual saat kamera mencari barcode
          }
        );

        if (isCancelled && scannerInstance) {
          try {
            if (scannerInstance.isScanning) {
              await scannerInstance.stop();
            }
            scannerInstance.clear();
          } catch {
            // Abaikan error cleanup
          }
        }
      } catch (err: unknown) {
        if (isCancelled) return;
        const rawMsg = err instanceof Error ? err.message : String(err);
        if (
          rawMsg.toLowerCase().includes("permission") ||
          rawMsg.toLowerCase().includes("notallowed")
        ) {
          setErrorMessage(
            "Izin kamera ditolak oleh browser. Aktifkan izin kamera pada ikon gembok di bilah alamat browser Anda, lalu coba lagi."
          );
        } else if (
          rawMsg.toLowerCase().includes("notfound") ||
          rawMsg.toLowerCase().includes("no camera")
        ) {
          setErrorMessage(
            "Kamera tidak ditemukan pada perangkat ini. Pastikan kamera terpasang atau gunakan scanner barcode USB."
          );
        } else {
          setErrorMessage(
            rawMsg || "Gagal mengaktifkan kamera. Pastikan tidak ada aplikasi lain yang sedang memakai kamera."
          );
        }
      } finally {
        if (!isCancelled) {
          setIsStarting(false);
        }
      }
    };

    startScanner();

    return () => {
      isCancelled = true;
      if (scannerInstance) {
        Promise.resolve()
          .then(async () => {
            if (scannerInstance.isScanning) {
              await scannerInstance.stop();
            }
            scannerInstance.clear();
          })
          .catch(() => {
            // Abaikan error saat menutup kamera
          });
      }
    };
  }, [isOpen, readerId, selectedCameraId, continuous]);

  if (!isOpen) return null;

  const handleCycleCamera = () => {
    if (cameras.length <= 1) return;
    const currentIndex = cameras.findIndex((c) => c.id === selectedCameraId);
    const nextIndex = (currentIndex + 1) % cameras.length;
    setSelectedCameraId(cameras[nextIndex].id);
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <div className="bg-card border rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in-50 zoom-in-95">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <Camera className="h-4 w-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-foreground">{title}</h3>
              <p className="text-xs text-muted-foreground">{description}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup pemindai kamera"
            className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Viewport Kamera */}
        <div className="p-4 space-y-3">
          <div className="relative rounded-xl overflow-hidden bg-slate-950 border min-h-[260px] flex items-center justify-center">
            <div id={readerId} className="w-full" />

            {isStarting && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/80 text-white gap-2 p-4 text-center">
                <RefreshCw className="h-6 w-6 animate-spin text-emerald-400" />
                <p className="text-xs font-medium">Menyiapkan kamera...</p>
              </div>
            )}

            {errorMessage && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950 text-white gap-3 p-6 text-center">
                <AlertCircle className="h-8 w-8 text-amber-400 shrink-0" />
                <p className="text-xs leading-relaxed text-slate-200">{errorMessage}</p>
              </div>
            )}
          </div>

          {lastScanned && (
            <div className="flex items-center gap-2 p-2.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs">
              <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-700" />
              <span className="truncate">
                Terbaca: <strong className="font-mono">{lastScanned}</strong>
              </span>
            </div>
          )}

          {/* Controls */}
          <div className="flex items-center justify-between gap-2 pt-1">
            {cameras.length > 1 ? (
              <Button
                type="button"
                variant="outline"
                onClick={handleCycleCamera}
                className="min-h-[44px] gap-1.5 text-xs"
              >
                <RefreshCw className="h-4 w-4" />
                <span>Ganti Kamera ({cameras.length})</span>
              </Button>
            ) : (
              <span className="text-[11px] text-muted-foreground">
                Mendukung EAN-13, UPC, Code-128, dan QR.
              </span>
            )}

            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="min-h-[44px] px-5 text-xs font-semibold"
            >
              Selesai
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
