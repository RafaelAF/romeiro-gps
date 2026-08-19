import { ImageResponse } from "next/og";

export const alt = "RomeiroGPS - Mapa de turismo e caravanas em Aparecida - SP";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #1e3a8a 0%, #1d4ed8 100%)",
          color: "#ffffff",
          fontFamily: "system-ui, -apple-system, 'Segoe UI', sans-serif",
          textAlign: "center",
          padding: "0 72px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 28 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: 110,
              height: 110,
              borderRadius: 9999,
              background: "#f59e0b",
              boxShadow: "0 0 0 8px rgba(255,255,255,0.25)",
            }}
          >
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: 9999,
                background: "#ffffff",
              }}
            />
          </div>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start" }}>
            <div style={{ fontSize: 92, fontWeight: 800, letterSpacing: -1 }}>
              RomeiroGPS
            </div>
            <div style={{ fontSize: 40, fontWeight: 600, opacity: 0.92 }}>
              Aparecida - SP
            </div>
          </div>
        </div>
        <div
          style={{
            marginTop: 44,
            fontSize: 34,
            fontWeight: 500,
            opacity: 0.95,
            maxWidth: 960,
          }}
        >
          Pontos de interesse, rotas e caravanas em tempo real. Encontre o Santuário
          Nacional e o Caminho da Fé no mapa.
        </div>
      </div>
    ),
    size
  );
}