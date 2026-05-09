import { ImageResponse } from "next/og";

export const alt = "Leafwork - Free PDF Tools. No Upload Required.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const runtime = "edge";

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
          padding: "60px",
          borderLeft: "12px solid #1a6b3c"
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "16px",
            fontSize: 32,
            fontWeight: 800,
            color: "#1a1a1a",
            fontFamily: "system-ui, sans-serif"
          }}
        >
          <div
            style={{
              width: 32,
              height: 32,
              background: "#1a6b3c",
              borderRadius: "4px"
            }}
          />
          Leafwork
        </div>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "12px",
            fontFamily: "system-ui, sans-serif"
          }}
        >
          <div
            style={{
              fontSize: 64,
              fontWeight: 900,
              color: "#1a1a1a",
              lineHeight: 1.05
            }}
          >
            Free PDF Tools.
          </div>
          <div
            style={{
              fontSize: 52,
              fontWeight: 900,
              color: "#1a6b3c",
              lineHeight: 1.05
            }}
          >
            No Upload Required.
          </div>
          <div
            style={{
              fontSize: 26,
              color: "#555",
              fontFamily: "system-ui, sans-serif"
            }}
          >
            Merge . Split . Compress . Sign . Redact - all in your browser.
          </div>
        </div>

        <div
          style={{
            display: "flex",
            gap: "20px",
            fontFamily: "system-ui, sans-serif"
          }}
        >
          {["0 bytes uploaded", "0 ads", "unlimited file size"].map((text) => (
            <div
              key={text}
              style={{
                padding: "8px 16px",
                background: "#e8f5e9",
                border: "2px solid #1a1a1a",
                borderRadius: "4px",
                fontSize: 18,
                fontWeight: 700,
                color: "#1a6b3c"
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
