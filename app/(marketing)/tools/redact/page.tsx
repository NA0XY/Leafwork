import { RedactToolClient } from "@/app/(marketing)/tools/redact/_RedactToolClient";
import { ToolPageShell } from "@/components/tools/ToolPageShell";
import { generateToolMetadata } from "@/lib/utils/seo";

export const metadata = generateToolMetadata("redact");

const faqs = [
  {
    q: "Is redaction permanent in the exported file?",
    a: "Yes. Export places solid black overlays directly into the PDF output."
  },
  {
    q: "Can I preview before downloading?",
    a: "Yes. Draw areas over the real page preview before you apply redaction."
  },
  {
    q: "What does AI-assisted redaction do?",
    a: "It suggests likely sensitive values so you can manually confirm what to redact."
  }
];

export default function RedactToolPage() {
  return (
    <ToolPageShell
      toolTitle="Redact PDF"
      description="Draw redaction regions directly on page previews and export a secure redacted copy."
      faqs={faqs}
    >
      <RedactToolClient />
    </ToolPageShell>
  );
}
