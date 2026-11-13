import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Niagarupa: Kasir POS, Etalase Publik, dan Buku Kas UMKM Lokal",
    template: "%s | Niagarupa",
  },
  description:
    "Karya Berdaya, Niaga Tertata. Platform operasional kasir, perhitungan HPP, katalog pesanan WhatsApp, dan laporan laba rugi untuk pelaku UMKM Nusantara.",
  icons: {
    icon: [
      { url: "/icon.svg", type: "image/svg+xml" },
    ],
    apple: [
      { url: "/apple-icon.svg", type: "image/svg+xml" },
    ],
    shortcut: ["/icon.svg"],
  },
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
