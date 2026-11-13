import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Niagarupa: Kasir POS, Etalase Publik, dan Buku Kas UMKM Lokal",
  description:
    "Karya Berdaya, Niaga Tertata. Platform operasional kasir, perhitungan HPP, katalog pesanan WhatsApp, dan laporan laba rugi untuk pelaku UMKM Nusantara.",
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
