"use client";

import { useMemo } from "react";
import {
  CircleMarker,
  MapContainer,
  Marker,
  Popup,
  TileLayer,
  Tooltip,
  useMapEvents,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { CategoriaPoi, PontoEncontro } from "@/lib/types";
import { CATEGORIA_POR_ID, POIS } from "@/lib/pois";
import { CENTRO_APARECIDA } from "@/lib/utils";

function iconeMinhaPosicao(): L.DivIcon {
  const html = `
    <div style="display:flex;flex-direction:column;align-items:center;gap:2px;">
      <div style="width:18px;height:18px;border-radius:9999px;background:#2563eb;border:3px solid #ffffff;box-shadow:0 0 0 6px rgba(37,99,235,.25),0 1px 6px rgba(0,0,0,.35);"></div>
      <span style="font-size:11px;font-weight:700;background:rgba(255,255,255,.9);padding:0 4px;border-radius:6px;color:#1d4ed8;">Você</span>
    </div>`;
  return L.divIcon({ className: "", html, iconSize: [56, 44], iconAnchor: [28, 22] });
}

function iconeEncontro(): L.DivIcon {
  const html = `
    <svg width="36" height="44" viewBox="0 0 24 32" xmlns="http://www.w3.org/2000/svg" style="filter:drop-shadow(0 1px 4px rgba(0,0,0,.4));">
      <path d="M2 8 L22 8 L12 26 Z" fill="#dc2626" stroke="#7f1d1d" stroke-width="1.5"/>
      <rect x="1.2" y="1" width="21.6" height="4" rx="1" fill="#b91c1c" stroke="#7f1d1d" stroke-width="1"/>
      <line x1="12" y1="8" x2="12" y2="26" stroke="#7f1d1d" stroke-width="1.5"/>
    </svg>`;
  return L.divIcon({ className: "", html, iconSize: [36, 44], iconAnchor: [18, 42] });
}

interface CapturarEncontroProps {
  aoDefinir: (lat: number, lng: number) => void;
}

function CapturarEncontro({ aoDefinir }: CapturarEncontroProps) {
  useMapEvents({
    contextmenu: (evento) => {
      aoDefinir(evento.latlng.lat, evento.latlng.lng);
    },
  });
  return null;
}

export interface MapViewProps {
  minhaPosicao: { lat: number; lng: number } | null;
  pontoEncontro: PontoEncontro | null;
  categoriasAtivas: CategoriaPoi[];
  aoDefinirEncontro: (lat: number, lng: number) => void;
}

export default function MapView({
  minhaPosicao,
  pontoEncontro,
  categoriasAtivas,
  aoDefinirEncontro,
}: MapViewProps) {
  const poisVisiveis = useMemo(
    () => POIS.filter((poi) => categoriasAtivas.includes(poi.categoria)),
    [categoriasAtivas]
  );

  return (
    <MapContainer
      center={[CENTRO_APARECIDA.lat, CENTRO_APARECIDA.lng]}
      zoom={15}
      zoomControl={false}
      className="h-full w-full"
      attributionControl={false}
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution="&copy; OpenStreetMap"
      />
      <CapturarEncontro aoDefinir={aoDefinirEncontro} />

      {poisVisiveis.map((poi) => {
        const categoria = CATEGORIA_POR_ID[poi.categoria];
        return (
          <CircleMarker
            key={poi.id}
            center={[poi.lat, poi.lng]}
            radius={8}
            pathOptions={{ color: "#ffffff", weight: 2, fillColor: categoria.cor, fillOpacity: 0.9 }}
          >
            <Popup>
              <strong>{poi.nome}</strong>
              <br />
              <span className="text-sm">{categoria.rotulo}</span>
            </Popup>
          </CircleMarker>
        );
      })}

      {pontoEncontro && (
        <>
          <CircleMarker
            center={[pontoEncontro.lat, pontoEncontro.lng]}
            radius={24}
            pathOptions={{ color: "#dc2626", weight: 2, fillColor: "#dc2626", fillOpacity: 0.15 }}
          />
          <Marker position={[pontoEncontro.lat, pontoEncontro.lng]} icon={iconeEncontro()}>
            <Tooltip direction="top" offset={[0, -10]}>
              {pontoEncontro.descricao}
            </Tooltip>
          </Marker>
        </>
      )}

      {minhaPosicao && (
        <>
          <CircleMarker
            center={[minhaPosicao.lat, minhaPosicao.lng]}
            radius={40}
            pathOptions={{ color: "#2563eb", weight: 1, fillColor: "#2563eb", fillOpacity: 0.08 }}
          />
          <Marker position={[minhaPosicao.lat, minhaPosicao.lng]} icon={iconeMinhaPosicao()}>
            <Popup>
              <strong>Você</strong>
              <br />
              <span className="text-sm">{`${minhaPosicao.lat.toFixed(5)}, ${minhaPosicao.lng.toFixed(5)}`}</span>
            </Popup>
          </Marker>
        </>
      )}
    </MapContainer>
  );
}
