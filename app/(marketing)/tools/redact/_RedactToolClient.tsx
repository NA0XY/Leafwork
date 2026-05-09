"use client";

import { useState } from "react";

import { RedactPanel, type RedactionArea } from "@/components/tools/RedactPanel";
import { DropZone } from "@/components/ui/DropZone";
import { useToast } from "@/hooks/useToast";
import { withPdfLib } from "@/lib/pdf/engine";
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
          const doc = await pdfLib.PDFDocument.load(bytes);

          for (const area of areas) {
            const pageIndex = Math.max(0, area.page - 1);
            const page = doc.getPage(pageIndex);
            const size = page.getSize();

            page.drawRectangle({
              x: area.x * size.width,
              y: size.height - (area.y + area.height) * size.height,
              width: area.width * size.width,
              height: area.height * size.height,
              color: pdfLib.rgb(0, 0, 0),
              borderColor: pdfLib.rgb(0, 0, 0),
              borderWidth: 0
            });
          }

          const output = await doc.save({ useObjectStreams: true, addDefaultPage: false });
          return new Blob([output], { type: "application/pdf" });
        });

        if (!result.data) {
          toast.error("Redaction failed", result.error?.message ?? "Unable to apply redactions");
          return;
        }

        downloadBlob(result.data, `${file.name.replace(/\.pdf$/i, "")}_redacted.pdf`);
        trackToolActivity({
          tool: "redact",
          fileName: file.name,
          filesProcessed: 1,
          inputBytes: file.size,
          outputBytes: result.data.size
        });
        toast.success("Redacted PDF downloaded");
      }}
    />
  );
};
