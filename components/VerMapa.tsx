"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  CircleMarker,
  MapContainer,
  Marker,
  Popup,
  TileLayer,
  Tooltip,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import { AlertCircle, Flag, Loader2, LocateFixed } from "lucide-react";
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

function CapturaMapa({ mapaRef }: { mapaRef: { current: L.Map | null } }) {
  const map = useMap();
  useEffect(() => {
    mapaRef.current = map;
    return () => {
      mapaRef.current = null;
    };
  }, [map, mapaRef]);
  return null;
}

export default function VerMapa({ lat, lng, rotulo }: VerAppProps) {
  const { posicao, status, erro, iniciar, parar } = useCaravanaTracking();
  const [mostrarLocal, setMostrarLocal] = useState(false);
  const [pedidoLocal, setPedidoLocal] = useState(0);
  const mapaRef = useRef<L.Map | null>(null);
  const focarQuandoChegar = useRef(false);
  const pedidoTs = useRef(0);

  const voarPara = useCallback((latAlvo: number, lngAlvo: number) => {
    const mapa = mapaRef.current;
    if (mapa) {
      mapa.flyTo([latAlvo, lngAlvo], Math.max(mapa.getZoom(), 16), { duration: 0.6 });
    }
  }, []);

  useEffect(() => {
    if (focarQuandoChegar.current && posicao && posicao.ts >= pedidoTs.current) {
      focarQuandoChegar.current = false;
      voarPara(posicao.lat, posicao.lng);
    }
  }, [posicao, pedidoLocal, voarPara]);

  const pedirFocoNaPosicao = () => {
    focarQuandoChegar.current = true;
    pedidoTs.current = Date.now();
    setPedidoLocal((n) => n + 1);
  };

  const tentarNovamente = () => {
    parar();
    iniciar();
    pedirFocoNaPosicao();
  };

  const aoTocarLocalizacao = () => {
    if (mostrarLocal && (status === "negado" || status === "erro")) {
      tentarNovamente();
      return;
    }
    if (mostrarLocal) {
      parar();
      setMostrarLocal(false);
      return;
    }
    parar();
    iniciar();
    setMostrarLocal(true);
    pedirFocoNaPosicao();
  };

  const focarEncontro = () => voarPara(lat, lng);

  const solicitando = mostrarLocal && status === "solicitando";
  const ativa = mostrarLocal && status === "ativo";
  const erroLocal = mostrarLocal && (status === "negado" || status === "erro");

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
        <CapturaMapa mapaRef={mapaRef} />
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

      {erroLocal && (
        <div className="absolute inset-x-0 top-16 z-[900] flex justify-center px-4">
          <button
            type="button"
            onClick={tentarNovamente}
            className="flex items-center gap-2 rounded-full bg-white/95 px-4 py-2 text-xs font-semibold text-red-700 shadow-md active:scale-[.98]"
          >
            <AlertCircle className="h-4 w-4" />
            {`${
              status === "negado"
                ? "Permissão negada"
                : erro || "Não foi possível obter a localização"
            } · Tentar novamente`}
          </button>
        </div>
      )}

      <div className="absolute bottom-28 right-3 z-[900] flex flex-col gap-2">
        <button
          type="button"
          aria-label={ativa ? "Ocultar minha localização" : "Ver minha localização"}
          onClick={aoTocarLocalizacao}
          className={`flex h-12 w-12 items-center justify-center rounded-full shadow-lg active:scale-95 ${
            ativa ? "bg-blue-600 text-white" : "bg-white text-blue-700"
          }`}
        >
          {solicitando ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <LocateFixed className="h-5 w-5" />
          )}
        </button>

        <button
          type="button"
          aria-label="Focar no ponto de encontro"
          onClick={focarEncontro}
          className="flex h-12 w-12 items-center justify-center rounded-full bg-white text-red-600 shadow-lg active:scale-95"
        >
          <Flag className="h-5 w-5" />
        </button>
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
