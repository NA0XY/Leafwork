import { CompressToolClient } from "@/app/(marketing)/tools/compress/_CompressToolClient";
import { ToolPageShell } from "@/components/tools/ToolPageShell";
import { generateToolMetadata } from "@/lib/utils/seo";

export const metadata = generateToolMetadata("compress");

const faqs = [
  {
    q: "Will compression upload my file?",
    a: "No. Compression runs in-browser and only the result file is downloaded back to your device."
  },
  {
    q: "Can compression reduce quality?",
    a: "Very aggressive targets can affect readability. Use the estimate and result badge before sharing."
  },
  {
    q: "Can I remove metadata while compressing?",
    a: "Yes. Metadata stripping is available in advanced options."
  }
];

export default function CompressToolPage() {
  return (
    <ToolPageShell
      toolTitle="Compress PDF"
      description="Shrink PDF size with live estimates, presets, and immediate local export."
      faqs={faqs}
    >
      <CompressToolClient />
    </ToolPageShell>
  );
}
