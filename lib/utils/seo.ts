import type { Metadata } from "next";

import { getToolFeatureState } from "@/lib/config/features";

const configuredBaseUrl = process.env.NEXT_PUBLIC_BASE_URL?.trim();
const configuredGithubUrl = process.env.NEXT_PUBLIC_GITHUB_URL?.trim();

export const BASE_URL = configuredBaseUrl && configuredBaseUrl.length > 0 ? configuredBaseUrl : "https://leafworkpdf.vercel.app";
export const GITHUB_URL = configuredGithubUrl && configuredGithubUrl.length > 0 ? configuredGithubUrl : "https://github.com/NA0XY/Leafwork";

export const canonicalUrl = (path: string): string => {
  const safePath = path.startsWith("/") ? path : `/${path}`;
  return `${BASE_URL}${safePath}`;
};

export const ogImageUrl = (): string => `${BASE_URL}/opengraph-image`;

export type JsonLdValue = string | number | boolean | null | JsonLdValue[] | { [key: string]: JsonLdValue };

export type JsonLdSchema = {
  [key: string]: JsonLdValue;
};

export const serializeJsonLd = (schema: JsonLdSchema | JsonLdSchema[]): string =>
  JSON.stringify(schema).replace(/</g, "\\u003c");

export type ToolFAQ = {
  q: string;
  a: string;
};

export type ToolAnswerBlock = {
  availableAnswer: string;
  comingSoonAnswer?: string;
  facts: string[];
  bestFor: string;
  privacyNote: string;
};

export const HOMEPAGE_FAQS: ToolFAQ[] = [
  {
    q: "What is Leafwork?",
    a: "Leafwork is a free local-first PDF toolkit for browser-based document workflows such as merge, split, sign, redact, rotate, convert, watermark, metadata cleanup, and sandbox review."
  },
  {
    q: "Does Leafwork upload PDF files?",
    a: "No. Core PDF tools run in the browser, so PDF file bytes stay on the user's device and are not uploaded to Leafwork servers for those workflows."
  },
  {
    q: "Which Leafwork tools run locally?",
    a: "The available core tools, including merge, split, PDF to images, images to PDF, watermark, sign, redact, rotate, metadata cleanup, and sandbox operations, run locally in the browser."
  },
  {
    q: "How does Leafwork handle analytics?",
    a: "Analytics is optional. Vercel Analytics and Speed Insights load only after the user allows analytics from Privacy Choices."
  },
  {
    q: "Can I submit feedback or a grievance without logging in?",
    a: "Yes. The feedback form supports anonymous submissions, with optional email only if the user wants follow-up."
  },
  {
    q: "Are compression and AI tools available?",
    a: "Compression and AI tools are marked coming soon until their quality, privacy, and reliability flows are ready."
  }
];

export const TRUST_AND_PRIVACY_FACTS = [
  "Core PDF tools process file bytes locally in the browser.",
  "The sandbox workspace is browser-local and session-only in v1.",
  "Feedback, privacy requests, consent withdrawal, and grievance requests use the feedback form and may be stored in Supabase.",
  "Analytics and performance scripts load only after the user allows analytics from Privacy Choices.",
  "Compression and AI tools are coming soon while quality and privacy flows are finalized.",
  "Leafwork's legal pages are written for an India-first product posture guided by the DPDP Act, 2023."
] as const;

export type ToolSlug =
  | "sandbox"
  | "merge"
  | "split"
  | "compress"
  | "pdf-to-word"
  | "pdf-to-images"
  | "images-to-pdf"
  | "watermark"
  | "sign"
  | "redact"
  | "rotate"
  | "metadata-strip"
  | "summarize";

export type ToolNavItem = {
  slug: ToolSlug;
  name: string;
  href: string;
};

type ToolSEOEntry = {
  slug: ToolSlug;
  title: string;
  description: string;
  h1: string;
  keywords: string[];
  faq: ToolFAQ[];
  answerBlock: ToolAnswerBlock;
};

const TOOL_NAV_NAMES: Record<ToolSlug, string> = {
  sandbox: "PDF Sandbox",
  merge: "Merge PDF",
  split: "Split PDF",
  compress: "Compress PDF",
  "pdf-to-word": "PDF to Word",
  "pdf-to-images": "PDF to Images",
  "images-to-pdf": "Images to PDF",
  watermark: "Watermark PDF",
  sign: "Sign PDF",
  redact: "Redact PDF",
  rotate: "Rotate PDF",
  "metadata-strip": "Remove Metadata",
  summarize: "Summarize PDF"
};

