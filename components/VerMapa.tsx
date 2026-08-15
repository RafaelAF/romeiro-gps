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
import {
  AlertCircle,
  Flag,
  Loader2,
  LocateFixed,
  Radio,
  RadioTower,
  Compass,
  Battery,
  Users,
  Bus,
} from "lucide-react";
import "leaflet/dist/leaflet.css";
import { useCaravanaTracking } from "@/lib/useCaravanaTracking";
import { useSessaoRealtime } from "@/lib/useSessaoRealtime";
import type { VerAppProps } from "@/components/VerApp";

const STATUS_CONFIGS: Record<string, { label: string; cor: string }> = {
  "🚨": { label: "Preciso de ajuda!", cor: "#dc2626" },
  "🚶‍♂️": { label: "A caminho", cor: "#2563eb" },
  "📍": { label: "Cheguei no ponto", cor: "#16a34a" },
  "🍕": { label: "Comendo/Comprando", cor: "#d97706" },
};

function iconeEncontro(): L.DivIcon {
  const html = `
    <svg width="36" height="44" viewBox="0 0 24 32" xmlns="http://www.w3.org/2000/svg" style="filter:drop-shadow(0 1px 4px rgba(0,0,0,.4));">
      <path d="M2 8 L22 8 L12 26 Z" fill="#dc2626" stroke="#7f1d1d" stroke-width="1.5"/>
      <rect x="1.2" y="1" width="21.6" height="4" rx="1" fill="#b91c1c" stroke="#7f1d1d" stroke-width="1"/>
      <line x1="12" y1="8" x2="12" y2="26" stroke="#7f1d1d" stroke-width="1.5"/>
    </svg>`;
  return L.divIcon({ className: "", html, iconSize: [36, 44], iconAnchor: [18, 42] });
}

function iconeMinhaPosicao(nome: string): L.DivIcon {
  const label = nome ? `Você (${nome})` : "Você";
  const html = `
    <div style="display:flex;flex-direction:column;align-items:center;gap:2px;">
      <div style="width:18px;height:18px;border-radius:9999px;background:#2563eb;border:3px solid #ffffff;box-shadow:0 0 0 6px rgba(37,99,235,.25),0 1px 6px rgba(0,0,0,.35);"></div>
      <span style="font-size:11px;font-weight:700;background:rgba(255,255,255,.95);padding:1px 6px;border-radius:6px;color:#1d4ed8;box-shadow:0 1px 4px rgba(0,0,0,.15);white-space:nowrap;">${label}</span>
    </div>`;
  return L.divIcon({ className: "", html, iconSize: [80, 44], iconAnchor: [40, 22] });
}

