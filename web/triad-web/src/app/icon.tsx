import { ImageResponse } from "next/og";

export const size = {
  width: 512,
  height: 512,
};

export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          height: "100%",
          width: "100%",
          alignItems: "center",
          justifyContent: "center",
          background:
            "linear-gradient(135deg, rgba(251,247,255,1) 0%, rgba(255,244,248,1) 45%, rgba(245,251,255,1) 100%)",
        }}
      >
        <div
          style={{
            display: "flex",
            height: 280,
            width: 280,
            alignItems: "center",
            justifyContent: "center",
            borderRadius: 72,
            background: "linear-gradient(135deg, #7c4dff 0%, #db2677 100%)",
            color: "white",
            fontSize: 154,
            fontWeight: 800,
          }}
        >
          T
        </div>
      </div>
    ),
    size,
  );
}
