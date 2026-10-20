import { ImageResponse } from "next/og";

export const alt = "cancha — software de gestión para complejos deportivos";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "#07110F",
          padding: 72,
          position: "relative",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: -220,
            right: -160,
            width: 760,
            height: 760,
            borderRadius: 999,
            background:
              "radial-gradient(circle, rgba(46,229,157,0.35) 0%, rgba(46,229,157,0) 62%)",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: -260,
            left: -120,
            width: 720,
            height: 720,
            borderRadius: 999,
            background:
              "radial-gradient(circle, rgba(217,184,112,0.28) 0%, rgba(217,184,112,0) 60%)",
          }}
        />

        <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
          <div
            style={{
              width: 46,
              height: 46,
              borderRadius: 14,
              border: "2px solid rgba(233,240,237,0.35)",
              display: "flex",
            }}
          />
          <div style={{ fontSize: 34, color: "#E9F0ED", letterSpacing: "-0.02em" }}>
            {process.env.NEXT_PUBLIC_BRAND_NAME ?? 'cancha'}
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div
            style={{
              fontSize: 68,
              lineHeight: 1.06,
              color: "#E9F0ED",
              letterSpacing: "-0.035em",
              maxWidth: 900,
            }}
          >
            Tu complejo deportivo, abierto 24/7
          </div>
          <div style={{ fontSize: 28, color: "#9FB3AC", maxWidth: 820, lineHeight: 1.4 }}>
            Reservas garantizadas con Mercado Pago, caja, stock y estadísticas en un solo panel.
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div
            style={{
              background: "#2EE59D",
              color: "#04140E",
              fontSize: 24,
              fontWeight: 600,
              padding: "14px 30px",
              borderRadius: 999,
            }}
          >
            Probá gratis 1 mes
          </div>
          <div style={{ fontSize: 24, color: "#7C918A" }}>Argentina · México · LATAM</div>
        </div>
      </div>
    ),
    size,
  );
}
