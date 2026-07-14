import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

// Same badge as icon.js, scaled down. iOS applies its own corner mask to
// apple-touch-icon, so no borderRadius on the outer container here.
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
          background: "linear-gradient(135deg, #FF7A33, #FFB066)",
        }}
      >
        <div
          style={{
            width: 112,
            height: 112,
            borderRadius: "50%",
            background: "white",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div style={{ width: 42, height: 42, borderRadius: "50%", background: "#1B2A4A" }} />
        </div>
      </div>
    ),
    { ...size }
  );
}
