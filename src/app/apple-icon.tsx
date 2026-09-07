import { ImageResponse } from "next/og";

// Image metadata

export const size = {
  width: 180,
  height: 180,
};
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          fontSize: 96,
          background: "#0E0F13",
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          borderRadius: 36,
          fontWeight: 900,
          fontFamily: "system-ui, -apple-system, sans-serif",
          border: "6px solid #ED1C24",
          boxSizing: "border-box",
        }}
      >
        <span style={{ color: "#ffffff", letterSpacing: "-4px" }}>T</span>
        <span style={{ color: "#ED1C24" }}>C</span>
      </div>
    ),
    {
      ...size,
    }
  );
}
