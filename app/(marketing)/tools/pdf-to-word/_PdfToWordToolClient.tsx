"use client";

import { useMemo, useState } from "react";

import { FileInfoCard } from "@/components/tools/FileInfoCard";
import { ReplaceFileDropTarget } from "@/components/tools/ReplaceFileDropTarget";
import { Button } from "@/components/ui/Button";
import { DropZone } from "@/components/ui/DropZone";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { extractTextWithLayout } from "@/lib/ai/extraction";
import { markdownToDocxBlob } from "@/lib/documents/markdown-to-docx";
import { pdfToLayoutDocxBlob } from "@/lib/documents/pdf-layout-docx";
import { trackToolActivity } from "@/lib/utils/activity";
import { analytics } from "@/lib/utils/analytics";
import { downloadBlob } from "@/lib/utils/file";

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
  const [docxBusy, setDocxBusy] = useState(false);
  const [layoutDocxBusy, setLayoutDocxBusy] = useState(false);
  const [progress, setProgress] = useState(0);
  const [markdown, setMarkdown] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [truncated, setTruncated] = useState(false);

  const charCount = useMemo(() => markdown.length, [markdown.length]);

  const loadFile = (next: File) => {
    setFile(next);
    setMarkdown("");
    setProgress(0);
    setError(null);
    setTruncated(false);
  };

  return (
    <div className="space-y-4">
      {!file ? <DropZone multiple={false} onFiles={(files) => files[0] && loadFile(files[0])} /> : null}

      {file ? (
        <ReplaceFileDropTarget onFile={loadFile}>
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
                setTruncated(false);

                try {
                  analytics.aiFeatureUsed("pdf_to_word");
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
                  setTruncated(response.headers.get("x-ai-input-truncated") === "1");

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
                <div className="flex items-center gap-2">
                  <Button
                    variant="secondary"
                    loading={docxBusy}
                    onClick={async () => {
                      if (!file) {
                        return;
                      }

                      setDocxBusy(true);
                      try {
                        const title = file.name.replace(/\.pdf$/i, "");
                        const blob = await markdownToDocxBlob(markdown, title);
                        downloadBlob(blob, `${title}.docx`);
                        trackToolActivity({
                          tool: "pdf-to-word",
                          fileName: `${title}.docx`,
                          filesProcessed: 1,
                          inputBytes: file.size,
                          outputBytes: blob.size
                        });
                      } finally {
                        setDocxBusy(false);
                      }
                    }}
                  >
                    Word (.docx) - Reflow
                  </Button>

                  <Button
                    variant="secondary"
                    loading={layoutDocxBusy}
                    onClick={async () => {
                      if (!file) {
                        return;
                      }

                      setLayoutDocxBusy(true);
                      try {
                        const title = file.name.replace(/\.pdf$/i, "");
                        const sourceBytes = new Uint8Array(await file.arrayBuffer());
                        const blob = await pdfToLayoutDocxBlob(sourceBytes);
                        downloadBlob(blob, `${title}_layout.docx`);
                        trackToolActivity({
                          tool: "pdf-to-word",
                          fileName: `${title}_layout.docx`,
                          filesProcessed: 1,
                          inputBytes: file.size,
                          outputBytes: blob.size
                        });
                      } finally {
                        setLayoutDocxBusy(false);
                      }
                    }}
                  >
                    Word (.docx) - Layout
                  </Button>

                  <Button
                    variant="secondary"
                    onClick={() => {
                      const outputName = `${file.name.replace(/\.pdf$/i, "")}.md`;
                      downloadMarkdown(markdown, outputName);
                      trackToolActivity({
                        tool: "pdf-to-word",
                        fileName: outputName,
                        filesProcessed: 1,
                        inputBytes: file.size,
                        outputBytes: new TextEncoder().encode(markdown).length
                      });
                    }}
                  >
                    Download Markdown
                  </Button>
                </div>
              </div>
              <p className="text-xs text-muted">{charCount} characters generated</p>
              {truncated ? (
                <p className="text-xs text-amber-900">
                  Input was trimmed for AI processing due to document length. Output covers the first section of the text.
                </p>
              ) : null}
              <pre className="max-h-[460px] overflow-auto rounded-brutal border-2 border-ink bg-paper p-3 text-xs">
                {markdown}
              </pre>
            </section>
          ) : null}
          </section>
        </ReplaceFileDropTarget>
      ) : null}

      {error ? <p className="text-sm text-red-900">{error}</p> : null}
    </div>
  );
};
