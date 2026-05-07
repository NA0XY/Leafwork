import { SignToolClient } from "@/app/(marketing)/tools/sign/_SignToolClient";
import { ToolPageShell } from "@/components/tools/ToolPageShell";
import { generateToolMetadata } from "@/lib/utils/seo";

export const metadata = generateToolMetadata("sign");

const faqs = [
  {
    q: "Can I move the signature before exporting?",
    a: "Yes. Drag and resize the signature overlay on the page preview, then confirm placement."
  },
  {
    q: "Can I sign a specific page?",
    a: "Yes. Use the page navigator and place the signature on the selected page."
  },
  {
    q: "Is my signature uploaded anywhere?",
    a: "No. Signature creation and placement remain inside your browser session."
  }
];

export default function SignToolPage() {
  return (
    <ToolPageShell
      toolTitle="Sign PDF"
      description="Create or upload signatures, position them visually, and export signed PDFs locally."
      faqs={faqs}
    >
      <SignToolClient />
    </ToolPageShell>
  );
}
