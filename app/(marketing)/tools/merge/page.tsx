import { MergeToolClient } from "@/app/(marketing)/tools/merge/_MergeToolClient";
import { ToolPageShell } from "@/components/tools/ToolPageShell";
import { generateToolMetadata } from "@/lib/utils/seo";

export const metadata = generateToolMetadata("merge");

const faqs = [
  {
    q: "Do files upload while merging?",
    a: "No. Merge runs locally in your browser tab and the final file downloads directly to your device."
  },
  {
    q: "Can I reorder files before export?",
    a: "Yes. Drag rows into the order you want, then export once."
  },
  {
    q: "Can I remove a file after dropping it?",
    a: "Yes. Use the remove action on each file card before you run merge."
  }
];

export default function MergeToolPage() {
  return (
    <ToolPageShell
      toolTitle="Merge PDF"
      description="Combine multiple PDFs in a single local session with drag-to-reorder controls."
      faqs={faqs}
      toolSlug="merge"
    >
      <MergeToolClient />
    </ToolPageShell>
  );
}

