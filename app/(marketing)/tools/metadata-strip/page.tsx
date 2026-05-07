import { MetadataStripToolClient } from "@/app/(marketing)/tools/metadata-strip/_MetadataStripToolClient";
import { ToolPageShell } from "@/components/tools/ToolPageShell";
import { generateToolMetadata } from "@/lib/utils/seo";

export const metadata = generateToolMetadata("metadata-strip");

const faqs = [
  {
    q: "What metadata is removed?",
    a: "Leafwork removes common metadata fields like author, producer, and creation metadata when possible."
  },
  {
    q: "Is metadata stripping local?",
    a: "Yes. The cleanup process runs entirely in your browser."
  },
  {
    q: "Will this change visible page content?",
    a: "No. Metadata stripping targets document metadata fields, not page visuals."
  }
];

export default function MetadataStripToolPage() {
  return (
    <ToolPageShell
      toolTitle="Strip Metadata"
      description="Clean hidden metadata before sharing documents outside your environment."
      faqs={faqs}
    >
      <MetadataStripToolClient />
    </ToolPageShell>
  );
}
