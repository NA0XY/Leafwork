import { ImageResponse } from "next/og";

export const alt = "Leafwork privacy-first PDF tools that run in your browser";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const runtime = "edge";

const facts = ["0 bytes uploaded for core tools", "No account required", "Browser-local workflows"];

export default function TwitterImage() {
  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "#f5f0e8",
          color: "#1a1a1a",
          padding: "52px 56px",
          border: "16px solid #1a6b3c",
          fontFamily: "Arial, sans-serif"
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "24px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "16px", fontSize: 38, fontWeight: 800 }}>
            <svg width="42" height="42" viewBox="0 0 32 32">
              <path
                d="M16 2 C8 2 3 10 3 18 C3 24 8 30 16 30 C16 30 16 18 28 8 C22 4 18 2 16 2Z"
                fill="#1a6b3c"
              />
              <path d="M16 30 C16 18 10 12 3 18" fill="none" stroke="#22c55e" strokeWidth="1.5" />
            </svg>
            Leafwork
          </div>
          <div style={{ color: "#1a6b3c", fontSize: 24, fontWeight: 800 }}>leafworkpdf.vercel.app</div>
        </div>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "18px",
            maxWidth: "980px"
          }}
        >
          <div
            style={{
              color: "#1a6b3c",
              fontSize: 28,
              fontWeight: 800
            }}
          >
            Free PDF tools. No upload required.
          </div>
          <div
            style={{
              fontSize: 78,
              fontWeight: 900,
              lineHeight: 1.02
            }}
          >
            Edit, sign, and clean PDFs in your browser.
          </div>
          <div
            style={{
              color: "#4b5563",
              fontSize: 30,
              lineHeight: 1.25
            }}
          >
            Merge, split, redact, convert, and remove metadata with privacy-first local workflows.
          </div>
        </div>

        <div
          style={{
            display: "flex",
            gap: "14px"
          }}
        >
          {facts.map((text) => (
            <div
              key={text}
              style={{
                display: "flex",
                alignItems: "center",
                background: "#ffffff",
                border: "2px solid #1a1a1a",
                borderRadius: "4px",
                color: "#1a6b3c",
                fontSize: 22,
                fontWeight: 700,
                padding: "10px 16px"
              }}
            >
              {text}
            </div>
          ))}
        </div>
      </div>
    ),
    { ...size }
  );
}
