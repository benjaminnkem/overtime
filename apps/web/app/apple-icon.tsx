import { readFile } from "node:fs/promises";
import path from "node:path";
import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default async function AppleIcon() {
  const fontData = await readFile(
    path.join(process.cwd(), "app/fonts/SpaceGrotesk-Bold.ttf"),
  );

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
            fontFamily: "Space Grotesk",
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
    {
      ...size,
      fonts: [{ name: "Space Grotesk", data: fontData, weight: 700, style: "normal" }],
    },
  );
}
