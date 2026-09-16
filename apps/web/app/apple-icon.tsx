import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#08090b",
          borderRadius: 40,
          position: "relative",
        }}
      >
        <div
          style={{
            fontSize: 84,
            fontWeight: 700,
            color: "#d7ff3f",
            fontFamily: "sans-serif",
          }}
        >
          OT
        </div>
        <div
          style={{
            position: "absolute",
            top: 34,
            right: 34,
            width: 18,
            height: 18,
            borderRadius: "50%",
            background: "#ff5d5d",
          }}
        />
      </div>
    ),
    size,
  );
}
