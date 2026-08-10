import { ImageResponse } from "next/og";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#2b0f18",
          color: "#C9A46C",
          fontSize: 13,
          fontWeight: 600,
          fontFamily: "serif",
        }}
      >
        F&E
      </div>
    ),
    { ...size },
  );
}
