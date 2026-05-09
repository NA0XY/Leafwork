/** @type {import('next').NextConfig} */
const withBundleAnalyzer = require("@next/bundle-analyzer")({
  enabled: process.env.ANALYZE === "true"
});

const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? "https://leafworkpdf.vercel.app";

const securityHeaders = [
  { key: "X-DNS-Prefetch-Control", value: "on" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), browsing-topics=()"
  },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload"
  },
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://va.vercel-scripts.com",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com",
      "img-src 'self' data: blob:",
      "connect-src 'self' https://*.supabase.co https://api.groq.com https://*.upstash.io wss://*.supabase.co",
      "worker-src 'self' blob:",
      "frame-ancestors 'none'"
    ].join("; ")
  }
];

const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ["pdfjs-dist"],
  experimental: {
    serverComponentsExternalPackages: ["pdf-lib"],
    optimizePackageImports: ["lucide-react", "pdfjs-dist"]
  },
  env: {
    NEXT_PUBLIC_BASE_URL: baseUrl
  },
  generateBuildId: async () => process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 8) ?? "dev-build",
  images: {
    formats: ["image/avif", "image/webp"],
    unoptimized: false,
    remotePatterns: []
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: securityHeaders
      },
      {
        source: "/workers/(.*)",
        headers: [
          { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
          { key: "Cross-Origin-Embedder-Policy", value: "require-corp" },
          { key: "Cross-Origin-Opener-Policy", value: "same-origin" }
        ]
      },
      {
        source: "/_next/static/(.*)",
        headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }]
      }
    ];
  },
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.alias = {
        ...config.resolve.alias,
        canvas: false
      };
    }

    return config;
  }
};

module.exports = withBundleAnalyzer(nextConfig);
