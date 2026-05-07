const withBundleAnalyzer = require("@next/bundle-analyzer")({
  enabled: process.env.ANALYZE === "true"
});

const isDevelopment = process.env.NODE_ENV === "development";

const buildContentSecurityPolicy = () => {
  const scriptSrc = ["'self'", "'unsafe-inline'", "https://va.vercel-scripts.com", "https://cdn.jsdelivr.net"];
  if (isDevelopment) {
    scriptSrc.push("'unsafe-eval'");
  }

  const connectSrc = [
    "'self'",
    "https://*.supabase.co",
    "https://api.groq.com",
    "https://*.upstash.io",
    "https://cdn.jsdelivr.net",
    "https://vitals.vercel-insights.com",
    "https://vitals.vercel-analytics.com"
  ];
  if (isDevelopment) {
    connectSrc.push("ws:", "wss:");
  }

  return [
    "default-src 'self'",
    `script-src ${scriptSrc.join(" ")}`,
    `script-src-elem ${scriptSrc.join(" ")}`,
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com data:",
    "img-src 'self' blob: data:",
    `connect-src ${connectSrc.join(" ")}`,
    "worker-src 'self' blob: https://cdn.jsdelivr.net",
    "object-src 'none'",
    "base-uri 'self'",
    "frame-ancestors 'none'",
    "form-action 'self'"
  ].join("; ");
};

const securityHeaders = [
  {
    key: "Content-Security-Policy",
    value: buildContentSecurityPolicy()
  },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" }
];

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  transpilePackages: ["pdfjs-dist"],
  experimental: {
    serverComponentsExternalPackages: ["pdf-lib"],
    optimizePackageImports: ["lucide-react", "pdfjs-dist"]
  },
  images: {
    domains: [],
    unoptimized: false,
    formats: ["image/avif", "image/webp"]
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: securityHeaders
      }
    ];
  }
};

module.exports = withBundleAnalyzer(nextConfig);
