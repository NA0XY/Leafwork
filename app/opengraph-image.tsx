import { ImageResponse } from "next/og";

export const runtime = "edge";

export const alt = "Leafwork PDF Tools";
export const size = {
  width: 1200,
  height: 630
};
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "linear-gradient(140deg, #f5f0e8 0%, #d9f7e2 45%, #bcf0ce 100%)",
          color: "#103d27",
          padding: "56px"
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "14px", fontSize: 36, fontWeight: 800 }}>
          <span
            style={{
              width: "30px",
              height: "30px",
              borderRadius: "999px",
              border: "3px solid #166534",
              background: "#22c55e"
            }}
          />
          Leafwork
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          <div style={{ fontSize: 72, fontWeight: 900, lineHeight: 1.03 }}>Free PDF tools.</div>
          <div style={{ fontSize: 62, fontWeight: 900, lineHeight: 1.03 }}>No upload required.</div>
          <div style={{ fontSize: 30, opacity: 0.9 }}>
            Merge. Split. Compress. Sign. Redact. Summarize.
          </div>
        </div>

        <div style={{ fontSize: 24, fontWeight: 700, opacity: 0.9 }}>leafworkpdf.vercel.app</div>
      </div>
    ),
    {
      ...size
    }
  );
}
