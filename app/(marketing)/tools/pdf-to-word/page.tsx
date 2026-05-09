import { PdfToWordToolClient } from "@/app/(marketing)/tools/pdf-to-word/_PdfToWordToolClient";
import { ToolPageShell } from "@/components/tools/ToolPageShell";
import { generateToolMetadata } from "@/lib/utils/seo";

export const metadata = generateToolMetadata("pdf-to-word");

const faqs = [
  {
    q: "Do you upload my PDF to generate text?",
    a: "No. Extraction is local first; only extracted text is sent to AI when you choose conversion."
  },
  {
    q: "Can I download the output?",
    a: "Yes. You can download generated markdown after conversion."
  },
  {
    q: "Will layout always be perfect?",
    a: "Complex scans may need cleanup, but extracted structure is optimized for editing workflows."
  }
];

export default function PdfToWordToolPage() {
  return (
    <ToolPageShell
      toolTitle="PDF to Word (AI)"
      description="Extract layout-aware text and convert to editable markdown with AI assistance."
      faqs={faqs}
      toolSlug="pdf-to-word"
    >
      <PdfToWordToolClient />
    </ToolPageShell>
  );
}

