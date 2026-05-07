"use client";

import { useMemo, useState } from "react";

import { FileInfoCard } from "@/components/tools/FileInfoCard";
import { Button } from "@/components/ui/Button";
import { DropZone } from "@/components/ui/DropZone";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { extractTextWithLayout } from "@/lib/ai/extraction";

const downloadMarkdown = (content: string, filename: string): void => {
  const blob = new Blob([content], { type: "text/markdown;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
};

export const PdfToWordToolClient = () => {
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);
  const [markdown, setMarkdown] = useState("");
  const [error, setError] = useState<string | null>(null);

  const charCount = useMemo(() => markdown.length, [markdown.length]);

  return (
    <div className="space-y-4">
      {!file ? <DropZone multiple={false} onFiles={(files) => setFile(files[0] ?? null)} /> : null}

      {file ? (
        <section className="space-y-4">
          <FileInfoCard file={file} onRemove={() => setFile(null)} />

          <div className="rounded-brutal border-2 border-ink bg-surface p-4 shadow-brutal">
            <Button
              loading={busy}
              onClick={async () => {
                setBusy(true);
                setError(null);
                setProgress(10);
                setMarkdown("");

                try {
                  const bytes = new Uint8Array(await file.arrayBuffer());
                  const extractedText = await extractTextWithLayout(bytes);
                  setProgress(45);

                  const pageCount = Math.max(1, (extractedText.match(/\[PAGE_BREAK:/g) ?? []).length);
                  const response = await fetch("/api/ai/pdf-to-word", {
                    method: "POST",
                    headers: {
                      "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                      extractedText,
                      pageCount,
                      filename: file.name
                    })
                  });

                  if (!response.ok || !response.body) {
                    const payload = (await response.json().catch(() => null)) as
                      | { error?: { message?: string } }
                      | null;
                    throw new Error(payload?.error?.message ?? "AI conversion failed");
                  }

                  const reader = response.body.getReader();
                  const decoder = new TextDecoder();
                  let accumulated = "";

                  while (true) {
                    const { done, value } = await reader.read();
                    if (done) {
                      break;
                    }
                    accumulated += decoder.decode(value, { stream: true });
                    setMarkdown(accumulated);
                  }

                  setProgress(100);
                } catch (err) {
                  setError(err instanceof Error ? err.message : "Unexpected conversion error");
                } finally {
                  setBusy(false);
                }
              }}
            >
              Convert using AI
            </Button>
            <div className="mt-3">
              <ProgressBar value={progress} animated showLabel />
            </div>
          </div>

          {markdown ? (
            <section className="space-y-3 rounded-brutal border-2 border-ink bg-surface p-4 shadow-brutal">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold">Converted Markdown</h2>
                <Button
                  variant="secondary"
                  onClick={() => {
                    downloadMarkdown(markdown, `${file.name.replace(/\.pdf$/i, "")}.md`);
                  }}
                >
                  Download Markdown
                </Button>
              </div>
              <p className="text-xs text-muted">{charCount} characters generated</p>
              <pre className="max-h-[460px] overflow-auto rounded-brutal border-2 border-ink bg-paper p-3 text-xs">
                {markdown}
              </pre>
            </section>
          ) : null}
        </section>
      ) : null}

      {error ? <p className="text-sm text-red-900">{error}</p> : null}
    </div>
  );
};
