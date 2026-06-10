import { ImagesToPdfToolClient } from "@/app/(marketing)/tools/images-to-pdf/_ImagesToPdfToolClient";
import { ToolPageShell } from "@/components/tools/ToolPageShell";
import { generateToolMetadata } from "@/lib/utils/seo";

export const metadata = generateToolMetadata("images-to-pdf");

const faqs = [
  {
    q: "Can I add more than one image?",
    a: "Yes. Add multiple PNG or JPG images, reorder them, and convert them together."
  },
  {
    q: "Can I download one PDF per image?",
    a: "Yes. Choose PDF files, ZIP, or both before converting."
  },
  {
    q: "Do images upload to a server?",
    a: "No. Conversion runs locally in your browser."
  }
];

export default function ImagesToPdfToolPage() {
  return (
    <ToolPageShell
      toolTitle="Images to PDF"
      description="Convert multiple PNG or JPG images into one PDF, separate PDFs, or a ZIP."
      faqs={faqs}
      toolSlug="images-to-pdf"
    >
      <ImagesToPdfToolClient />
    </ToolPageShell>
  );
}
