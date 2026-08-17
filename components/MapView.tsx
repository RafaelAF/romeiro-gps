"use client";

import { useEffect, useMemo, useState } from "react";
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

function iconeMinhaPosicao(rumo: number | null): L.DivIcon {
  const coneHtml = rumo !== null
    ? `<svg width="48" height="48" viewBox="0 0 48 48" style="position:absolute;top:-15px;left:-15px;transform:rotate(${rumo}deg);transform-origin:24px 24px;pointer-events:none;z-index:-1;">
         <path d="M24 24 L10 2 A24 24 0 0 1 38 2 Z" fill="url(#blue-cone)" opacity="0.3" />
         <path d="M24 16 L19 23 L24 21 L29 23 Z" fill="#1d4ed8" />
         <defs>
           <linearGradient id="blue-cone" x1="0%" y1="100%" x2="0%" y2="0%">
             <stop offset="0%" stop-color="#2563eb" stop-opacity="0" />
             <stop offset="100%" stop-color="#2563eb" stop-opacity="0.85" />
           </linearGradient>
         </defs>
       </svg>`
    : "";

  const html = `
    <div style="display:flex;flex-direction:column;align-items:center;position:relative;width:18px;height:44px;">
      <div style="position:relative;width:18px;height:18px;">
        ${coneHtml}
        <div style="width:18px;height:18px;border-radius:9999px;background:#2563eb;border:3px solid #ffffff;box-shadow:0 1px 6px rgba(0,0,0,.35);position:absolute;top:0;left:0;"></div>
      </div>
      <span style="font-size:11px;font-weight:700;background:rgba(255,255,255,.95);padding:1px 6px;border-radius:6px;color:#1d4ed8;box-shadow:0 1px 4px rgba(0,0,0,.15);white-space:nowrap;margin-top:2px;">Você</span>
    </div>`;
  return L.divIcon({ className: "", html, iconSize: [18, 44], iconAnchor: [9, 9] });
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

function CapturarCliquesBussola({ aoClicar }: { aoClicar: () => void }) {
  useMapEvents({
    click: () => {
      aoClicar();
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
  const [rumo, setRumo] = useState<number | null>(null);

  useEffect(() => {
    if (!minhaPosicao) {
      return;
    }

    const aoMudarOrientacao = (e: DeviceOrientationEvent) => {
      if ("webkitCompassHeading" in e) {
        setRumo(e.webkitCompassHeading as number);
      } else if (e.alpha !== null) {
        setRumo(360 - e.alpha);
      }
    };

    const ativarListener = () => {
      const w = window as unknown as EventTarget;
      if ("ondeviceorientationabsolute" in window) {
        w.addEventListener("deviceorientationabsolute", aoMudarOrientacao as EventListener);
      } else {
        w.addEventListener("deviceorientation", aoMudarOrientacao as EventListener);
      }
    };

    const DeviceOrientationWithPerms = typeof window !== "undefined"
      ? (window as unknown as {
          DeviceOrientationEvent?: {
            requestPermission?: () => Promise<PermissionState>;
          };
        }).DeviceOrientationEvent
      : undefined;

    if (
      DeviceOrientationWithPerms &&
      typeof DeviceOrientationWithPerms.requestPermission === "function"
    ) {
      DeviceOrientationWithPerms.requestPermission()
        .then((state) => {
          if (state === "granted") {
            ativarListener();
          }
        })
        .catch(() => void 0);
    } else {
      ativarListener();
    }

    return () => {
      const w = window as unknown as EventTarget;
      w.removeEventListener("deviceorientationabsolute", aoMudarOrientacao as EventListener);
      w.removeEventListener("deviceorientation", aoMudarOrientacao as EventListener);
      setRumo(null);
    };
  }, [minhaPosicao]);

  // Se o usuário clicar em qualquer lugar do mapa, tentamos solicitar a permissão da bússola no iOS
  const tentarPermissaoBussolaIOS = () => {
    const DeviceOrientationWithPerms = typeof window !== "undefined"
      ? (window as unknown as {
          DeviceOrientationEvent?: {
            requestPermission?: () => Promise<PermissionState>;
          };
        }).DeviceOrientationEvent
      : undefined;

    if (
      DeviceOrientationWithPerms &&
      typeof DeviceOrientationWithPerms.requestPermission === "function"
    ) {
      DeviceOrientationWithPerms.requestPermission()
        .then((state) => {
          if (state === "granted") {
            // O effect acima vai registrar o listener
          }
        })
        .catch(() => void 0);
    }
  };

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
      <CapturarCliquesBussola aoClicar={tentarPermissaoBussolaIOS} />

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
          <Marker position={[minhaPosicao.lat, minhaPosicao.lng]} icon={iconeMinhaPosicao(rumo)}>
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