export const TOOL_SEO_DATA: Record<ToolSlug, ToolSEOEntry> = {
  sandbox: {
    slug: "sandbox",
    title: "PDF Sandbox - Batch PDF Workspace, No Upload | Leafwork",
    description: "Upload many PDFs, preview pages, queue local edits, and export one final browser-generated PDF.",
    h1: "PDF Sandbox Workspace",
    keywords: ["pdf sandbox", "batch pdf editor", "merge split pdf", "pdf workflow no upload"],
    answerBlock: {
      availableAnswer:
        "Leafwork PDF Sandbox is a browser-local workspace for combining PDFs, images, page edits, overlays, and final export in one session.",
      facts: [
        "Files stay in the browser session.",
        "PDF and image pages can be arranged before export.",
        "The main output is one final PDF download."
      ],
      bestFor: "Batch PDF cleanup, page ordering, watermarking, redaction review, and one-pass final export.",
      privacyNote: "Source files are not uploaded for the core sandbox workflow."
    },
    faq: [
      { q: "Does the sandbox upload my files?", a: "No. Files stay in the browser session and are discarded when the workspace is cleared." },
      { q: "Can I download only the final PDF?", a: "Yes. Queue operations in the sandbox and export one final PDF when ready." },
      { q: "Can I use images too?", a: "Yes. PNG and JPG files are converted into PDF pages locally before export." }
    ]
  },
  merge: {
    slug: "merge",
    title: "Merge PDF Files Online - Free, No Upload Required | Leafwork",
    description: "Combine multiple PDFs into one file in your browser with drag reorder and local export.",
    h1: "Merge PDF Files Instantly",
    keywords: ["merge pdf", "combine pdf", "join pdf online", "merge pdf no upload"],
    answerBlock: {
      availableAnswer: "Leafwork Merge PDF combines multiple PDF files into one PDF directly in the browser.",
      facts: [
        "Drag files into the order you want.",
        "Optional page ranges can be applied per file.",
        "The merged PDF downloads to the device."
      ],
      bestFor: "Joining reports, forms, scans, receipts, and document packets without sending file bytes to a server.",
      privacyNote: "Merging is a core browser-local tool; PDF bytes stay on the device."
    },
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
    answerBlock: {
      availableAnswer: "Leafwork Split PDF separates a PDF into page ranges, fixed-size chunks, or selected-page exports in the browser.",
      facts: [
        "Custom ranges support precise page slices.",
        "Every-N-pages mode creates repeated chunks.",
        "Multiple outputs can be downloaded together as a ZIP."
      ],
      bestFor: "Extracting chapters, invoices, signature pages, attachments, or page groups from one PDF.",
      privacyNote: "Splitting is a core browser-local tool; the source PDF is not uploaded."
    },
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
    answerBlock: {
      availableAnswer: "Leafwork Compress PDF reduces PDF file size with local-first compression controls and output checks.",
      comingSoonAnswer:
        "Leafwork Compress PDF is coming soon; it is planned as a local-first PDF size reduction tool with quality-aware output checks.",
      facts: [
        "Target-size compression is planned.",
        "Output quality and readability checks matter for aggressive targets.",
        "Metadata cleanup can be part of the compression flow."
      ],
      bestFor: "Preparing smaller PDFs for portals, email attachments, upload limits, and archive storage.",
      privacyNote: "Compression is marked coming soon until the browser-local quality flow is ready."
    },
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
    answerBlock: {
      availableAnswer:
        "Leafwork PDF to Word converts extracted PDF text into editable Word-friendly output with a privacy-first AI-assisted workflow.",
      comingSoonAnswer:
        "Leafwork PDF to Word is coming soon; it is planned for editable output after local text extraction and controlled AI assistance.",
      facts: [
        "Local extraction is planned before AI assistance.",
        "AI conversion works from extracted text, not raw PDF bytes.",
        "Complex scans and layouts may still need review."
      ],
      bestFor: "Turning readable PDFs into editable drafts, outlines, notes, or Word-friendly content.",
      privacyNote: "PDF to Word is coming soon and is not a live core browser-local tool yet."
    },
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
    answerBlock: {
      availableAnswer: "Leafwork PDF to Images converts selected PDF pages into PNG or JPG files in the browser.",
      facts: [
        "Pages can be selected before conversion.",
        "PNG and JPG output formats are supported.",
        "Bulk image results can be downloaded as a ZIP."
      ],
      bestFor: "Creating previews, page images, thumbnails, presentation assets, or image-only extracts from a PDF.",
      privacyNote: "PDF-to-image conversion is a core browser-local tool; page rendering happens on the device."
    },
    faq: [
      { q: "Can I choose pages?", a: "Yes. Select the exact pages you want to export." },
      { q: "Can I export JPG and PNG?", a: "Yes. Both output formats are available." },
      { q: "Can I download all at once?", a: "Yes. Use the ZIP option for bulk download." }
    ]
  },
  "images-to-pdf": {
    slug: "images-to-pdf",
    title: "Images to PDF - Convert PNG and JPG Locally | Leafwork",
    description: "Convert multiple PNG or JPG images into one PDF, separate PDFs, or ZIP output in your browser.",
    h1: "Convert Images to PDF",
    keywords: ["images to pdf", "jpg to pdf", "png to pdf", "multiple images to pdf"],
    answerBlock: {
      availableAnswer: "Leafwork Images to PDF turns PNG and JPG files into PDF output directly in the browser.",
      facts: [
        "Multiple images can be reordered before conversion.",
        "Output can be one combined PDF or separate PDFs.",
        "ZIP export is available for bulk downloads."
      ],
      bestFor: "Combining screenshots, scans, receipts, photos, or image batches into PDF files.",
      privacyNote: "Image-to-PDF conversion is a core browser-local tool; images are not uploaded."
    },
    faq: [
      { q: "Can I convert multiple images at once?", a: "Yes. Add multiple PNG or JPG images and reorder them before conversion." },
      { q: "Can I export one PDF per image?", a: "Yes. Choose PDF files, ZIP, or both." },
      { q: "Does conversion upload images?", a: "No. Image-to-PDF conversion runs locally in your browser." }
    ]
  },
  watermark: {
    slug: "watermark",
    title: "Watermark PDF - Text or Image, No Upload | Leafwork",
    description: "Add text or image watermarks with live preview and local PDF export.",
    h1: "Watermark PDF with Live Preview",
    keywords: ["watermark pdf", "add watermark to pdf", "pdf watermark no upload"],
    answerBlock: {
      availableAnswer: "Leafwork Watermark PDF adds text or image watermarks to PDF pages with live preview and local export.",
      facts: [
        "Text watermark settings include placement, opacity, and rotation.",
        "Image watermarks can be positioned before export.",
        "The final watermarked PDF downloads from the browser."
      ],
      bestFor: "Adding draft marks, ownership labels, confidentiality notices, and review-state labels to PDFs.",
      privacyNote: "Watermarking is a core browser-local tool; PDF bytes stay on the device."
    },
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
    answerBlock: {
      availableAnswer: "Leafwork Sign PDF places drawn, typed, or uploaded signatures onto PDF pages in the browser.",
      facts: [
        "Signatures can be moved and resized on the page preview.",
        "Specific pages can be selected before placement.",
        "The signed PDF exports locally."
      ],
      bestFor: "Adding approval marks, acknowledgements, simple signatures, and initials to existing PDFs.",
      privacyNote: "Signing is a core browser-local tool; signature data is not uploaded."
    },
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
    answerBlock: {
      availableAnswer: "Leafwork Redact PDF lets you draw redaction regions on page previews and export a redacted PDF locally.",
      facts: [
        "Redaction boxes are placed visually on page previews.",
        "The exported PDF contains permanent blacked-out regions.",
        "Review each region before sharing the final file."
      ],
      bestFor: "Removing visible account numbers, IDs, addresses, signatures, and other sensitive page content.",
      privacyNote: "Redaction is a core browser-local tool; the PDF is processed on the device."
    },
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
    answerBlock: {
      availableAnswer: "Leafwork Rotate PDF turns all pages or selected pages by 90, 180, or 270 degrees in the browser.",
      facts: [
        "Selected-page rotation is supported.",
        "Whole-document rotation is available for quick fixes.",
        "The corrected PDF downloads locally."
      ],
      bestFor: "Fixing sideways scans, upside-down pages, mixed-orientation packets, and rotated attachments.",
      privacyNote: "Rotation is a core browser-local tool; the PDF is not uploaded."
    },
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
    answerBlock: {
      availableAnswer: "Leafwork Remove Metadata cleans common hidden PDF metadata fields before sharing a document.",
      facts: [
        "Common fields include author, creator, producer, and creation metadata.",
        "Visible page content is not changed.",
        "The cleaned PDF exports from the browser."
      ],
      bestFor: "Removing document identity details before external sharing, publishing, or handoff.",
      privacyNote: "Metadata cleanup is a core browser-local tool; the PDF is processed on the device."
    },
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
    answerBlock: {
      availableAnswer: "Leafwork Summarize PDF creates concise AI summaries from locally extracted PDF text.",
      comingSoonAnswer:
        "Leafwork Summarize PDF is coming soon; it is planned for concise AI summaries after local text extraction.",
      facts: [
        "Local text extraction is planned before summarization.",
        "The AI route works from extracted text, not raw PDF bytes.",
        "Summaries should be reviewed against the source for important decisions."
      ],
      bestFor: "Getting quick overviews, key points, action items, and reading notes from text-heavy PDFs.",
      privacyNote: "Summarize PDF is coming soon and is not a live core browser-local tool yet."
    },
    faq: [
      { q: "Is the full PDF uploaded?", a: "No. Text extraction runs locally first; AI gets extracted text only." },
      { q: "Can I export summary text?", a: "Yes. Copy to clipboard or download as a text file." },
      { q: "Do I need login?", a: "Yes. AI features require authentication." }
    ]
  }
};

