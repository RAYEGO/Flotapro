import type { Metadata } from "next";
import { Inter, Roboto_Mono } from "next/font/google";
import "./globals.css";

const sans = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
});

const mono = Roboto_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "FlotaPro | Gestión Inteligente de Flotas",
  description: "SaaS para control de camiones, fletes, combustible y mantenimiento en Perú.",
  icons: {
    icon: [
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/icon-192x192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512x512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: "/apple-touch-icon.png",
  },
  manifest: "/site.webmanifest",
  themeColor: "#0b3c5d",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "FlotaPro",
  },
  metadataBase: new URL("https://flotapro-rosy.vercel.app"),
  openGraph: {
    title: "FlotaPro | Gestión Inteligente de Flotas",
    description: "Controla tus camiones y aumenta tu rentabilidad.",
    url: "https://flotapro-rosy.vercel.app",
    siteName: "FlotaPro",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "FlotaPro - SaaS para transportistas",
      },
    ],
    locale: "es_PE",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "FlotaPro | Gestión Inteligente de Flotas",
    description: "Controla tus camiones, fletes y mantenimiento desde un solo lugar.",
    images: ["/og-image.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body
        className={`${sans.variable} ${mono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
