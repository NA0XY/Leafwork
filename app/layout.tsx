import type { Metadata, Viewport } from "next";
import { JetBrains_Mono, Space_Grotesk } from "next/font/google";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";

import "@/app/globals.css";
import { Footer } from "@/components/layout/Footer";
import { GlobalProcessingOverlay } from "@/components/layout/GlobalProcessingOverlay";
import { Header } from "@/components/layout/Header";
import { PrivacyBadge } from "@/components/layout/PrivacyBadge";
import { AppErrorBoundary } from "@/components/layout/AppErrorBoundary";
import { ToastViewport } from "@/components/ui/ToastViewport";
import { BASE_URL, canonicalUrl, ogImageUrl } from "@/lib/utils/seo";

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space-grotesk"
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains-mono"
});

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  applicationName: "Leafwork",
  title: {
    default: "Leafwork - Free PDF Tools. No Upload Required.",
    template: "%s | Leafwork"
  },
  description: "Free browser-based PDF tools for merge, split, compress, sign, redact, and AI document workflows.",
  alternates: {
    canonical: canonicalUrl("/")
  },
  openGraph: {
    title: "Leafwork - Free PDF Tools. No Upload Required.",
    description: "Merge, split, compress, sign, redact, and convert PDFs in a privacy-first workflow.",
    url: canonicalUrl("/"),
    siteName: "Leafwork",
    type: "website",
    images: [
      {
        url: ogImageUrl(),
        width: 1200,
        height: 630,
        alt: "Leafwork PDF Tools"
      }
    ]
  },
  twitter: {
    card: "summary_large_image",
    title: "Leafwork - Free PDF Tools. No Upload Required.",
    description: "Privacy-first PDF tools that run in your browser.",
    images: [ogImageUrl()]
  },
  verification: {
    google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION ?? "1kZrEcjYnhAxQ_UO6KTY8Wqhi2ooagh4B5C_-728uBw"
  },
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/favicon-48x48.png", type: "image/png", sizes: "48x48" },
      { url: "/favicon.svg", type: "image/svg+xml" }
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
    shortcut: "/favicon.ico"
  }
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#1a6b3c"
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${spaceGrotesk.variable} ${jetbrainsMono.variable}`}>
      <body className="min-h-screen bg-paper font-sans text-ink">
        <a href="#main-content" className="skip-link">
          Skip to content
        </a>
        <Header />
        <PrivacyBadge />
        <AppErrorBoundary>
          <main id="main-content" className="mx-auto min-h-[70vh] w-full max-w-7xl px-4 py-6">
            {children}
          </main>
        </AppErrorBoundary>
        <Footer />
        <GlobalProcessingOverlay />
        <ToastViewport />
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