const TOOL_NAV_ORDER: ToolSlug[] = [
  "merge",
  "split",
  "compress",
  "pdf-to-word",
  "pdf-to-images",
  "images-to-pdf",
  "watermark",
  "sign",
  "redact",
  "rotate",
  "metadata-strip",
  "summarize"
];

const SCHEMA_TOOL_ORDER: ToolSlug[] = ["sandbox", ...TOOL_NAV_ORDER];

export const TOOL_NAV_ITEMS: ToolNavItem[] = TOOL_NAV_ORDER.map((slug) => ({
  slug,
  name: TOOL_NAV_NAMES[slug],
  href: `/tools/${slug}`
}));

export const getAvailableToolNavItems = (): ToolNavItem[] =>
  TOOL_NAV_ITEMS.filter((item) => getToolFeatureState(item.slug).enabled);

const getAvailableSchemaToolItems = (): ToolNavItem[] =>
  SCHEMA_TOOL_ORDER.filter((slug) => getToolFeatureState(slug).enabled).map((slug) => ({
    slug,
    name: TOOL_NAV_NAMES[slug],
    href: `/tools/${slug}`
  }));

export const getToolFaqs = (toolSlug: ToolSlug): ToolFAQ[] => TOOL_SEO_DATA[toolSlug].faq;

