import { WatermarkToolClient } from "@/app/(marketing)/tools/watermark/_WatermarkToolClient";
import { ToolPageShell } from "@/components/tools/ToolPageShell";
import { generateToolMetadata } from "@/lib/utils/seo";

export const metadata = generateToolMetadata("watermark");

const faqs = [
  {
    q: "Can I preview watermark placement before export?",
    a: "Yes. A live overlay preview updates instantly as you change text, opacity, rotation, and position."
  },
  {
    q: "Can I use an image watermark?",
    a: "Yes. Upload PNG, JPG, or SVG and position it on the page."
  },
  {
    q: "Does watermarking happen on a server?",
    a: "No. Watermark processing runs locally inside your browser."
  }
];

export default function WatermarkToolPage() {
  return (
    <ToolPageShell
      toolTitle="Watermark PDF"
      description="Apply text or image watermarks with a live visual preview before download."
      faqs={faqs}
      toolSlug="watermark"
    >
      <WatermarkToolClient />
    </ToolPageShell>
  );
}

