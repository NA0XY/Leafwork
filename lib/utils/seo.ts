import type { Metadata } from "next";

const configuredBaseUrl = process.env.NEXT_PUBLIC_BASE_URL?.trim();

export const BASE_URL = configuredBaseUrl && configuredBaseUrl.length > 0 ? configuredBaseUrl : "https://leafworkpdf.vercel.app";

export const canonicalUrl = (path: string): string => {
  const safePath = path.startsWith("/") ? path : `/${path}`;
  return `${BASE_URL}${safePath}`;
};

export const ogImageUrl = (): string => `${BASE_URL}/opengraph-image`;

export type ToolFAQ = {
  q: string;
  a: string;
};

export type ToolSlug =
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

type ToolSEOEntry = {
  slug: ToolSlug;
  title: string;
  description: string;
  h1: string;
  keywords: string[];
  faq: ToolFAQ[];
};

export const TOOL_SEO_DATA: Record<ToolSlug, ToolSEOEntry> = {
  merge: {
    slug: "merge",
    title: "Merge PDF Files Online - Free, No Upload Required | Leafwork",
    description: "Combine multiple PDFs into one file in your browser with drag reorder and local export.",
    h1: "Merge PDF Files Instantly",
    keywords: ["merge pdf", "combine pdf", "join pdf online", "merge pdf no upload"],
    faq: [
      { q: "Do files upload while merging?", a: "No. Merge runs locally in your browser and downloads directly to your device." },
      { q: "Can I reorder files before export?", a: "Yes. Drag files into any order before merging." },
      { q: "Is there a file size limit?", a: "No enforced server limit because processing stays local." }
    ]
  },
  split: {
    slug: "split",
    title: "Split PDF Online - Extract Pages Free, No Upload | Leafwork",
    description: "Split by ranges, every N pages, or selected pages. Download results as files or ZIP.",
    h1: "Split PDF by Range or Page",
    keywords: ["split pdf", "extract pdf pages", "split pdf no upload"],
    faq: [
      { q: "Can I split by custom ranges?", a: "Yes. Use range mode for precise page slices." },
      { q: "Can I split every N pages?", a: "Yes. Choose the chunk size and export." },
      { q: "How are outputs downloaded?", a: "Multiple parts are packaged as a ZIP for one-click download." }
    ]
  },
  compress: {
    slug: "compress",
    title: "Compress PDF Online - Target File Size, No Upload | Leafwork",
    description: "Reduce PDF size with quality-aware compression and optional metadata stripping.",
    h1: "Compress PDF to a Target Size",
    keywords: ["compress pdf", "reduce pdf size", "compress pdf no upload"],
    faq: [
      { q: "Does compression upload my file?", a: "No. Compression is local-first and exports from your browser." },
      { q: "Can compression hurt readability?", a: "Aggressive targets can reduce quality; use the output metrics before sharing." },
      { q: "Can metadata be removed too?", a: "Yes. Metadata stripping is available in the tool options." }
    ]
  },
  "pdf-to-word": {
    slug: "pdf-to-word",
    title: "PDF to Word Converter - AI-assisted, Privacy-first | Leafwork",
    description: "Extract text locally and convert to editable Word-friendly output with AI assistance.",
    h1: "Convert PDF to Editable Word Output",
    keywords: ["pdf to word", "ai pdf conversion", "pdf text to docx"],
    faq: [
      { q: "Do you upload my PDF bytes?", a: "No. Extraction runs locally. AI receives extracted text only." },
      { q: "Can I export DOCX?", a: "Yes. Reflow and layout DOCX exports are supported." },
      { q: "Do I need login?", a: "AI conversion routes require authentication." }
    ]
  },
  "pdf-to-images": {
    slug: "pdf-to-images",
    title: "PDF to Images - PNG and JPG Export | Leafwork",
    description: "Convert selected pages to PNG or JPG with quality presets and ZIP download.",
    h1: "Convert PDF Pages to Images",
    keywords: ["pdf to images", "pdf to png", "pdf to jpg"],
    faq: [
      { q: "Can I choose pages?", a: "Yes. Select the exact pages you want to export." },
      { q: "Can I export JPG and PNG?", a: "Yes. Both output formats are available." },
      { q: "Can I download all at once?", a: "Yes. Use the ZIP option for bulk download." }
    ]
  },
  watermark: {
    slug: "watermark",
    title: "Watermark PDF - Text or Image, No Upload | Leafwork",
    description: "Add text or image watermarks with live preview and local PDF export.",
    h1: "Watermark PDF with Live Preview",
    keywords: ["watermark pdf", "add watermark to pdf", "pdf watermark no upload"],
    faq: [
      { q: "Can I preview watermark placement?", a: "Yes. Placement updates live before export." },
      { q: "Can I use an image watermark?", a: "Yes. PNG, JPG, and SVG are supported." },
      { q: "Does watermarking run locally?", a: "Yes. Processing stays in your browser." }
    ]
  },
  sign: {
    slug: "sign",
    title: "Sign PDF Online - Draw, Type, or Upload Signature | Leafwork",
    description: "Place signatures exactly where needed and download signed PDFs without uploads.",
    h1: "Sign PDF in Your Browser",
    keywords: ["sign pdf", "pdf signature", "draw signature pdf"],
    faq: [
      { q: "Can I move and resize signatures?", a: "Yes. Drag and resize before final export." },
      { q: "Can I sign specific pages?", a: "Yes. Navigate to any page and place signatures there." },
      { q: "Is signature data uploaded?", a: "No. Signature creation and placement remain local." }
    ]
  },
  redact: {
    slug: "redact",
    title: "Redact PDF Online - Remove Sensitive Data | Leafwork",
    description: "Draw redaction boxes on pages and export a redacted PDF locally.",
    h1: "Redact Sensitive PDF Content",
    keywords: ["redact pdf", "remove sensitive text", "pdf redaction"],
    faq: [
      { q: "Is redaction permanent in output?", a: "Yes. The exported file includes irreversible blacked-out regions." },
      { q: "Can I preview redactions?", a: "Yes. Draw redactions on page previews before export." },
      { q: "Does redaction require upload?", a: "No. It runs fully in your browser." }
    ]
  },
  rotate: {
    slug: "rotate",
    title: "Rotate PDF Pages - 90, 180, 270 Degrees | Leafwork",
    description: "Rotate all pages or selected pages with per-page controls, then download locally.",
    h1: "Rotate PDF Pages",
    keywords: ["rotate pdf", "rotate selected pages", "pdf orientation"],
    faq: [
      { q: "Can I rotate only selected pages?", a: "Yes. Select pages and set different rotations as needed." },
      { q: "Can I rotate all pages quickly?", a: "Yes. Use rotate-all mode for whole-document rotation." },
      { q: "Does this run in cloud?", a: "No. Rotation happens in your browser and downloads directly." }
    ]
  },
  "metadata-strip": {
    slug: "metadata-strip",
    title: "Strip PDF Metadata - Remove Hidden Info | Leafwork",
    description: "Remove author, producer, and hidden PDF metadata before sharing documents.",
    h1: "Remove PDF Metadata",
    keywords: ["strip metadata", "remove pdf metadata", "pdf privacy"],
    faq: [
      { q: "What metadata is removed?", a: "Common document metadata fields like author, creator, and producer." },
      { q: "Will visible page content change?", a: "No. Only hidden metadata fields are modified." },
      { q: "Does it upload files?", a: "No. Metadata cleanup runs locally." }
    ]
  },
  summarize: {
    slug: "summarize",
    title: "Summarize PDF with AI - Key Points and Actions | Leafwork",
    description: "Generate concise summaries with key figures and action items from extracted text.",
    h1: "Summarize PDF with AI",
    keywords: ["summarize pdf", "ai pdf summary", "document summary"],
    faq: [
      { q: "Is the full PDF uploaded?", a: "No. Text extraction runs locally first; AI gets extracted text only." },
      { q: "Can I export summary text?", a: "Yes. Copy to clipboard or download as a text file." },
      { q: "Do I need login?", a: "Yes. AI features require authentication." }
    ]
  }
};