export const getToolAnswerBlock = (toolSlug: ToolSlug): ToolAnswerBlock => TOOL_SEO_DATA[toolSlug].answerBlock;

export const getRelatedToolLinks = (currentToolSlug: ToolSlug, limit = 6): ToolNavItem[] =>
  TOOL_NAV_ITEMS.filter((item) => item.slug !== currentToolSlug)
    .sort((a, b) => Number(getToolFeatureState(b.slug).enabled) - Number(getToolFeatureState(a.slug).enabled))
    .slice(0, limit);

export const generateBreadcrumbSchema = ({
  toolSlug,
  toolTitle
}: {
  toolSlug?: ToolSlug;
  toolTitle?: string;
}): JsonLdSchema => {
  const items = [
    { name: "Home", item: canonicalUrl("/") },
    { name: "Tools", item: canonicalUrl("/tools") }
  ];

  if (toolSlug) {
    items.push({
      name: toolTitle ?? TOOL_NAV_NAMES[toolSlug],
      item: canonicalUrl(`/tools/${toolSlug}`)
    });
  }

  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((entry, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: entry.name,
      item: entry.item
    }))
  };
};

const generateTrustFactTerms = (): JsonLdSchema[] =>
  TRUST_AND_PRIVACY_FACTS.map((fact) => ({
    "@type": "DefinedTerm",
    name: fact
  }));

const getAvailableToolFeatureList = (): string[] => [
  "Browser-based PDF processing",
  "Local-first document handling",
  "No uploads for enabled core PDF tools",
  ...getAvailableSchemaToolItems().map((item) => TOOL_SEO_DATA[item.slug].h1)
];

export const generateToolCollectionSchema = (): JsonLdSchema => ({
  "@context": "https://schema.org",
  "@type": "CollectionPage",
  name: "Leafwork PDF Tools",
  url: canonicalUrl("/tools"),
  about: generateTrustFactTerms(),
  isPartOf: {
    "@type": "WebSite",
    name: "Leafwork",
    url: canonicalUrl("/")
  },
  publisher: {
    "@type": "Organization",
    name: "Leafwork",
    url: canonicalUrl("/"),
    sameAs: [GITHUB_URL]
  },
  hasPart: getAvailableSchemaToolItems().map((item) => ({
    "@type": "WebPage",
    name: item.name,
    url: canonicalUrl(item.href)
  }))
});

