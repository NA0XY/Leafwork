/** @type {import('next').NextConfig} */
const withBundleAnalyzer = require("@next/bundle-analyzer")({
  enabled: process.env.ANALYZE === "true"
});

const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? "https://leafworkpdf.vercel.app";
const githubUrl = process.env.NEXT_PUBLIC_GITHUB_URL ?? "https://github.com/NA0XY/Leafwork";
const isProduction = process.env.NODE_ENV === "production";
const vercelCommitSha = process.env.VERCEL_GIT_COMMIT_SHA;
const scriptSources = ["'self'", "https://va.vercel-scripts.com"];
const developmentScriptSources = [...scriptSources, "'unsafe-eval'", "'unsafe-inline'"];
const cspScriptSources = isProduction ? scriptSources : developmentScriptSources;
const cspScriptElementSources = isProduction ? scriptSources : developmentScriptSources;

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
      `script-src ${cspScriptSources.join(" ")}`,
      `script-src-elem ${cspScriptElementSources.join(" ")}`,
      "script-src-attr 'none'",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com",
      "img-src 'self' data: blob:",
      "connect-src 'self' https://*.supabase.co https://api.groq.com https://*.upstash.io wss://*.supabase.co",
      "worker-src 'self' blob:",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "frame-ancestors 'none'"
    ].join("; ")
  }
];

const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ["pdfjs-dist"],
  serverExternalPackages: ["pdf-lib"],
  experimental: {
    optimizePackageImports: ["lucide-react", "pdfjs-dist"]
  },
  env: {
    NEXT_PUBLIC_BASE_URL: baseUrl,
    NEXT_PUBLIC_GITHUB_URL: githubUrl
  },
  ...(vercelCommitSha ? { generateBuildId: async () => vercelCommitSha.slice(0, 8) } : {}),
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
