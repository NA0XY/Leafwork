"use client";

import { ClipboardCopy, Download } from "lucide-react";
import { useMemo, useState } from "react";

import { FileInfoCard } from "@/components/tools/FileInfoCard";
import { Button } from "@/components/ui/Button";
import { DropZone } from "@/components/ui/DropZone";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/useToast";
import { extractTextWithLayout } from "@/lib/ai/extraction";

const downloadText = (content: string, filename: string): void => {
  const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
};

const pickListItems = (text: string): string[] =>
  text
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.startsWith("-") || line.startsWith("*"))
    .map((line) => line.replace(/^[-*]\s*/, ""));

const pickFigureCandidates = (text: string): string[] => {
  const lines = text.split("\n").map((line) => line.trim());
  return lines.filter((line) => /\d/.test(line)).slice(0, 8);
};

const pickActionItems = (text: string): string[] => {
  const lines = text
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
  return lines.filter((line) => /\b(should|next|action|review|follow|prepare|send|complete)\b/i.test(line)).slice(0, 8);
};

export const SummarizeToolClient = () => {
  const toast = useToast();
  const { isAuthenticated } = useAuth();
  const [file, setFile] = useState<File | null>(null);
  const [summary, setSummary] = useState("");
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [charCount, setCharCount] = useState(0);

  const keyPoints = useMemo(() => pickListItems(summary), [summary]);
  const figureCandidates = useMemo(() => pickFigureCandidates(summary), [summary]);
  const actionItems = useMemo(() => pickActionItems(summary), [summary]);

  const overview = useMemo(() => {
    const cleaned = summary
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean)
      .slice(0, 3)
      .join(" ");
    return cleaned;
  }, [summary]);

  return (
    <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
      <div className="space-y-4">
        {!file ? (
          <DropZone multiple={false} onFiles={(files) => setFile(files[0] ?? null)} />
        ) : (
          <>
            <FileInfoCard file={file} onRemove={() => setFile(null)} />

            {!isAuthenticated ? (
              <section className="rounded-brutal border-2 border-ink bg-surface p-4 shadow-brutal">
                <p className="text-sm text-muted">Login to use AI summary.</p>
                <Button href="/login" className="mt-3">
                  Login
                </Button>
              </section>
            ) : (
              <section className="space-y-3 rounded-brutal border-2 border-ink bg-surface p-4 shadow-brutal">
                <p className="text-sm text-muted">
                  {charCount > 0 ? `${charCount.toLocaleString()} characters extracted (estimated ${Math.max(1, Math.round(charCount / 2500))} pages)` : "Ready to summarize."}
                </p>
                <Button
                  loading={busy}
                  onClick={async () => {
                    if (!file) {
                      return;
                    }

                    setBusy(true);
                    setProgress(10);
                    setError(null);
                    setSummary("");

                    try {
                      const bytes = new Uint8Array(await file.arrayBuffer());
                      const extractedText = await extractTextWithLayout(bytes);
                      setCharCount(extractedText.length);
                      setProgress(45);

                      const response = await fetch("/api/ai/summarize", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                          extractedText,
                          filename: file.name
                        })
                      });

                      const payload = (await response.json()) as { data?: { summary?: string }; error?: { message?: string } };
                      if (!response.ok || !payload.data?.summary) {
                        throw new Error(payload.error?.message ?? "Unable to summarize this file");
                      }

                      setSummary(payload.data.summary);
                      setProgress(100);
                    } catch (err) {
                      setError(err instanceof Error ? err.message : "Summary failed");
                    } finally {
                      setBusy(false);
                    }
                  }}
                >
                  Summarize with AI
                </Button>
                <ProgressBar value={progress} animated showLabel />
              </section>
            )}
          </>
        )}

        {error ? <p className="text-sm text-red-900">{error}</p> : null}
      </div>

      <section className="space-y-4 rounded-brutal border-2 border-ink bg-surface p-4 shadow-brutal">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold">Summary</h2>
          <div className="flex gap-2">
            <Button
              type="button"
              size="sm"
              variant="secondary"
              disabled={!summary}
              onClick={async () => {
                await navigator.clipboard.writeText(summary);
                toast.success("Copied", "Summary copied to clipboard");
              }}
            >
              <ClipboardCopy className="h-3.5 w-3.5" /> Copy
            </Button>
            <Button
              type="button"
              size="sm"
              variant="secondary"
              disabled={!summary || !file}
              onClick={() => downloadText(summary, `${file?.name.replace(/\.pdf$/i, "") ?? "summary"}_summary.txt`)}
            >
              <Download className="h-3.5 w-3.5" /> Download
            </Button>
          </div>
        </div>

        {!summary ? <p className="text-sm text-muted">Summary output appears here after processing.</p> : null}

        {summary ? (
          <div className="space-y-4 text-sm">
            <div>
              <p className="font-bold">Overview</p>
              <p className="mt-1 text-muted">{overview}</p>
            </div>

            <div>
              <p className="font-bold">Key Points</p>
              {keyPoints.length ? (
                <ul className="mt-1 space-y-1">
                  {keyPoints.map((point, index) => (
                    <li key={`${point}-${index}`} className="flex items-start gap-2">
                      <span className="mt-1 inline-block h-2 w-2 rounded-sm bg-accent" />
                      <span>{point}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-1 text-muted">No explicit bullet list returned by the model.</p>
              )}
            </div>

            {figureCandidates.length ? (
              <div>
                <p className="font-bold">Important Figures/Dates</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {figureCandidates.map((item, index) => (
                    <span key={`${item}-${index}`} className="rounded-full border-2 border-ink bg-green-100 px-2 py-1 text-xs font-semibold">
                      {item}
                    </span>
                  ))}
                </div>
              </div>
            ) : null}

            {actionItems.length ? (
              <div>
                <p className="font-bold">Action Items</p>
                <ul className="mt-1 space-y-1">
                  {actionItems.map((item, index) => (
                    <li key={`${item}-${index}`} className="flex items-center gap-2">
                      <span className="inline-flex h-4 w-4 items-center justify-center rounded border border-ink text-[10px]"> </span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>
        ) : null}
      </section>
    </div>
  );
};