export const generateToolMetadata = (toolSlug: ToolSlug, descriptionOverride?: string): Metadata => {
  const entry = TOOL_SEO_DATA[toolSlug];
  const feature = getToolFeatureState(toolSlug);
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
    },
    robots: feature.enabled
      ? undefined
      : {
          index: false,
          follow: false
        }
  };
};

export const generateFAQSchema = (faqs: ToolFAQ[]): JsonLdSchema => ({
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

export const generateOrganizationSchema = (): JsonLdSchema => ({
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "Leafwork",
  url: canonicalUrl("/"),
  logo: canonicalUrl("/icon-512.png"),
  sameAs: [GITHUB_URL],
  contactPoint: [
    {
      "@type": "ContactPoint",
      contactType: "privacy support",
      url: canonicalUrl("/privacy#feedback-grievance"),
      areaServed: "IN",
      availableLanguage: ["en"]
    },
    {
      "@type": "ContactPoint",
      contactType: "security support",
      url: canonicalUrl("/security#feedback-grievance"),
      areaServed: "IN",
      availableLanguage: ["en"]
    }
  ],
  ethicsPolicy: canonicalUrl("/privacy"),
  publishingPrinciples: canonicalUrl("/security"),
  description: "Leafwork builds privacy-first PDF tools where core document processing runs locally in the browser.",
  knowsAbout: [
    "PDF tools",
    "browser-based PDF processing",
    "local-first software",
    "PDF merge",
    "PDF split",
    "PDF redaction",
    "PDF signatures",
    "PDF metadata removal"
  ]
});

export const generateWebsiteSchema = (): JsonLdSchema => ({
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "Leafwork",
  alternateName: "Leafwork PDF Tools",
  url: canonicalUrl("/"),
  about: generateTrustFactTerms(),
  publisher: {
    "@type": "Organization",
    name: "Leafwork",
    url: canonicalUrl("/")
  }
});

export const generateSoftwareAppSchema = (toolSlug?: ToolSlug): JsonLdSchema | null => {
  const tool = toolSlug ? TOOL_SEO_DATA[toolSlug] : null;
  const feature = toolSlug ? getToolFeatureState(toolSlug) : null;

  if (feature && !feature.enabled) {
    return null;
  }

  return {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: tool ? `Leafwork ${tool.h1}` : "Leafwork PDF Tools",
    applicationCategory: "BusinessApplication",
    applicationSubCategory: "PDF editor",
    operatingSystem: "Web",
    runtimePlatform: "Web browser",
    softwareRequirements: "Requires a modern browser with JavaScript enabled",
    isAccessibleForFree: true,
    publisher: {
      "@type": "Organization",
      name: "Leafwork",
      url: canonicalUrl("/"),
      sameAs: [GITHUB_URL]
    },
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "INR"
    },
    description: tool?.description ?? "Free browser-based PDF tools. No uploads required for enabled core tools.",
    url: tool ? canonicalUrl(`/tools/${tool.slug}`) : canonicalUrl("/"),
    sameAs: [GITHUB_URL],
    featureList: tool ? [tool.h1, "Browser-based local processing"] : getAvailableToolFeatureList(),
    softwareHelp: canonicalUrl(tool ? `/tools/${tool.slug}` : "/tools"),
    isPartOf: {
      "@type": "WebSite",
      name: "Leafwork",
      url: canonicalUrl("/")
    }
  };
};

export const generateWebPageSchema = ({
  type = "WebPage",
  name,
  description,
  path,
  dateModified,
  aboutTrustFacts = false
}: {
  type?: "AboutPage" | "WebPage";
  name: string;
  description: string;
  path: string;
  dateModified?: string;
  aboutTrustFacts?: boolean;
}): JsonLdSchema => ({
  "@context": "https://schema.org",
  "@type": type,
  name,
  description,
  url: canonicalUrl(path),
  ...(dateModified ? { dateModified } : {}),
  ...(aboutTrustFacts ? { about: generateTrustFactTerms() } : {}),
  isPartOf: {
    "@type": "WebSite",
    name: "Leafwork",
    url: canonicalUrl("/")
  },
  publisher: {
    "@type": "Organization",
    name: "Leafwork",
    url: canonicalUrl("/")
  }
});
