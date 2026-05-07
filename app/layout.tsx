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

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space-grotesk"
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains-mono"
});

export const metadata: Metadata = {
  title: "Leafwork - Local-first PDF workspace",
  description: "Free local PDF tools where files never leave your browser."
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
