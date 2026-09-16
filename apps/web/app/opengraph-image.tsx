import { ImageResponse } from "next/og";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "#08090b",
          position: "relative",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "radial-gradient(ellipse 900px 500px at 15% -10%, rgba(215,255,63,0.16), transparent 60%), radial-gradient(ellipse 700px 500px at 100% 10%, rgba(255,93,93,0.12), transparent 55%)",
            display: "flex",
          }}
        />
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            border: "1px solid #262a33",
            borderRadius: 999,
            padding: "10px 22px",
            marginBottom: 36,
          }}
        >
          <div
            style={{
              width: 12,
              height: 12,
              borderRadius: "50%",
              background: "#ff5d5d",
              display: "flex",
            }}
          />
          <div
            style={{
              fontSize: 22,
              color: "#8b93a1",
              fontFamily: "monospace",
              letterSpacing: 4,
              textTransform: "uppercase",
            }}
          >
            Live trivia, real stakes
          </div>
        </div>
        <div
          style={{
            display: "flex",
            fontSize: 130,
            fontWeight: 700,
            color: "#f5f6f2",
            letterSpacing: -2,
          }}
        >
          OVER<span style={{ color: "#d7ff3f" }}>TIME</span>
        </div>
        <div
          style={{
            display: "flex",
            marginTop: 28,
            fontSize: 30,
            color: "#8b93a1",
            fontFamily: "sans-serif",
          }}
        >
          Your group chat&apos;s trivia debates, as a weekly live event with real stakes.
        </div>
      </div>
    ),
    size,
  );
}
