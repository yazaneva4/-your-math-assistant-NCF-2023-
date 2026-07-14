import { ImageResponse } from "next/og";

export const size = { width: 512, height: 512 };
export const contentType = "image/png";

// Concentric-circle badge — deliberately built from only width/height/
// border-radius/background/flex, since more exotic CSS (border-triangle
// hacks, transforms) isn't reliably supported by every ImageResponse
// rendering environment.
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
          background: "linear-gradient(135deg, #FF7A33, #FFB066)",
          borderRadius: 96,
        }}
      >
        <div
          style={{
            width: 320,
            height: 320,
            borderRadius: "50%",
            background: "white",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div style={{ width: 120, height: 120, borderRadius: "50%", background: "#1B2A4A" }} />
        </div>
      </div>
    ),
    { ...size }
  );
}
