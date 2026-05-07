import { PdfToImagesToolClient } from "@/app/(marketing)/tools/pdf-to-images/_PdfToImagesToolClient";
import { ToolPageShell } from "@/components/tools/ToolPageShell";
import { generateToolMetadata } from "@/lib/utils/seo";

export const metadata = generateToolMetadata("pdf-to-images");

const faqs = [
  {
    q: "Will it download every page automatically?",
    a: "No. You choose which pages to convert and then download only what you need."
  },
  {
    q: "Can I export as JPG or PNG?",
    a: "Yes. Choose output format and rendering resolution before conversion."
  },
  {
    q: "Can I download all images at once?",
    a: "Yes. Use the ZIP export button after conversion."
  }
];

export default function PdfToImagesToolPage() {
  return (
    <ToolPageShell
      toolTitle="PDF to Images"
      description="Convert selected PDF pages to PNG or JPG with preview and ZIP export."
      faqs={faqs}
    >
      <PdfToImagesToolClient />
    </ToolPageShell>
  );
}
