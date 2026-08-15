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
import { AlertCircle, Flag, Loader2, LocateFixed, Radio, RadioTower } from "lucide-react";
import "leaflet/dist/leaflet.css";
import { useCaravanaTracking } from "@/lib/useCaravanaTracking";
import { useSessaoRealtime } from "@/lib/useSessaoRealtime";
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

function iconeMembro(cor: string, label: string): L.DivIcon {
  const html = `
    <div style="display:flex;flex-direction:column;align-items:center;gap:2px;">
      <div style="width:16px;height:16px;border-radius:9999px;background:${cor};border:3px solid #ffffff;box-shadow:0 0 0 5px ${cor}40,0 1px 6px rgba(0,0,0,.35);"></div>
      <span style="font-size:11px;font-weight:700;background:rgba(255,255,255,.9);padding:0 4px;border-radius:6px;color:${cor};white-space:nowrap;">${label}</span>
    </div>`;
  return L.divIcon({ className: "", html, iconSize: [64, 42], iconAnchor: [32, 20] });
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

export default function VerMapa({ lat, lng, rotulo, sessao }: VerAppProps) {
  const { posicao: posicaoLocal, status, erro, iniciar, parar } = useCaravanaTracking();
  const [mostrarLocal, setMostrarLocal] = useState(false);
  const [pedidoLocal, setPedidoLocal] = useState(0);
  const mapaRef = useRef<L.Map | null>(null);
  const focarQuandoChegar = useRef(false);
  const pedidoTs = useRef(0);

  const {
    membros,
    posicao: posicaoCompartilhada,
    compartilhando,
    nome,
    definirNome,
    ativarCompartilhamento,
    desativarCompartilhamento,
  } = useSessaoRealtime(sessao);

  const [exibirModalNome, setExibirModalNome] = useState(false);
  const [nomeInput, setNomeInput] = useState("");
  const [erroNome, setErroNome] = useState<string | null>(null);

  const posicao = compartilhando ? posicaoCompartilhada : posicaoLocal;

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

  const aoTocarCompartilhar = () => {
    if (compartilhando) {
      desativarCompartilhamento();
    } else {
      if (!nome) {
        setNomeInput("");
        setErroNome(null);
        setExibirModalNome(true);
      } else {
        ativarCompartilhamento();
        setMostrarLocal(true);
        pedirFocoNaPosicao();
      }
    }
  };

  const confirmarNome = () => {
    const limpo = nomeInput.trim();
    if (limpo.length < 2) {
      setErroNome("O nome deve ter pelo menos 2 caracteres.");
      return;
    }
    definirNome(limpo);
    setExibirModalNome(false);
    
    // Inicia compartilhamento logo em seguida
    setTimeout(() => {
      ativarCompartilhamento();
      setMostrarLocal(true);
      pedirFocoNaPosicao();
    }, 100);
  };

  const focarEncontro = () => voarPara(lat, lng);

  const solicitando = mostrarLocal && status === "solicitando";
  const ativa = mostrarLocal && status === "ativo";
  const erroLocal = mostrarLocal && (status === "negado" || status === "erro");
  const totalOnline = membros.length + (compartilhando ? 1 : 0);

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
                <strong>Você {nome ? `(${nome})` : ""}</strong>
                <br />
                <span className="text-sm">{`${posicao.lat.toFixed(5)}, ${posicao.lng.toFixed(5)}`}</span>
              </Popup>
            </Marker>
          </>
        )}

        {membros.map((m) => (
          <Marker
            key={m.id}
            position={[m.lat, m.lng]}
            icon={iconeMembro(m.cor, m.nome)}
          >
            <Popup>
              <strong>{m.nome}</strong>
              <br />
              <span className="text-sm">{`${m.lat.toFixed(5)}, ${m.lng.toFixed(5)}`}</span>
            </Popup>
          </Marker>
        ))}
      </MapContainer>

      <div className="pointer-events-none absolute inset-x-0 top-0 z-[900] flex justify-center p-3">
        <div className="rounded-2xl bg-white/95 px-4 py-2 shadow-md">
          <p className="text-sm font-extrabold text-blue-900">RomeiroGPS</p>
          <p className="text-[11px] font-medium text-zinc-500">Ponto de encontro · Aparecida - SP</p>
        </div>
      </div>

      {sessao && totalOnline > 0 && (
        <div className="pointer-events-none absolute inset-x-0 top-[3.5rem] z-[900] flex justify-center px-3">
          <div className="flex items-center gap-1.5 rounded-full bg-emerald-600/90 px-3 py-1 shadow">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-white" />
            <span className="text-xs font-bold text-white">
              {totalOnline} {totalOnline === 1 ? "pessoa" : "pessoas"} online
            </span>
          </div>
        </div>
      )}

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
        {sessao && (
          <button
            type="button"
            aria-label={compartilhando ? "Parar de compartilhar localização" : "Compartilhar minha localização com o grupo"}
            onClick={aoTocarCompartilhar}
            className={`flex h-12 w-12 items-center justify-center rounded-full shadow-lg active:scale-95 ${
              compartilhando ? "bg-emerald-600 text-white" : "bg-white text-emerald-700"
            }`}
          >
            {compartilhando ? (
              <RadioTower className="h-5 w-5" />
            ) : (
              <Radio className="h-5 w-5" />
            )}
          </button>
        )}

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
          {sessao && (
            <p className="mt-1.5 text-xs font-medium text-zinc-400">
              {compartilhando
                ? `Compartilhando sua localização como "${nome}"`
                : "Toque em 📡 para compartilhar sua localização com o grupo"}
            </p>
          )}
        </div>
      </div>

      {exibirModalNome && (
        <div className="absolute inset-0 z-[2000] flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl">
            <h3 className="text-lg font-extrabold text-zinc-950">Como quer ser chamado?</h3>
            <p className="mt-1 text-sm font-medium text-zinc-500">
              Seu nome aparecerá no mapa em tempo real para as pessoas que têm este link.
            </p>
            
            <input
              type="text"
              placeholder="Digite seu nome (Ex: João)"
              value={nomeInput}
              onChange={(e) => setNomeInput(e.target.value)}
              className="mt-4 w-full rounded-2xl border-2 border-zinc-300 bg-white px-4 py-3 text-base font-semibold text-zinc-900 outline-none focus:border-blue-600"
              maxLength={30}
              autoFocus
            />

            {erroNome && <p className="mt-2 text-xs font-semibold text-red-600">{erroNome}</p>}

            <div className="mt-5 flex gap-2">
              <button
                type="button"
                onClick={() => setExibirModalNome(false)}
                className="flex-1 rounded-xl border border-zinc-300 bg-white py-3 text-sm font-bold text-zinc-700 active:bg-zinc-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={confirmarNome}
                className="flex-1 rounded-xl bg-blue-700 py-3 text-sm font-bold text-white active:scale-95"
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
