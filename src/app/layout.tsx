import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? process.env.VERCEL_URL ?? "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(baseUrl.startsWith("http") ? baseUrl : `https://${baseUrl}`),
  title: "Nizamiye Öğrenci Yönetim Sistemi",
  description: "Nizamiye Medresesi Öğrenci Yönetim ve Eğitim Takip Sistemi",
  icons: {
    icon: "/favicon.png",
    shortcut: "/favicon.png",
    apple: "/favicon.png",
  },
  openGraph: {
    title: "Nizamiye Öğrenci Yönetim Sistemi",
    description: "Nizamiye Medresesi Öğrenci Yönetim ve Eğitim Takip Sistemi",
    siteName: "Nizamiye ÖYS",
    type: "website",
    images: [
      {
        url: "/favicon.png",
        width: 512,
        height: 512,
      },
    ],
  },
  twitter: {
    card: "summary",
    title: "Nizamiye Öğrenci Yönetim Sistemi",
    description: "Nizamiye Medresesi Öğrenci Yönetim ve Eğitim Takip Sistemi",
    images: ["/favicon.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="tr"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-background text-foreground">{children}</body>
    </html>
  );
}
