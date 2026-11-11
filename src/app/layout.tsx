import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Niagarupa — Platform Terpadu Digitalisasi UMKM & Ekonomi Kreatif Lokal",
  description:
    "Karya Berdaya, Niaga Tertata. Solusi All-in-One: Digitalisasi Operasional (POS & Inventori), Akses Pasar (Katalog & Direktori Kreatif), dan Optimasi Manajemen Bisnis.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" className={inter.variable}>
      <body className="min-h-screen bg-background font-sans antialiased text-foreground">
        {children}
      </body>
    </html>
  );
}