function iconeMembro(cor: string, label: string, online: boolean, status: string, statusAtivo: boolean): L.DivIcon {
  const opacidade = online ? "1" : "0.45";
  const filtro = online ? "" : "filter: grayscale(0.85);";
  const statusHtml = status && statusAtivo
    ? `<div style="position:absolute;top:-28px;left:50%;transform:translateX(-50%);background:#ffffff;border:2px solid ${cor};border-radius:999px;padding:2px 6px;font-size:16px;box-shadow:0 2px 8px rgba(0,0,0,.2);display:flex;align-items:center;justify-content:center;animation: bounce 1s infinite alternate;">
         ${status}
       </div>`
    : "";

  const html = `
    <div style="display:flex;flex-direction:column;align-items:center;gap:2px;opacity:${opacidade};${filtro}position:relative;">
      ${statusHtml}
      <div style="width:16px;height:16px;border-radius:9999px;background:${cor};border:3px solid #ffffff;box-shadow:0 0 0 5px ${cor}40,0 1px 6px rgba(0,0,0,.35);"></div>
      <span style="font-size:11px;font-weight:700;background:rgba(255,255,255,.95);padding:1px 6px;border-radius:6px;color:${online ? cor : "#71717a"};box-shadow:0 1px 4px rgba(0,0,0,.15);white-space:nowrap;">
        ${label} ${online ? "" : " (offline)"}
      </span>
    </div>`;
  return L.divIcon({ className: "", html, iconSize: [80, 42], iconAnchor: [40, 20] });
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

export default function VerMapa({
  lat,
  lng,
  rotulo,
  sessao,
  onibusPlaca,
  onibusCor,
  onibusDetalhe,
}: VerAppProps) {
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
    statusText,
    statusTs,
    definirNome,
    enviarStatus,
    ativarCompartilhamento,
    desativarCompartilhamento,
  } = useSessaoRealtime(sessao);

  const [exibirModalNome, setExibirModalNome] = useState(false);
  const [nomeInput, setNomeInput] = useState("");
  const [erroNome, setErroNome] = useState<string | null>(null);
  const [agora, setAgora] = useState(() => Date.now());

  // Atualiza o timer interno a cada segundo para refrescar status e tempo offline
  useEffect(() => {
    const int = setInterval(() => setAgora(Date.now()), 1000);
    return () => clearInterval(int);
  }, []);

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
    
    setTimeout(() => {
      ativarCompartilhamento();
      setMostrarLocal(true);
      pedirFocoNaPosicao();
    }, 100);
  };

  const aoTocarEmoji = (emoji: string) => {
    const statusAtivo = statusText === emoji && (agora - statusTs <= 15000);
    if (statusAtivo) {
      void enviarStatus(""); // Limpa se clicar no que já está ativo
    } else {
      void enviarStatus(emoji);
    }
  };

  const abrirRotaExterna = (destinoLat?: number, destinoLng?: number) => {
    let url = "";
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const dLat = destinoLat !== undefined ? destinoLat : lat;
    const dLng = destinoLng !== undefined ? destinoLng : lng;
    
    // Se tiver localização atual do usuário, monta rota origem -> destino
    if (posicao) {
      const orig = `${posicao.lat},${posicao.lng}`;
      const dest = `${dLat},${dLng}`;
      if (isIOS) {
        url = `maps://maps.apple.com/?saddr=${orig}&daddr=${dest}&dirflg=w`;
      } else {
        url = `https://www.google.com/maps/dir/?api=1&origin=${orig}&destination=${dest}&travelmode=walking`;
      }
    } else {
      // Se não tiver localização do usuário, apenas abre o destino
      const dest = `${dLat},${dLng}`;
      if (isIOS) {
        url = `maps://maps.apple.com/?q=${dest}`;
      } else {
        url = `https://www.google.com/maps/search/?api=1&query=${dest}`;
      }
    }
    window.open(url, "_blank");
  };

  const focarGrupo = () => {
    const mapa = mapaRef.current;
    if (!mapa) return;
    
    const limites = L.latLngBounds([lat, lng], [lat, lng]); // Inicia com o ponto de encontro
    
    if (posicao) {
      limites.extend([posicao.lat, posicao.lng]);
    }
    
    membros.filter(m => m.online).forEach((m) => {
      limites.extend([m.lat, m.lng]);
    });
    
    mapa.fitBounds(limites, { padding: [50, 50], maxZoom: 17 });
  };

  const focarEncontro = () => voarPara(lat, lng);

  const solicitando = mostrarLocal && status === "solicitando";
  const ativa = mostrarLocal && status === "ativo";
  const erroLocal = mostrarLocal && (status === "negado" || status === "erro");
  const totalOnline = membros.filter(m => m.online).length + (compartilhando ? 1 : 0);
  const statusAvisoValido = statusText !== "" && (agora - statusTs <= 15000);

  const temDadosOnibus = onibusPlaca || onibusCor || onibusDetalhe;

  return (
    <div className="relative h-dvh w-full overflow-hidden bg-zinc-100">
      {/* Estilo para animação do bounce do emoji de status e animação do tooltip */}
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes bounce {
          from { transform: translate(-50%, 0); }
          to { transform: translate(-50%, -6px); }
        }
        @keyframes fadeInRight {
          from { opacity: 0; transform: translateX(-8px); }
          to { opacity: 1; transform: translateX(0); }
        }
        .animate-fade-in-right {
          animation: fadeInRight 0.25s ease-out forwards;
        }
      `}} />

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
          {temDadosOnibus && (
            <Popup>
              <div className="text-sm min-w-[160px]">
                <p className="font-extrabold text-red-700 flex items-center gap-1">
                  <Bus className="h-4.5 w-4.5" />
                  DADOS DO ÔNIBUS
                </p>
                <div className="mt-1.5 space-y-1 text-zinc-700">
                  {onibusCor && (
                    <p className="font-bold text-zinc-900">{onibusCor}</p>
                  )}
                  {onibusPlaca && (
                    <p className="text-xs">Placa: <span className="font-mono font-bold text-zinc-800 bg-zinc-100 px-1 rounded">{onibusPlaca}</span></p>
                  )}
                  {onibusDetalhe && (
                    <p className="text-xs italic bg-amber-50 border-l-2 border-amber-500 px-1.5 py-0.5 rounded text-amber-850">
                      &quot;{onibusDetalhe}&quot;
                    </p>
                  )}
                </div>
              </div>
            </Popup>
          )}
        </Marker>

        {mostrarLocal && posicao && (
          <>
            <CircleMarker
              center={[posicao.lat, posicao.lng]}
              radius={40}
              pathOptions={{ color: "#2563eb", weight: 1, fillColor: "#2563eb", fillOpacity: 0.08 }}
            />
            <Marker position={[posicao.lat, posicao.lng]} icon={iconeMinhaPosicao(nome)}>
              <Popup>
                <div className="text-sm">
                  <p className="font-extrabold text-blue-900">Você {nome ? `(${nome})` : ""}</p>
                  <p className="font-medium text-zinc-500 mt-1">
                    Precisão GPS: ±{Math.round(posicao.precisao)}m
                  </p>
                </div>
              </Popup>
            </Marker>
          </>
        )}

        {membros.map((m) => {
          const statusAtivo = agora - m.statusTs <= 15_000;
          return (
            <Marker
              key={m.id}
              position={[m.lat, m.lng]}
              icon={iconeMembro(m.cor, m.nome || "Sem nome", m.online, m.status, statusAtivo)}
            >
              <Popup>
                <div className="text-sm min-w-[150px]">
                  <p className="font-extrabold" style={{ color: m.cor }}>
                    {m.nome || "Sem nome"}
                    <span className={`ml-2 inline-block h-2 w-2 rounded-full ${m.online ? "bg-emerald-500" : "bg-zinc-400"}`} />
                  </p>
                  
                  {!m.online && (
                    <p className="text-[11px] font-bold text-red-600 uppercase tracking-wider mt-0.5">
                      Offline (Visto há {Math.round((agora - m.ts) / 60_000)} min)
                    </p>
                  )}

                  {m.status && statusAtivo && (
                    <p className="mt-1 rounded bg-zinc-100 px-2 py-1 font-bold text-zinc-800 border-l-4" style={{ borderColor: m.cor }}>
                      {m.status} {STATUS_CONFIGS[m.status]?.label || ""}
                    </p>
                  )}

                  <div className="mt-2 space-y-0.5 text-xs text-zinc-500 border-t border-zinc-100 pt-1.5">
                    <p className="flex items-center gap-1">
                      <Battery className="h-3.5 w-3.5" />
                      Bateria: {m.bateria !== null ? `${m.bateria}%` : "Desconhecida"}
                    </p>
                    <p>Sinal GPS: ±{m.precisao}m</p>
                  </div>

                  {posicao && (
                    <button
                      type="button"
                      onClick={() => abrirRotaExterna(m.lat, m.lng)}
                      className="mt-2.5 flex items-center justify-center gap-1 w-full rounded-xl bg-blue-700 py-2 text-xs font-bold text-white active:scale-95 transition-transform"
                    >
                      <Compass className="h-3.5 w-3.5" />
                      Rota até {m.nome || "Membro"}
                    </button>
                  )}
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>

      {/* Identificação da Aplicação */}
      <div className="pointer-events-none absolute inset-x-0 top-0 z-[900] flex justify-center p-3">
        <div className="rounded-2xl bg-white/95 px-4 py-2 shadow-md">
          <p className="text-sm font-extrabold text-blue-900">RomeiroGPS</p>
          <p className="text-[11px] font-medium text-zinc-500">Ponto de encontro · Aparecida - SP</p>
        </div>
      </div>

      {/* Indicador de Membros Online */}
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

      {/* Erro de Geolocalização */}
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

      {/* Barra Flutuante de Reações (Emoji Shouts) no lado esquerdo */}
      {compartilhando && (
        <div className="absolute left-3 top-1/2 z-[900] flex -translate-y-1/2 flex-col gap-2 rounded-2xl bg-white/95 p-2 shadow-lg border border-zinc-200">
          <p className="text-[9px] font-extrabold uppercase tracking-wider text-zinc-400 text-center mb-1 select-none">
            Avisar
          </p>
          {Object.keys(STATUS_CONFIGS).map((emoji) => {
            const ativo = statusText === emoji && statusAvisoValido;
            return (
              <div key={emoji} className="relative flex items-center">
                <button
                  type="button"
                  onClick={() => aoTocarEmoji(emoji)}
                  className={`flex h-11 w-11 items-center justify-center rounded-xl text-xl transition-all active:scale-90 ${
                    ativo ? "bg-blue-100 shadow-inner scale-95 border-2 border-blue-200" : "hover:bg-zinc-100 active:bg-zinc-200"
                  }`}
                  title={STATUS_CONFIGS[emoji].label}
                >
                  {emoji}
                </button>
                {/* Balão (Tooltip) dinâmico à direita do botão ativo */}
                {ativo && (
                  <div className="absolute left-13 z-[1000] ml-1 bg-blue-900 text-white text-[10px] font-bold py-1.5 px-3 rounded-xl shadow-lg whitespace-nowrap pointer-events-none animate-fade-in-right border border-blue-800 flex items-center gap-1.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-ping" />
                    {STATUS_CONFIGS[emoji].label}
                  </div>
                )}
              </div>
            );
          })}
          
          {/* Botão para limpar status manualmente */}
          {statusAvisoValido && (
            <button
              type="button"
              onClick={() => enviarStatus("")}
              className="flex h-11 w-11 items-center justify-center rounded-xl text-xs font-bold text-zinc-400 hover:text-red-500 hover:bg-red-50 transition-colors border-t border-zinc-100 mt-1 pt-1 animate-fade-in-right"
              title="Limpar aviso"
            >
              ❌
            </button>
          )}
        </div>
      )}

      {/* Botões de Controle e Ações do Mapa */}
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

        {/* Botão Focar Grupo */}
        {sessao && (membros.filter(m => m.online).length > 0 || posicao) && (
          <button
            type="button"
            aria-label="Ver todo o grupo no mapa"
            onClick={focarGrupo}
            className="flex h-12 w-12 items-center justify-center rounded-full bg-white text-blue-900 shadow-lg active:scale-95 border border-zinc-200"
          >
            <Users className="h-5 w-5" />
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

      {/* Rodapé Dinâmico com Informações e Rota */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-[900] p-3">
        <div className="mx-auto max-w-2xl rounded-2xl bg-white px-5 py-4 shadow-lg flex flex-col gap-2.5 pointer-events-auto">
          
          {/* Dados do Ônibus Expostos no Rodapé do Seguidor */}
          {temDadosOnibus && (
            <div className="flex flex-col gap-1 border-b border-zinc-100 pb-2.5 text-xs text-zinc-700">
              <p className="flex items-center gap-1.5 font-bold text-zinc-900">
                <Bus className="h-4 w-4 text-blue-900 shrink-0" />
                {onibusCor || "Ônibus da Caravana"}
                {onibusPlaca && (
                  <span className="font-mono bg-zinc-150 px-1.5 py-0.5 rounded font-bold text-zinc-850 ml-1">
                    {onibusPlaca}
                  </span>
                )}
              </p>
              {onibusDetalhe && (
                <p className="text-zinc-500 font-medium italic pl-5">
                  Detalhe: &quot;{onibusDetalhe}&quot;
                </p>
              )}
            </div>
          )}

          <div className="flex items-center justify-between gap-4">
            <div className="min-w-0">
              <p className="text-base font-extrabold text-zinc-900 truncate">{rotulo}</p>
              <p className="mt-0.5 font-mono text-xs text-zinc-500">
                {lat.toFixed(5)}, {lng.toFixed(5)}
              </p>
              {sessao && (
                <p className="mt-1 text-xs font-medium text-zinc-400 truncate">
                  {compartilhando
                    ? `Compartilhando como "${nome}"`
                    : "Toque em 📡 para compartilhar com o grupo"}
                </p>
              )}
            </div>
            
            <button
              type="button"
              onClick={() => abrirRotaExterna()}
              className="shrink-0 flex items-center gap-1.5 rounded-xl bg-blue-700 px-4 py-3 text-sm font-bold text-white shadow-sm active:scale-95 transition-transform"
            >
              <Compass className="h-4.5 w-4.5" />
              Rota
            </button>
          </div>
        </div>
      </div>

      {/* Modal para Identificação do Seguidor */}
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
