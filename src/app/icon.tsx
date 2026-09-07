import { ImageResponse } from "next/og";

// Image metadata
export const size = {
  width: 32,
  height: 32,
};
export const contentType = "image/png";

// TechnoCAT original branded icon generator
export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          fontSize: 18,
          background: "#0E0F13",
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          borderRadius: 6,
          fontWeight: 900,
          fontFamily: "system-ui, -apple-system, sans-serif",
          border: "1.5px solid #ED1C24",
          boxSizing: "border-box",
        }}
      >
        <span style={{ color: "#ffffff", letterSpacing: "-1px" }}>T</span>
        <span style={{ color: "#ED1C24" }}>C</span>
      </div>
    ),
    {
      ...size,
    }
  );
}
