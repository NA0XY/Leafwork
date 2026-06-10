import type { Metadata, Viewport } from "next";
import { JetBrains_Mono, Space_Grotesk } from "next/font/google";

import "@/app/globals.css";
import { AnalyticsConsent } from "@/components/layout/AnalyticsConsent";
import { Footer } from "@/components/layout/Footer";
import { FeedbackWidget } from "@/components/layout/FeedbackWidget";
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

const configuredGoogleVerification = process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION?.trim();
const googleVerificationToken =
  configuredGoogleVerification && configuredGoogleVerification.toLowerCase() !== "pending"
    ? configuredGoogleVerification
    : "1kZrEcjYnhAxQ_UO6KTY8Wqhi2ooagh4B5C_-728uBw";

const siteTitle = "Leafwork - Free PDF Tools. No Upload Required.";
const siteDescription =
  "Free local-first PDF tools for merge, split, sign, redact, convert, and metadata cleanup workflows in your browser.";
const socialImageAlt = "Leafwork privacy-first PDF tools that run in your browser";

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  applicationName: "Leafwork",
  title: {
    default: siteTitle,
    template: "%s | Leafwork"
  },
  description: siteDescription,
  keywords: [
    "PDF tools",
    "merge PDF",
    "split PDF",
    "sign PDF",
    "redact PDF",
    "PDF metadata remover",
    "browser PDF editor"
  ],
  category: "productivity",
  creator: "Leafwork",
  publisher: "Leafwork",
  alternates: {
    canonical: canonicalUrl("/")
  },
  openGraph: {
    title: siteTitle,
    description: siteDescription,
    url: canonicalUrl("/"),
    siteName: "Leafwork",
    type: "website",
    locale: "en_US",
    images: [
      {
        url: ogImageUrl(),
        width: 1200,
        height: 630,
        alt: socialImageAlt
      }
    ]
  },
  twitter: {
    card: "summary_large_image",
    title: siteTitle,
    description: siteDescription,
    images: [
      {
        url: canonicalUrl("/twitter-image"),
        width: 1200,
        height: 630,
        alt: socialImageAlt
      }
    ]
  },
  verification: {
    google: googleVerificationToken
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
        <FeedbackWidget />
        <GlobalProcessingOverlay />
        <ToastViewport />
        <AnalyticsConsent />
      </body>
    </html>
  );
}
