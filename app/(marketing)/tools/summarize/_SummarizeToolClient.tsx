"use client";

import { ClipboardCopy, Download } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

import { FileInfoCard } from "@/components/tools/FileInfoCard";
import { Button } from "@/components/ui/Button";
import { DropZone } from "@/components/ui/DropZone";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/useToast";
import { extractTextWithLayout } from "@/lib/ai/extraction";
import { trackToolActivity } from "@/lib/utils/activity";
import { analytics } from "@/lib/utils/analytics";

const downloadText = (content: string, filename: string): void => {
  const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
};

type SummarySection = "overview" | "keyPoints" | "figures" | "actions";

type ParsedSummary = {
  overview: string;
  keyPoints: string[];
  figures: string[];
  actions: string[];
};

const normalizeHeading = (line: string): string =>
  line
    .replace(/^\s*[#>\-\*\+\d\.\)\(:\s]+/, "")
    .replace(/\*{1,2}/g, "")
    .replace(/\s+/g, " ")
    .replace(/[:\s]+$/, "")
    .trim()
    .toLowerCase();

const detectSectionHeading = (line: string): SummarySection | null => {
  const normalized = normalizeHeading(line);

  if (normalized === "overview" || normalized.startsWith("overview ")) {
    return "overview";
  }

  if (normalized === "key points" || normalized === "key takeaways" || normalized.startsWith("key points ")) {
    return "keyPoints";
  }

  if (
    normalized === "important figures/dates" ||
    normalized === "important figures and dates" ||
    normalized === "figures/dates" ||
    normalized === "figures and dates"
  ) {
    return "figures";
  }

  if (normalized === "action items" || normalized === "next steps" || normalized === "actions") {
    return "actions";
  }

  return null;
};

const cleanContentLine = (line: string): string =>
  line
    .replace(/^\s*>\s*/, "")
    .replace(/^\s*(?:[-*+]|[\u2022\u25CF\u25E6\u25AA]|\d+[.)])\s+/, "")
    .replace(/^\*{1,2}\s*([^*].*?)\s*\*{1,2}$/, "$1")
    .replace(/\s+/g, " ")
    .trim();

const toUnique = (items: string[], max: number): string[] =>
  Array.from(
    new Set(
      items
        .map((item) => item.trim())
        .filter((item) => item.length > 0)
        .filter((item) => detectSectionHeading(item) === null)
    )
  ).slice(0, max);

const parseSummary = (text: string): ParsedSummary => {
  const sectionLines: Record<SummarySection, string[]> = {
    overview: [],
    keyPoints: [],
    figures: [],
    actions: []
  };

  const rawLines = text.split(/\r?\n/);
  const bulletLines = rawLines.filter((line) => /^\s*(?:[-*+]|[\u2022\u25CF\u25E6\u25AA]|\d+[.)])\s+/.test(line));
  const cleanedLines = rawLines.map(cleanContentLine).filter(Boolean);

  let currentSection: SummarySection | null = null;

  for (const raw of rawLines) {
    const trimmed = raw.trim();
    if (!trimmed) {
      continue;
    }

    const heading = detectSectionHeading(trimmed);
    if (heading) {
      currentSection = heading;
      continue;
    }

    const cleaned = cleanContentLine(trimmed);
    if (!cleaned) {
      continue;
    }

    if (!currentSection) {
      sectionLines.overview.push(cleaned);
      continue;
    }

    sectionLines[currentSection].push(cleaned);
  }

  const keyPoints = toUnique(sectionLines.keyPoints, 20);
  const figures = toUnique(sectionLines.figures.filter((line) => /\d/.test(line)), 20);
  const actions = toUnique(sectionLines.actions, 20);

  const fallbackBullets = toUnique(bulletLines.map(cleanContentLine), 20);
  const fallbackFigures = toUnique(cleanedLines.filter((line) => /\d/.test(line)), 20);
  const fallbackActions = toUnique(
    cleanedLines.filter((line) => /\b(should|next|action|review|follow|prepare|send|complete|develop|implement|conduct|continue)\b/i.test(line)),
    20
  );

  const overview = toUnique(sectionLines.overview, 12).join(" ") || cleanedLines.slice(0, 5).join(" ");

  return {
    overview,
    keyPoints: keyPoints.length ? keyPoints : fallbackBullets,
    figures: figures.length ? figures : fallbackFigures,
    actions: actions.length ? actions : fallbackActions
  };
};

export const SummarizeToolClient = () => {
  const toast = useToast();
  const { isAuthenticated } = useAuth();
  const blockedTrackedRef = useRef(false);
  const [file, setFile] = useState<File | null>(null);
  const [summary, setSummary] = useState("");
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [charCount, setCharCount] = useState(0);
  const [wasTruncated, setWasTruncated] = useState(false);

  const parsedSummary = useMemo(() => parseSummary(summary), [summary]);
  const keyPoints = parsedSummary.keyPoints;
  const figureCandidates = parsedSummary.figures;
  const actionItems = parsedSummary.actions;
  const overview = parsedSummary.overview;

  useEffect(() => {
    if (!file) {
      blockedTrackedRef.current = false;
      return;
    }

    if (!isAuthenticated && !blockedTrackedRef.current) {
      analytics.aiBlocked("not_authenticated");
      blockedTrackedRef.current = true;
    }
  }, [file, isAuthenticated]);

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
                    setWasTruncated(false);

                    try {
                      analytics.aiFeatureUsed("summarize");
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

                      const payload = (await response.json()) as {
                        data?: { summary?: string; truncated?: boolean };
                        error?: { message?: string };
                      };
                      if (!response.ok || !payload.data?.summary) {
                        throw new Error(payload.error?.message ?? "Unable to summarize this file");
                      }

                      setSummary(payload.data.summary);
                      setWasTruncated(Boolean(payload.data.truncated));
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
              onClick={() => {
                const outputName = `${file?.name.replace(/\.pdf$/i, "") ?? "summary"}_summary.txt`;
                downloadText(summary, outputName);
                if (file) {
                  trackToolActivity({
                    tool: "summarize",
                    fileName: outputName,
                    filesProcessed: 1,
                    inputBytes: file.size,
                    outputBytes: new TextEncoder().encode(summary).length
                  });
                }
              }}
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
              {wasTruncated ? (
                <p className="mt-2 text-xs text-amber-800">Large document detected: summary was generated from a shortened input window.</p>
              ) : null}
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

            <details className="rounded-brutal border-2 border-ink bg-paper p-2">
              <summary className="cursor-pointer font-semibold">Raw AI Output</summary>
              <pre className="mt-2 whitespace-pre-wrap break-words text-xs text-muted">{summary}</pre>
            </details>
          </div>
        ) : null}
      </section>
    </div>
  );
};