export const getToolFaqs = (toolSlug: ToolSlug): ToolFAQ[] => TOOL_SEO_DATA[toolSlug].faq;

export const generateToolMetadata = (toolSlug: ToolSlug, descriptionOverride?: string): Metadata => {
  const entry = TOOL_SEO_DATA[toolSlug];
  const path = `/tools/${toolSlug}`;
  const description = descriptionOverride ?? entry.description;

  return {
    title: entry.title,
    description,
    keywords: entry.keywords,
    alternates: {
      canonical: canonicalUrl(path)
    },
    openGraph: {
      type: "website",
      title: entry.title,
      description,
      url: canonicalUrl(path),
      siteName: "Leafwork",
      images: [
        {
          url: ogImageUrl(),
          width: 1200,
          height: 630,
          alt: `Leafwork ${entry.h1}`
        }
      ]
    },
    twitter: {
      card: "summary_large_image",
      title: entry.title,
      description,
      images: [ogImageUrl()]
    }
  };
};

export const generateFAQSchema = (faqs: ToolFAQ[]): Record<string, unknown> => ({
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

export const generateSoftwareAppSchema = (toolSlug?: ToolSlug): Record<string, unknown> => {
  const tool = toolSlug ? TOOL_SEO_DATA[toolSlug] : null;

  return {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: tool ? `Leafwork ${tool.h1}` : "Leafwork PDF Tools",
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD"
    },
    description: tool?.description ?? "Free browser-based PDF tools. No uploads required for core tools.",
    url: tool ? canonicalUrl(`/tools/${tool.slug}`) : canonicalUrl("/"),
    featureList: [
      "Browser-based PDF processing",
      "Local-first document handling",
      "No uploads for core tools"
    ]
  };
};
