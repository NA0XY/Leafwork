import { RotateToolClient } from "@/app/(marketing)/tools/rotate/_RotateToolClient";
import { ToolPageShell } from "@/components/tools/ToolPageShell";
import { generateToolMetadata } from "@/lib/utils/seo";

export const metadata = generateToolMetadata("rotate");

const faqs = [
  {
    q: "Can I rotate only specific pages?",
    a: "Yes. Switch to selected mode and click the pages you want to rotate."
  },
  {
    q: "Does this edit happen in the cloud?",
    a: "No. Rotation is applied in your browser and the result downloads directly."
  },
  {
    q: "Can I rotate by 180 degrees?",
    a: "Yes. Use the 180 degree control for upside-down pages."
  }
];

export default function RotateToolPage() {
  return (
    <ToolPageShell
      toolTitle="Rotate PDF"
      description="Preview thumbnails, choose page scope, and rotate pages before export."
      faqs={faqs}
    >
      <RotateToolClient />
    </ToolPageShell>
  );
}
