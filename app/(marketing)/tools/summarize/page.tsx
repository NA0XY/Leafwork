import { SummarizeToolClient } from "@/app/(marketing)/tools/summarize/_SummarizeToolClient";
import { ToolPageShell } from "@/components/tools/ToolPageShell";
import { generateToolMetadata } from "@/lib/utils/seo";

export const metadata = generateToolMetadata("summarize");

const faqs = [
  {
    q: "Does AI summarization upload my full PDF?",
    a: "No. Text extraction runs locally first. The summary API receives extracted text, not file bytes."
  },
  {
    q: "Do I need an account for summaries?",
    a: "Yes. AI summary routes require authentication to protect usage and limits."
  },
  {
    q: "Can I export the summary?",
    a: "Yes. You can copy to clipboard or download a plain text file."
  }
];

export default function SummarizeToolPage() {
  return (
    <ToolPageShell
      toolTitle="Summarize PDF"
      description="Generate concise AI summaries with key points and action items from extracted text."
      faqs={faqs}
      toolSlug="summarize"
    >
      <SummarizeToolClient />
    </ToolPageShell>
  );
}

