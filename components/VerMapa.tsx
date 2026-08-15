"use client";

import { CircleMarker, MapContainer, Marker, TileLayer, Tooltip } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
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

export default function VerMapa({ lat, lng, rotulo }: VerAppProps) {
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
    </div>
  );
}
