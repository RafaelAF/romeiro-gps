"use client";

import { Fragment, useEffect, useState } from "react";
import {
  CircleMarker,
  MapContainer,
  Marker,
  Polyline,
  Popup,
  TileLayer,
  Tooltip,
  useMapEvents,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { CoordenadaRota, PoiDinamico, PontoEncontro } from "@/lib/types";
import { TIPO_POR_ID } from "@/lib/poisDinamicos";
import { iconeEncontro, iconeMinhaPosicao, iconeMembro, iconePoi } from "@/lib/icones";
import { CENTRO_APARECIDA } from "@/lib/utils";

function iconeParada(indice: number): L.DivIcon {
  const html = `
    <div style="width:26px;height:26px;border-radius:9999px;background:#1d4ed8;border:3px solid #ffffff;box-shadow:0 1px 5px rgba(0,0,0,.3);display:flex;align-items:center;justify-content:center;color:#fff;font-size:13px;font-weight:800;">${indice}</div>`;
  return L.divIcon({ className: "", html, iconSize: [26, 26], iconAnchor: [13, 13] });
}

export interface MembroMapaLider {
  id: string;
  nome: string;
  cor: string;
  lat: number;
  lng: number;
  online: boolean;
  foraDoTrajeto: boolean;
  status: string;
  statusTs: number;
}

export interface MapViewProps {
  minhaPosicao: { lat: number; lng: number } | null;
  pontoEncontro: PontoEncontro | null;
  pois: PoiDinamico[];
  linhaRota: [number, number][];
  pontosRota: CoordenadaRota[];
  navegacao: [number, number][] | null;
  membros: MembroMapaLider[];
  modoCriarRota: boolean;
  aoLongPress: (lat: number, lng: number) => void;
  aoAdicionarPontoRota: (lat: number, lng: number) => void;
  aoClicarPoi: (id: string, nome: string, rotulo: string, lat: number, lng: number) => void;
  aoClicarEncontro: () => void;
}

interface CapturarEventosProps {
  modoCriarRota: boolean;
  aoLongPress: (lat: number, lng: number) => void;
  aoAdicionarPontoRota: (lat: number, lng: number) => void;
  aoClicarMapa: () => void;
}

function CapturarEventos({
  modoCriarRota,
  aoLongPress,
  aoAdicionarPontoRota,
  aoClicarMapa,
}: CapturarEventosProps) {
  useMapEvents({
    contextmenu: (evento) => {
      if (modoCriarRota) aoAdicionarPontoRota(evento.latlng.lat, evento.latlng.lng);
      else aoLongPress(evento.latlng.lat, evento.latlng.lng);
    },
    click: (evento) => {
      if (modoCriarRota) aoAdicionarPontoRota(evento.latlng.lat, evento.latlng.lng);
      else aoClicarMapa();
    },
  });
  return null;
}

export default function MapView({
  minhaPosicao,
  pontoEncontro,
  pois,
  linhaRota,
  pontosRota,
  navegacao,
  membros,
  modoCriarRota,
  aoLongPress,
  aoAdicionarPontoRota,
  aoClicarPoi,
  aoClicarEncontro,
}: MapViewProps) {
  const [rumo, setRumo] = useState<number | null>(null);
  const [agora, setAgora] = useState(() => Date.now());

  useEffect(() => {
    const int = setInterval(() => setAgora(Date.now()), 5000);
    return () => clearInterval(int);
  }, []);

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
      <CapturarEventos
        modoCriarRota={modoCriarRota}
        aoLongPress={aoLongPress}
        aoAdicionarPontoRota={aoAdicionarPontoRota}
        aoClicarMapa={tentarPermissaoBussolaIOS}
      />

      {pois.map((poi) => {
        const meta = TIPO_POR_ID[poi.tipo];
        return (
          <Marker
            key={poi.id}
            position={[poi.lat, poi.lng]}
            icon={iconePoi(meta.cor, meta.letra)}
            eventHandlers={{
              click: () => aoClicarPoi(poi.id, poi.nome, meta.rotulo, poi.lat, poi.lng),
            }}
          />
        );
      })}

      {pontoEncontro && (
        <>
          <CircleMarker
            center={[pontoEncontro.lat, pontoEncontro.lng]}
            radius={24}
            pathOptions={{ color: "#dc2626", weight: 2, fillColor: "#dc2626", fillOpacity: 0.15 }}
          />
          <Marker
            position={[pontoEncontro.lat, pontoEncontro.lng]}
            icon={iconeEncontro()}
            eventHandlers={{ click: () => aoClicarEncontro() }}
          >
            <Tooltip direction="top" offset={[0, -10]}>
              {pontoEncontro.descricao}
            </Tooltip>
          </Marker>
        </>
      )}

      {linhaRota.length > 1 && (
        <Polyline
          positions={linhaRota}
          pathOptions={{ color: "#1d4ed8", weight: 5, opacity: 0.85 }}
        />
      )}

      {pontosRota.map((p, i) => (
        <Marker key={`${p.lat}-${p.lng}-${i}`} position={[p.lat, p.lng]} icon={iconeParada(i + 1)}>
          {p.nome && (
            <Tooltip direction="top" offset={[0, -14]}>
              {p.nome}
            </Tooltip>
          )}
        </Marker>
      ))}

      {navegacao && navegacao.length > 1 && (
        <Polyline
          positions={navegacao}
          pathOptions={{ color: "#059669", weight: 6, opacity: 0.9 }}
        />
      )}

      {membros.map((m) => (
        <Fragment key={m.id}>
          {m.foraDoTrajeto && (
            <CircleMarker
              center={[m.lat, m.lng]}
              radius={22}
              pathOptions={{ color: "#dc2626", weight: 2, fillColor: "#dc2626", fillOpacity: 0.18 }}
            />
          )}
          <Marker
            position={[m.lat, m.lng]}
            icon={iconeMembro(m.cor, m.nome, m.online, m.status, agora - m.statusTs <= 15_000)}
          >
            <Popup>
              <div className="text-sm">
                <p className="font-extrabold" style={{ color: m.cor }}>
                  {m.nome || "Sem nome"}
                </p>
                {m.foraDoTrajeto && (
                  <p className="mt-1 rounded bg-red-50 px-2 py-1 text-xs font-bold text-red-700">
                    Fora do trajeto!
                  </p>
                )}
                <p className="mt-1 text-xs text-zinc-500">{m.lat.toFixed(5)}, {m.lng.toFixed(5)}</p>
              </div>
            </Popup>
          </Marker>
        </Fragment>
      ))}

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