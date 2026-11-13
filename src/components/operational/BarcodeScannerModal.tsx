"use client";

import React, { useEffect, useId, useRef, useState } from "react";
import {
  Camera,
  RefreshCw,
  X,
  AlertCircle,
  CheckCircle2,
  ScanLine,
  Zap,
  ZapOff,
} from "lucide-react";
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
 * Modal pemindai barcode (EAN-13, EAN-8, UPC, Code-128, Code-39) dan QR code berbasis kamera browser.
 * Dioptimalkan dengan:
 * - Formats eksplisit retail barcode & QR
 * - Hardware BarcodeDetector native jika didukung browser (kecepatan & akurasi tinggi)
 * - Resolusi HD (1280x720) dengan focusMode continuous
 * - Dynamic QR box 75% lebar viewfinder untuk kemudahan bidik
 * - Dukungan senter (torch / flashlight) jika perangkat mendukung
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
  const [flashSuccess, setFlashSuccess] = useState<boolean>(false);
  const [torchSupported, setTorchSupported] = useState<boolean>(false);
  const [isTorchOn, setIsTorchOn] = useState<boolean>(false);

  const onScanSuccessRef = useRef(onScanSuccess);
  const onCloseRef = useRef(onClose);
  const lastScanTimeRef = useRef<number>(0);
  const lastScanCodeRef = useRef<string>("");
  const flashTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const scannerInstanceRef = useRef<any>(null);

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
    return () => {
      if (flashTimerRef.current) {
        clearTimeout(flashTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!isOpen) {
      setErrorMessage(null);
      setLastScanned(null);
      setFlashSuccess(false);
      setTorchSupported(false);
      setIsTorchOn(false);
      return;
    }

    let isCancelled = false;

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

        const { Html5Qrcode, Html5QrcodeSupportedFormats } = await import("html5-qrcode");
        if (isCancelled) return;

        // Ambil daftar kamera yang tersedia
        try {
          const devices = await Html5Qrcode.getCameras();
          const availableCameras = devices.map((d, idx) => ({
            id: d.id,
            label: d.label || `Kamera ${idx + 1}`,
          }));
          if (!isCancelled) {
            setCameras(availableCameras);
          }
        } catch {
          // Lanjutkan jika enumerasi kamera tidak didukung
        }

        if (isCancelled) return;

        // Inisialisasi scanner dengan format retail barcode lengkap & native BarcodeDetector
        const supportedFormats = [
          Html5QrcodeSupportedFormats.EAN_13,
          Html5QrcodeSupportedFormats.EAN_8,
          Html5QrcodeSupportedFormats.CODE_128,
          Html5QrcodeSupportedFormats.CODE_39,
          Html5QrcodeSupportedFormats.UPC_A,
          Html5QrcodeSupportedFormats.UPC_E,
          Html5QrcodeSupportedFormats.QR_CODE,
          Html5QrcodeSupportedFormats.DATA_MATRIX,
        ];

        const scanner = new Html5Qrcode(readerId, {
          formatsToSupport: supportedFormats,
          useBarCodeDetectorIfSupported: true,
          verbose: false,
        });
        scannerInstanceRef.current = scanner;

        // Konfigurasi target kamera dengan preferensi resolusi HD & fokus otomatis
        const cameraConfig = selectedCameraId
          ? {
              deviceId: { exact: selectedCameraId },
              width: { ideal: 1280 },
              height: { ideal: 720 },
              focusMode: "continuous",
            }
          : {
              facingMode: "environment",
              width: { ideal: 1280 },
              height: { ideal: 720 },
              focusMode: "continuous",
            };

        await scanner.start(
          cameraConfig,
          {
            fps: 15,
            qrbox: (viewfinderWidth: number, viewfinderHeight: number) => {
              // Kotak bidik responsif: 75% lebar viewfinder agar barcode panjang mudah masuk
              const minEdge = Math.min(viewfinderWidth, viewfinderHeight);
              const boxWidth = Math.max(220, Math.floor(viewfinderWidth * 0.75));
              const boxHeight = Math.max(140, Math.floor(minEdge * 0.5));
              return { width: boxWidth, height: boxHeight };
            },
            aspectRatio: 1.333334,
            disableFlip: false,
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

            // Trigger indikator visual sukses scan
            setLastScanned(cleanCode);
            setFlashSuccess(true);
            if (flashTimerRef.current) {
              clearTimeout(flashTimerRef.current);
            }
            flashTimerRef.current = setTimeout(() => {
              setFlashSuccess(false);
            }, 1800);

            onScanSuccessRef.current(cleanCode);

            if (!continuous) {
              onCloseRef.current();
            }
          },
          () => {
            // Abaikan error individual per frame saat mencari barcode
          }
        );

        // Periksa apakah perangkat mendukung senter (torch)
        try {
          const capabilities = scanner.getRunningTrackCameraCapabilities();
          const torchFeature = capabilities?.torchFeature();
          if (torchFeature && torchFeature.isSupported()) {
            setTorchSupported(true);
          }
        } catch {
          setTorchSupported(false);
        }

        if (isCancelled && scanner) {
          try {
            if (scanner.isScanning) {
              await scanner.stop();
            }
            scanner.clear();
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
      const scanner = scannerInstanceRef.current;
      if (scanner) {
        Promise.resolve()
          .then(async () => {
            if (scanner.isScanning) {
              await scanner.stop();
            }
            scanner.clear();
            scannerInstanceRef.current = null;
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

  const handleToggleTorch = async () => {
    const scanner = scannerInstanceRef.current;
    if (!scanner) return;
    try {
      const capabilities = scanner.getRunningTrackCameraCapabilities();
      const torch = capabilities?.torchFeature();
      if (torch && torch.isSupported()) {
        const nextState = !isTorchOn;
        await torch.apply(nextState);
        setIsTorchOn(nextState);
      }
    } catch {
      // Abaikan jika tidak didukung browser saat ini
    }
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

        {/* Petunjuk Arah Pemindaian */}
        <div className="px-4 py-2 bg-muted/40 border-b flex items-center gap-2 text-xs text-muted-foreground">
          <ScanLine className="h-4 w-4 text-emerald-700 shrink-0" />
          <span>
            Posisikan barcode atau QR di dalam kotak bidik. Pastikan pencahayaan cukup dan gambar tidak goyang.
          </span>
        </div>

        {/* Viewport Kamera */}
        <div className="p-4 space-y-3">
          <div className="relative rounded-xl overflow-hidden bg-slate-950 border min-h-[260px] flex items-center justify-center">
            <div id={readerId} className="w-full" />

            {/* Flash Overlay saat barcode berhasil terbaca */}
            {flashSuccess && (
              <div
                aria-live="polite"
                className="absolute inset-0 bg-emerald-500/25 border-4 border-emerald-500 rounded-xl flex items-center justify-center transition-all duration-300 pointer-events-none z-20"
              >
                <div className="px-3.5 py-1.5 rounded-full bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-lg animate-in zoom-in-90">
                  <CheckCircle2 className="h-4 w-4" />
                  <span>Barcode Berhasil Terbaca</span>
                </div>
              </div>
            )}

            {isStarting && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/80 text-white gap-2 p-4 text-center z-10">
                <RefreshCw className="h-6 w-6 animate-spin text-emerald-400" />
                <p className="text-xs font-medium">Menyiapkan kamera HD...</p>
              </div>
            )}

            {errorMessage && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950 text-white gap-3 p-6 text-center z-10">
                <AlertCircle className="h-8 w-8 text-amber-400 shrink-0" />
                <p className="text-xs leading-relaxed text-slate-200">{errorMessage}</p>
              </div>
            )}
          </div>

          {/* Notifikasi Hijau Hasil Scan */}
          {lastScanned ? (
            <div
              role="status"
              className="flex items-center justify-between gap-2 p-3 rounded-xl bg-emerald-50 border-2 border-emerald-400 text-emerald-950 text-xs shadow-sm animate-in fade-in-50 duration-200"
            >
              <div className="flex items-center gap-2 min-w-0">
                <div className="h-6 w-6 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0">
                  <CheckCircle2 className="h-4 w-4" />
                </div>
                <div className="truncate">
                  <span className="font-semibold text-emerald-900 block text-[11px]">
                    Barcode Berhasil Terdeteksi
                  </span>
                  <span className="font-mono font-bold text-emerald-800 text-xs">
                    {lastScanned}
                  </span>
                </div>
              </div>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-200 text-emerald-900 shrink-0">
                Tercatat
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-2 p-2.5 rounded-xl bg-muted/60 border text-muted-foreground text-xs">
              <ScanLine className="h-4 w-4 text-muted-foreground shrink-0" />
              <span>Menunggu barcode di depan kamera...</span>
            </div>
          )}

          {/* Controls */}
          <div className="flex items-center justify-between gap-2 pt-1">
            <div className="flex items-center gap-1.5">
              {cameras.length > 1 && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCycleCamera}
                  className="min-h-[44px] gap-1.5 text-xs"
                >
                  <RefreshCw className="h-4 w-4" />
                  <span>Kamera ({cameras.length})</span>
                </Button>
              )}

              {torchSupported && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleToggleTorch}
                  className="min-h-[44px] gap-1.5 text-xs"
                  title={isTorchOn ? "Matikan Lampu Senter" : "Nyalakan Lampu Senter"}
                >
                  {isTorchOn ? (
                    <>
                      <ZapOff className="h-4 w-4 text-amber-500" />
                      <span>Senter Mati</span>
                    </>
                  ) : (
                    <>
                      <Zap className="h-4 w-4 text-muted-foreground" />
                      <span>Senter</span>
                    </>
                  )}
                </Button>
              )}
            </div>

            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="min-h-[44px] px-5 text-xs font-semibold ml-auto"
            >
              Selesai
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
