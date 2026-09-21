import { ImageResponse } from "next/og";

const GROEN = "#0b853f";

export function renderAppIcon(size: number) {
  const maanMiddellijn = Math.round(size * 0.6);
  const verschuiving = Math.round(maanMiddellijn * 0.34);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: GROEN,
        }}
      >
        <div
          style={{
            position: "relative",
            width: maanMiddellijn,
            height: maanMiddellijn,
            display: "flex",
          }}
        >
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: maanMiddellijn,
              height: maanMiddellijn,
              borderRadius: 9999,
              background: "#ffffff",
              display: "flex",
            }}
          />
          <div
            style={{
              position: "absolute",
              top: 0,
              left: verschuiving,
              width: maanMiddellijn,
              height: maanMiddellijn,
              borderRadius: 9999,
              background: GROEN,
              display: "flex",
            }}
          />
        </div>
      </div>
    ),
    { width: size, height: size }
  );
}
