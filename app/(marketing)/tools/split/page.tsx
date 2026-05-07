import { SplitToolClient } from "@/app/(marketing)/tools/split/_SplitToolClient";
import { ToolPageShell } from "@/components/tools/ToolPageShell";
import { generateToolMetadata } from "@/lib/utils/seo";

export const metadata = generateToolMetadata("split");

const faqs = [
  {
    q: "Can I split by custom ranges?",
    a: "Yes. Enter non-overlapping ranges and download all parts as a ZIP file."
  },
  {
    q: "Can I split every N pages automatically?",
    a: "Yes. Choose the chunk size and Leafwork creates evenly sized splits."
  },
  {
    q: "Can I extract only selected pages?",
    a: "Yes. Switch to extract mode and click page thumbnails to include them."
  }
];

export default function SplitToolPage() {
  return (
    <ToolPageShell
      toolTitle="Split PDF"
      description="Split by ranges, fixed chunks, or selected pages with local ZIP export."
      faqs={faqs}
    >
      <SplitToolClient />
    </ToolPageShell>
  );
}
