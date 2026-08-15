"use client";

import { useState } from "react";
import { CircleMarker, MapContainer, Marker, Popup, TileLayer, Tooltip } from "react-leaflet";
import L from "leaflet";
import { Navigation } from "lucide-react";
import "leaflet/dist/leaflet.css";
import { useCaravanaTracking } from "@/lib/useCaravanaTracking";
import type { VerAppProps } from "@/components/VerApp";

function iconeEncontro(): L.DivIcon {
  const html = `
    <svg width="36" height="44" viewBox="0 0 24 32" xmlns="http://www.w3.org/2000/svg" style="filter:drop-shadow(0 1px 4px rgba(0,0,0,.4));">
      <path d="M2 8 L22 8 L12 26 Z" fill="#dc2626" stroke="#7f1d1d" stroke-width="1.5"/>
      <rect x="1.2" y="1" width="21.6" height="4" rx="1" fill="#b91c1c" stroke="#7f1d1d" stroke-width="1"/>
      <line x1="12" y1="8" x2="12" y2="26" stroke="#7f1d1d" stroke-width="1.5"/>
    </svg>`;
  return L.divIcon({ className: "", html, iconSize: [36, 44], iconAnchor: [18, 42] });
}

function iconeMinhaPosicao(): L.DivIcon {
  const html = `
    <div style="display:flex;flex-direction:column;align-items:center;gap:2px;">
      <div style="width:18px;height:18px;border-radius:9999px;background:#2563eb;border:3px solid #ffffff;box-shadow:0 0 0 6px rgba(37,99,235,.25),0 1px 6px rgba(0,0,0,.35);"></div>
      <span style="font-size:11px;font-weight:700;background:rgba(255,255,255,.9);padding:0 4px;border-radius:6px;color:#1d4ed8;">Você</span>
    </div>`;
  return L.divIcon({ className: "", html, iconSize: [56, 44], iconAnchor: [28, 22] });
}

export default function VerMapa({ lat, lng, rotulo }: VerAppProps) {
  const { posicao, status, erro, iniciar, parar } = useCaravanaTracking();
  const [mostrarLocal, setMostrarLocal] = useState(false);

  const alternarLocalizacao = () => {
    if (mostrarLocal) {
      parar();
      setMostrarLocal(false);
      return;
    }
    parar();
    iniciar();
    setMostrarLocal(true);
  };

  const tentarNovamente = () => {
    parar();
    iniciar();
  };

  return (
    <div className="relative h-dvh w-full overflow-hidden bg-zinc-100">
      <MapContainer
        center={[lat, lng]}
        zoom={16}
        zoomControl={false}
        className="h-full w-full"
        attributionControl={false}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution="&copy; OpenStreetMap"
        />
        <CircleMarker
          center={[lat, lng]}
          radius={24}
          pathOptions={{ color: "#dc2626", weight: 2, fillColor: "#dc2626", fillOpacity: 0.15 }}
        />
        <Marker position={[lat, lng]} icon={iconeEncontro()}>
          <Tooltip direction="top" offset={[0, -10]} permanent>
            {rotulo}
          </Tooltip>
        </Marker>

        {mostrarLocal && posicao && (
          <>
            <CircleMarker
              center={[posicao.lat, posicao.lng]}
              radius={40}
              pathOptions={{ color: "#2563eb", weight: 1, fillColor: "#2563eb", fillOpacity: 0.08 }}
            />
            <Marker position={[posicao.lat, posicao.lng]} icon={iconeMinhaPosicao()}>
              <Popup>
                <strong>Você</strong>
                <br />
                <span className="text-sm">{`${posicao.lat.toFixed(5)}, ${posicao.lng.toFixed(5)}`}</span>
              </Popup>
            </Marker>
          </>
        )}
      </MapContainer>

      <div className="pointer-events-none absolute inset-x-0 top-0 z-[900] flex justify-center p-3">
        <div className="rounded-2xl bg-white/95 px-4 py-2 shadow-md">
          <p className="text-sm font-extrabold text-blue-900">RomeiroGPS</p>
          <p className="text-[11px] font-medium text-zinc-500">Ponto de encontro · Aparecida - SP</p>
        </div>
      </div>

      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-[900] p-3">
        <div className="mx-auto max-w-2xl rounded-2xl bg-white px-5 py-4 shadow-lg">
          <p className="text-base font-extrabold text-zinc-900">{rotulo}</p>
          <p className="mt-0.5 font-mono text-xs text-zinc-500">
            {lat.toFixed(5)}, {lng.toFixed(5)}
          </p>
        </div>
      </div>

      <div className="pointer-events-none absolute inset-x-0 bottom-28 z-[900] flex flex-col items-center gap-2 px-4">
        {mostrarLocal && (status === "negado" || status === "erro") && (
          <p className="max-w-sm rounded-full bg-white/95 px-4 py-1.5 text-center text-xs font-semibold text-red-700 shadow-md">
            {status === "negado"
              ? "Permissão de localização negada."
              : erro || "Não foi possível obter a localização."}
          </p>
        )}

        {mostrarLocal && status === "solicitando" && (
          <button
            type="button"
            disabled
            className="pointer-events-auto inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-white/95 px-5 py-3 text-sm font-bold text-zinc-500 shadow-md"
          >
            <Navigation className="h-5 w-5 animate-pulse" />
            Buscando localização...
          </button>
        )}

        {mostrarLocal && status === "ativo" && (
          <button
            type="button"
            onClick={alternarLocalizacao}
            className="pointer-events-auto inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-emerald-600 px-5 py-3 text-sm font-bold text-white shadow-md active:scale-[.98]"
          >
            <Navigation className="h-5 w-5" />
            Minha localização ativa
          </button>
        )}

        {!mostrarLocal && (
          <button
            type="button"
            onClick={alternarLocalizacao}
            className="pointer-events-auto inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-blue-700 px-5 py-3 text-sm font-bold text-white shadow-md active:scale-[.98]"
          >
            <Navigation className="h-5 w-5" />
            Ver minha localização
          </button>
        )}

        {mostrarLocal && (status === "negado" || status === "erro") && (
          <button
            type="button"
            onClick={tentarNovamente}
            className="pointer-events-auto inline-flex min-h-11 items-center justify-center rounded-full bg-white px-5 py-2.5 text-sm font-bold text-blue-700 shadow-md active:scale-[.98]"
          >
            Tentar novamente
          </button>
        )}
      </div>
    </div>
  );
}
