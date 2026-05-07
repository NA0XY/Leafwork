import type { Metadata } from "next";

const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000";

export type ToolName =
  | "merge"
  | "split"
  | "compress"
  | "pdf-to-word"
  | "pdf-to-images"
  | "watermark"
  | "sign"
  | "redact"
  | "rotate"
  | "metadata-strip"
  | "summarize";

export const toolDescriptions: Record<ToolName, { title: string; description: string; keywords: string[] }> = {
  merge: {
    title: "Merge PDF Files Free",
    description: "Combine multiple PDFs locally in your browser.",
    keywords: ["merge pdf", "combine pdf", "free pdf merger"]
  },
  split: {
    title: "Split PDF Online No Upload",
    description: "Split PDF pages in-browser without uploading your files.",
    keywords: ["split pdf", "extract pages", "local pdf tools"]
  },
  compress: {
    title: "Compress PDF No Upload",
    description: "Reduce PDF size while preserving readability in your browser.",
    keywords: ["compress pdf", "reduce pdf size", "compress pdf no upload"]
  },
  "pdf-to-word": {
    title: "PDF to Word AI",
    description: "Convert extracted PDF text into clean markdown and editable output.",
    keywords: ["pdf to word", "ai pdf converter", "groq pdf"]
  },
  "pdf-to-images": {
    title: "PDF to Images",
    description: "Render PDF pages into image previews and exports.",
    keywords: ["pdf to png", "pdf to images", "pdf preview"]
  },
  watermark: {
    title: "Watermark PDF",
    description: "Add text or image watermarks to every page.",
    keywords: ["watermark pdf", "pdf branding", "stamp pdf"]
  },
  sign: {
    title: "Sign PDF",
    description: "Create and place signatures directly in your browser.",
    keywords: ["sign pdf", "draw signature", "free pdf signer"]
  },
  redact: {
    title: "Redact PDF",
    description: "Mask sensitive regions and export a redacted PDF.",
    keywords: ["redact pdf", "hide text", "secure pdf"]
  },
  rotate: {
    title: "Rotate PDF",
    description: "Rotate single pages or full documents quickly.",
    keywords: ["rotate pdf", "turn pdf", "pdf orientation"]
  },
  "metadata-strip": {
    title: "Strip PDF Metadata",
    description: "Remove metadata before sharing PDF documents.",
    keywords: ["remove metadata", "privacy pdf", "clean pdf"]
  },
  summarize: {
    title: "Summarize PDF with AI",
    description: "Extract text locally and generate concise summaries with optional action items.",
    keywords: ["pdf summary", "summarize pdf", "ai document summary"]
  }
};

export const canonicalUrl = (path: string): string => {
  const safePath = path.startsWith("/") ? path : `/${path}`;
  return new URL(safePath, baseUrl).toString();
};

export const ogImageUrl = (title: string): string => {
  const url = new URL("/api/og", baseUrl);
  url.searchParams.set("title", title);
  return url.toString();
};

export const generateToolMetadata = (toolName: ToolName, descriptionOverride?: string): Metadata => {
  const data = toolDescriptions[toolName];
  const description = descriptionOverride ?? data.description;
  const path = `/tools/${toolName}`;

  return {
    title: `${data.title} | Leafwork`,
    description,
    keywords: data.keywords,
    alternates: {
      canonical: canonicalUrl(path)
    },
    openGraph: {
      title: data.title,
      description,
      type: "website",
      url: canonicalUrl(path),
      images: [
        {
          url: ogImageUrl(data.title),
          alt: data.title
        }
      ]
    },
    twitter: {
      card: "summary_large_image",
      title: data.title,
      description,
      images: [ogImageUrl(data.title)]
    }
  };
};

export const generateFAQSchema = (faqs: { q: string; a: string }[]): object => ({
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: faqs.map((faq) => ({
    "@type": "Question",
    name: faq.q,
    acceptedAnswer: {
      "@type": "Answer",
      text: faq.a
    }
  }))
});

export const generateSoftwareAppSchema = (): object => ({
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "Leafwork",
  applicationCategory: "BusinessApplication",
  operatingSystem: "Web",
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "USD"
  },
  description: "Local-first PDF workspace with zero-upload tools.",
  url: baseUrl
});
