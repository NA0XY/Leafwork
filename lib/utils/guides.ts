import type { Metadata } from "next";

import { BASE_URL, canonicalUrl, ogImageUrl, type ToolFAQ } from "@/lib/utils/seo";

export type GuideSlug =
  | "merge-pdf-locally"
  | "split-pdf-without-uploading"
  | "remove-pdf-metadata"
  | "redact-pdf-locally"
  | "images-to-pdf-browser";

export type GuideStep = {
  title: string;
  body: string;
};

export type GuideEntry = {
  slug: GuideSlug;
  title: string;
  description: string;
  h1: string;
  keywords: string[];
  intro: string;
  quickAnswer: string;
  steps: GuideStep[];
  privacyNote: string;
  bestFor: string[];
  mistakes: string[];
  faqs: ToolFAQ[];
  cta: {
    label: string;
    href: string;
  };
};

export const GUIDE_ENTRIES: GuideEntry[] = [
  {
    slug: "merge-pdf-locally",
    title: "How to Merge PDF Files Locally - No Upload Required | Leafwork",
    description:
      "Merge PDF files locally in your browser with Leafwork. Reorder files, choose page ranges, and export one combined PDF without uploading private documents.",
    h1: "How to Merge PDF Files Locally Without Uploading",
    keywords: ["merge pdf locally", "merge pdf no upload", "combine pdf files locally", "browser pdf merge"],
    intro:
      "Merging PDFs is simple, but the privacy tradeoff is often hidden. Many online PDF tools ask you to upload contracts, resumes, forms, or scans before they combine files. Leafwork keeps the merge workflow in your browser so you can assemble a final PDF without sending the source files to a server.",
    quickAnswer:
      "To merge PDFs locally, open Leafwork Merge PDF, add the PDFs, reorder them, optionally enter page ranges, then export the combined file. The enabled merge workflow runs in your browser and downloads the final PDF to your device.",
    steps: [
      {
        title: "Open the Merge PDF tool",
        body: "Go to Leafwork's Merge PDF page and use the file picker or drop zone to add your first PDFs."
      },
      {
        title: "Add every source PDF",
        body: "Add reports, scans, forms, or attachments in the same browser session. If you are using the sandbox, files can also be dragged from storage into the merge workflow."
      },
      {
        title: "Put files in the right order",
        body: "Drag rows until the documents appear in the final order you want. This is useful for packets, appendices, receipts, and applications."
      },
      {
        title: "Use page ranges when needed",
        body: "If a source PDF has extra pages, enter the specific pages or ranges you want before exporting."
      },
      {
        title: "Export one combined PDF",
        body: "Run merge and download the final PDF. Review the file before sharing it externally."
      }
    ],
    privacyNote:
      "Leafwork Merge PDF is an enabled core tool that processes file bytes locally in the browser. Avoid pasting private document content into feedback forms or public posts.",
    bestFor: [
      "Combining resumes, certificates, and application packets",
      "Joining invoices, receipts, and statements",
      "Putting scanned pages and forms into one file",
      "Preparing a PDF bundle without uploading source files"
    ],
    mistakes: [
      "Forgetting to reorder files before export",
      "Merging all pages when only a page range is needed",
      "Sharing the output before checking page order",
      "Using a cloud uploader for private documents when local processing is enough"
    ],
    faqs: [
      {
        q: "Can I merge PDFs without uploading them?",
        a: "Yes. Leafwork Merge PDF runs locally in the browser for enabled core workflows, so source PDF bytes stay on your device."
      },
      {
        q: "Can I reorder PDFs before merging?",
        a: "Yes. Drag the files into the order you want before exporting the final PDF."
      },
      {
        q: "Can I merge only selected pages?",
        a: "Yes. Use page ranges for a source file when you only want part of that PDF in the final output."
      }
    ],
    cta: {
      label: "Merge PDF files locally",
      href: "/tools/merge"
    }
  },
  {
    slug: "split-pdf-without-uploading",
    title: "How to Split a PDF Without Uploading It | Leafwork",
    description:
      "Split PDF pages by range, chunks, or selected pages in your browser. Leafwork lets you extract PDF pages locally without uploading the file.",
    h1: "How to Split a PDF Without Uploading It",
    keywords: ["split pdf without uploading", "extract pdf pages locally", "split pdf no upload", "browser pdf splitter"],
    intro:
      "Splitting a PDF often means extracting a signature page, chapter, receipt, form section, or attachment. If the PDF contains private information, uploading the whole file just to keep a few pages is unnecessary. Leafwork's split workflow is built for local page extraction in the browser.",
    quickAnswer:
      "To split a PDF without uploading it, open Leafwork Split PDF, add the source PDF, choose ranges, fixed-size chunks, or selected pages, then export the resulting files or ZIP locally.",
    steps: [
      {
        title: "Open Split PDF",
        body: "Start on the Split PDF tool and add the PDF you want to separate."
      },
      {
        title: "Choose a split mode",
        body: "Use custom ranges for exact slices, fixed chunks for repeated groups, or selected pages when you only need specific pages."
      },
      {
        title: "Mark or confirm pages",
        body: "If pages were marked in the sandbox viewer, use those marks as a guide for the split or extract action."
      },
      {
        title: "Preview the output plan",
        body: "Check that each output includes the pages you expect before creating downloads."
      },
      {
        title: "Download files or a ZIP",
        body: "Export individual PDFs when there are only a few parts, or use ZIP when the split creates many outputs."
      }
    ],
    privacyNote:
      "Leafwork Split PDF is an enabled core browser-local tool. The source PDF is handled in the browser tab for the split workflow.",
    bestFor: [
      "Extracting signature pages",
      "Separating chapters or sections",
      "Splitting monthly statements or receipts",
      "Creating smaller PDFs for sharing"
    ],
    mistakes: [
      "Entering overlapping page ranges by accident",
      "Forgetting that PDF page numbers may not match printed page labels",
      "Downloading many separate files when ZIP is easier",
      "Skipping a quick review of each output"
    ],
    faqs: [
      {
        q: "Can I split a PDF without uploading it?",
        a: "Yes. Leafwork Split PDF performs enabled split operations locally in the browser."
      },
      {
        q: "Can I extract only one page?",
        a: "Yes. Use a single-page range or selected-page extraction."
      },
      {
        q: "Can I download multiple split PDFs together?",
        a: "Yes. When there are multiple outputs, Leafwork can package them as a ZIP."
      }
    ],
    cta: {
      label: "Split PDF pages locally",
      href: "/tools/split"
    }
  },
  {
    slug: "remove-pdf-metadata",
    title: "How to Remove PDF Metadata Before Sharing | Leafwork",
    description:
      "Remove common hidden PDF metadata such as author, creator, producer, and timestamps before sharing a document.",
    h1: "How to Remove PDF Metadata Before Sharing",
    keywords: ["remove pdf metadata", "strip pdf metadata", "pdf privacy metadata", "clean pdf metadata"],
    intro:
      "PDF files can include hidden metadata such as author, creator, producer, creation date, or editing software. That information is not always visible on the page, but it may still travel with the document. Leafwork helps remove common PDF metadata fields before sharing.",
    quickAnswer:
      "To remove PDF metadata, open Leafwork Remove Metadata, add your PDF, review the file details, then export a cleaned copy. Visible page content remains the same, while common document metadata fields are stripped.",
    steps: [
      {
        title: "Open Remove Metadata",
        body: "Use the metadata strip tool when you want a cleaner copy before sending or publishing a PDF."
      },
      {
        title: "Add the PDF",
        body: "Drop the document into the tool. For privacy-sensitive files, keep the workflow inside the local browser tool."
      },
      {
        title: "Review the document context",
        body: "Check whether the document needs other privacy work too, such as redaction or removing visible personal details."
      },
      {
        title: "Export a cleaned copy",
        body: "Create the output PDF after metadata stripping finishes."
      },
      {
        title: "Inspect before sharing",
        body: "Open the cleaned PDF and confirm the visible content still looks correct."
      }
    ],
    privacyNote:
      "Metadata removal helps with hidden document details, but it does not remove visible names, addresses, signatures, or account numbers on the page. Use redaction for visible sensitive content.",
    bestFor: [
      "Sharing drafts outside your organization",
      "Publishing PDFs online",
      "Cleaning author or software metadata",
      "Preparing documents after edits from multiple tools"
    ],
    mistakes: [
      "Assuming metadata cleanup removes visible sensitive text",
      "Sharing the original file instead of the cleaned copy",
      "Forgetting to redact visible account numbers or addresses",
      "Using metadata removal as a replacement for legal document review"
    ],
    faqs: [
      {
        q: "What PDF metadata can be removed?",
        a: "Leafwork targets common document metadata fields such as author, creator, producer, and related hidden document details."
      },
      {
        q: "Does removing metadata change visible pages?",
        a: "No. The goal is to clean hidden metadata while keeping visible page content unchanged."
      },
      {
        q: "Is metadata removal the same as redaction?",
        a: "No. Metadata removal handles hidden document fields. Redaction is for visible sensitive content on pages."
      }
    ],
    cta: {
      label: "Remove hidden PDF metadata",
      href: "/tools/metadata-strip"
    }
  },
  {
    slug: "redact-pdf-locally",
    title: "How to Redact a PDF Locally in Your Browser | Leafwork",
    description:
      "Redact visible sensitive content from a PDF using local browser tools. Add permanent black boxes and export a reviewed copy.",
    h1: "How to Redact a PDF Locally",
    keywords: ["redact pdf locally", "redact pdf no upload", "remove sensitive pdf content", "browser pdf redaction"],
    intro:
      "Redaction is for visible sensitive information such as account numbers, ID details, addresses, signatures, or private notes. A good redaction flow should let you review every marked area before sharing the final file. Leafwork keeps the enabled redaction workflow in the browser.",
    quickAnswer:
      "To redact a PDF locally, open Leafwork Redact PDF, add the file, draw redaction boxes over sensitive visible content, review every page, then export the redacted copy from the browser.",
    steps: [
      {
        title: "Open Redact PDF",
        body: "Start with the PDF you want to clean before sharing."
      },
      {
        title: "Find sensitive visible content",
        body: "Scan each page for names, addresses, ID numbers, account numbers, signatures, comments, or anything that should not be shared."
      },
      {
        title: "Draw redaction boxes",
        body: "Place boxes directly over the areas that need to be hidden. Keep the boxes slightly larger than the text or mark."
      },
      {
        title: "Review each marked page",
        body: "Zoom and inspect the output plan. Redaction mistakes are easiest to fix before export."
      },
      {
        title: "Export and recheck",
        body: "Download the redacted PDF and open it again before sending it onward."
      }
    ],
    privacyNote:
      "Redaction removes visible page content in the exported PDF. If the document also has hidden metadata, run metadata stripping before final sharing.",
    bestFor: [
      "Covering account numbers or IDs",
      "Removing addresses from shared documents",
      "Hiding signatures before public upload",
      "Preparing reviewed copies of forms or scans"
    ],
    mistakes: [
      "Using a highlight or drawing mark instead of a real redaction output",
      "Missing repeated sensitive data on later pages",
      "Forgetting hidden metadata after visible redaction",
      "Sharing the original unredacted file by mistake"
    ],
    faqs: [
      {
        q: "Can I redact a PDF without uploading it?",
        a: "Yes. Leafwork Redact PDF runs the enabled redaction workflow locally in the browser."
      },
      {
        q: "Should I also remove metadata?",
        a: "Often yes. Redaction handles visible page content, while metadata stripping handles common hidden document fields."
      },
      {
        q: "Can I preview redactions before export?",
        a: "Yes. Review the marked areas before creating the final redacted PDF."
      }
    ],
    cta: {
      label: "Redact sensitive PDF content",
      href: "/tools/redact"
    }
  },
  {
    slug: "images-to-pdf-browser",
    title: "How to Convert Images to PDF in the Browser | Leafwork",
    description:
      "Convert JPG and PNG images into one PDF or multiple PDF files in your browser without uploading the images.",
    h1: "How to Convert Images to PDF in the Browser",
    keywords: ["images to pdf browser", "jpg to pdf locally", "png to pdf no upload", "convert images to pdf"],
    intro:
      "Screenshots, scans, photos, and receipts often need to be sent as a PDF instead of loose image files. Leafwork turns JPG and PNG images into PDF output in the browser, with support for multiple images and local export options.",
    quickAnswer:
      "To convert images to PDF in the browser, open Leafwork Images to PDF, add JPG or PNG files, reorder them, choose combined or separate PDF output, then download the PDF or ZIP.",
    steps: [
      {
        title: "Open Images to PDF",
        body: "Use the image conversion tool when you need screenshots, scans, or photos packaged as PDFs."
      },
      {
        title: "Add one or many images",
        body: "Select JPG or PNG files from your device, or drag supported images into the drop zone."
      },
      {
        title: "Reorder the images",
        body: "Place the images in the order they should appear in the PDF."
      },
      {
        title: "Choose output type",
        body: "Export one combined PDF for a packet, or separate PDFs when each image should remain its own document."
      },
      {
        title: "Download PDF or ZIP",
        body: "Use direct PDF download for one output or ZIP when exporting multiple PDFs."
      }
    ],
    privacyNote:
      "Leafwork Images to PDF is an enabled core browser-local tool. Images are handled in the browser for the conversion workflow.",
    bestFor: [
      "Combining screenshots into one PDF",
      "Turning receipt photos into a shareable file",
      "Packaging scanned pages from a phone",
      "Creating separate PDFs from a batch of images"
    ],
    mistakes: [
      "Leaving images in the wrong order",
      "Mixing unrelated images into one combined PDF",
      "Forgetting to choose ZIP for many separate PDFs",
      "Using oversized source images when a smaller PDF is enough"
    ],
    faqs: [
      {
        q: "Can I convert multiple images to one PDF?",
        a: "Yes. Add multiple JPG or PNG files, reorder them, and export one combined PDF."
      },
      {
        q: "Can I create one PDF per image?",
        a: "Yes. Choose separate PDF output and download the results directly or as a ZIP."
      },
      {
        q: "Are image files uploaded?",
        a: "No. The enabled Images to PDF workflow runs locally in your browser."
      }
    ],
    cta: {
      label: "Convert images to PDF",
      href: "/tools/images-to-pdf"
    }
  }
];

export const GUIDE_NAV_ITEMS = GUIDE_ENTRIES.map((guide) => ({
  slug: guide.slug,
  title: guide.h1,
  href: `/guides/${guide.slug}`,
  anchorText: guide.h1
}));

export const getGuide = (slug: string): GuideEntry | undefined =>
  GUIDE_ENTRIES.find((guide) => guide.slug === slug);

export const generateGuideMetadata = (slug: GuideSlug): Metadata => {
  const guide = getGuide(slug);
  const path = `/guides/${slug}`;

  if (!guide) {
    return {};
  }

  return {
    title: guide.title,
    description: guide.description,
    keywords: guide.keywords,
    alternates: {
      canonical: canonicalUrl(path)
    },
    openGraph: {
      type: "article",
      title: guide.title,
      description: guide.description,
      url: canonicalUrl(path),
      siteName: "Leafwork",
      images: [
        {
          url: ogImageUrl(),
          width: 1200,
          height: 630,
          alt: guide.h1
        }
      ]
    },
    twitter: {
      card: "summary_large_image",
      title: guide.title,
      description: guide.description,
      images: [ogImageUrl()]
    }
  };
};

export const guideUrl = (slug: GuideSlug): string => `${BASE_URL}/guides/${slug}`;
