import type { Metadata, Viewport } from "next";
import { Analytics } from "@vercel/analytics/next"
import { Geist, Geist_Mono } from "next/font/google";
import { BASE_URL } from "@/lib/seo";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  title: {
    default: "RomeiroGPS - Mapa de turismo em Aparecida - SP",
    template: "%s | RomeiroGPS",
  },
  description:
    "RomeiroGPS: mapa de pontos de interesse, rotas e caravanas em Aparecida - SP. Encontre o Santuário Nacional, pontos de turismo religioso, apoio ao romeiro, saúde, transporte e lazer.",
  applicationName: "RomeiroGPS",
  keywords: [
    "Aparecida SP",
    "Santuário Nacional",
    "Caminho da Fé",
    "caravana",
    "turismo religioso",
    "ponto de encontro",
    "basílica de Aparecida",
    "mapa de Aparecida",
  ],
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    url: "/",
    siteName: "RomeiroGPS",
    title: "RomeiroGPS - Mapa de turismo em Aparecida - SP",
    description:
      "Mapa de pontos de interesse, rotas e caravanas em Aparecida - SP. Encontre o Santuário Nacional, pontos de turismo religioso, apoio ao romeiro e mais.",
    locale: "pt_BR",
  },
  twitter: {
    card: "summary_large_image",
    title: "RomeiroGPS - Mapa de turismo em Aparecida - SP",
    description:
      "Mapa de pontos de interesse, rotas e caravanas em Aparecida - SP.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#1d4ed8",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="pt-BR"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <Analytics />
      <body className="flex min-h-full flex-col">{children}</body>
    </html>
  );
}
