"use client";

import { useState } from "react";

import { RedactPanel, type RedactionArea } from "@/components/tools/RedactPanel";
import { DropZone } from "@/components/ui/DropZone";
import { useToast } from "@/hooks/useToast";
import { withPdfLib } from "@/lib/pdf/engine";
import { secureRedactPdfBytes } from "@/lib/pdf/security";
import { trackToolActivity } from "@/lib/utils/activity";
import { downloadBlob } from "@/lib/utils/file";

export const RedactToolClient = () => {
  const [file, setFile] = useState<File | null>(null);
  const [bytes, setBytes] = useState<Uint8Array | null>(null);
  const toast = useToast();

  if (!file || !bytes) {
    return (
      <DropZone
        multiple={false}
        onFiles={(files) => {
          const next = files[0];
          if (!next) {
            return;
          }

          void (async () => {
            setFile(next);
            setBytes(new Uint8Array(await next.arrayBuffer()));
          })();
        }}
      />
    );
  }

  return (
    <RedactPanel
      file={file}
      bytes={bytes}
      onRemoveFile={() => {
        setFile(null);
        setBytes(null);
      }}
      onApply={async (areas: RedactionArea[]) => {
        if (!areas.length) {
          toast.info("No redactions", "Draw at least one redaction area first");
          return;
        }

        const result = await withPdfLib(async (pdfLib) => {
          const output = await secureRedactPdfBytes(
            pdfLib,
            bytes,
            areas.map((area) => ({
              pageNumber: area.page,
              x: area.x,
              y: area.y,
              width: area.width,
              height: area.height
            }))
          );

          return {
            blob: new Blob([output.bytes], { type: "application/pdf" }),
            warnings: output.warnings
          };
        });

        if (!result.data) {
          toast.error("Redaction failed", result.error?.message ?? "Unable to apply redactions");
          return;
        }

        downloadBlob(result.data.blob, `${file.name.replace(/\.pdf$/i, "")}_redacted.pdf`);
        trackToolActivity({
          tool: "redact",
          fileName: file.name,
          filesProcessed: 1,
          inputBytes: file.size,
          outputBytes: result.data.blob.size
        });
        toast.success(
          "Redacted PDF downloaded",
          result.data.warnings.length ? result.data.warnings.join(" ") : "Redacted pages were flattened before export."
        );
      }}
    />
  );
};
