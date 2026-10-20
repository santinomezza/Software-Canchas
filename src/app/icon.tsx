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
          background: "#07110F",
          borderRadius: 8,
        }}
      >
        <div
          style={{
            width: 18,
            height: 12,
            border: "2px solid #2EE59D",
            borderTopColor: "transparent",
            borderRightColor: "transparent",
            borderRadius: 999,
            transform: "rotate(-38deg)",
          }}
        />
        <div
          style={{
            position: "absolute",
            width: 7,
            height: 7,
            borderRadius: 999,
            background: "#2EE59D",
            top: 6,
            right: 7,
          }}
        />
      </div>
    ),
    size,
  );
}
