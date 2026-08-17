"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  CircleMarker,
  MapContainer,
  Marker,
  Polyline,
  Popup,
  TileLayer,
  Tooltip,
  useMap,
  useMapEvents,
} from "react-leaflet";
import L from "leaflet";
import Link from "next/link";
import {
  AlertCircle,
  Battery,
  BookOpen,
  Bus,
  Compass,
  Flag,
  Loader2,
  LocateFixed,
  Menu,
  Radio,
  RadioTower,
  Route,
  Settings,
  Shield,
  Users,
  X,
} from "lucide-react";
import "leaflet/dist/leaflet.css";
import ModalPoi, { type PontoModalInfo } from "@/components/ModalPoi";
import RotasPanel from "@/components/RotasPanel";
import TutorialInterativo, { type PassoTutorial } from "@/components/TutorialInterativo";
import { useCaravanaTracking } from "@/lib/useCaravanaTracking";
import { useSessaoRealtime } from "@/lib/useSessaoRealtime";
import {
  iconeEncontro,
  iconeLider,
  iconeMembro,
  iconeMinhaPosicao,
  iconeParada,
  iconePoi,
} from "@/lib/icones";
import { TIPO_POR_ID } from "@/lib/poisDinamicos";
import { filtrarPorDistancia } from "@/lib/utils";
import {
  assinarRotas,
  criarRota,
  criarTrajeto,
  definirRotaAtiva,
  lerRotaAtivaId,
  lerRotas,
  obterRotaAtiva,
  pontosRotaParaLatLng,
  removerRota as removerRotaStore,
  tracarRotaOsm,
} from "@/lib/rotas";
import type { CoordenadaRota, Rota } from "@/lib/types";
import type { VerAppProps } from "@/components/VerApp";

const STATUS_CONFIGS: Record<string, { label: string; cor: string }> = {
  "🚨": { label: "Preciso de ajuda!", cor: "#dc2626" },
  "🚶‍♂️": { label: "A caminho", cor: "#2563eb" },
  "📍": { label: "Cheguei no ponto", cor: "#16a34a" },
  "🍕": { label: "Comendo/Comprando", cor: "#d97706" },
};

const PASSOS_TUTORIAL: PassoTutorial[] = [
  {
    seletor: 'button[aria-label="Menu"]',
    titulo: "Menu",
    texto:
      "Aqui você acessa suas rotas particulares, este tutorial e a política de privacidade.",
  },
  {
    seletor:
      'button[aria-label="Compartilhar minha localização com o grupo"], button[aria-label="Parar de compartilhar localização"]',
    titulo: "Compartilhar localização",
    posicao: "esquerda",
    texto:
      "Toque para compartilhar sua localização com o grupo em tempo real. Seu nome e posição aparecem no mapa de quem recebeu o link.",
  },
  {
    seletor: 'div[aria-label="Avisar o grupo"]',
    titulo: "Avisar o grupo",
    posicao: "direita",
    texto:
      "Envie um aviso para todos verem seu status: precisa de ajuda, a caminho, chegou no ponto ou comendo/comprando.",
  },
  {
    seletor:
      'button[aria-label="Ver minha localização"], button[aria-label="Ocultar minha localização"]',
    titulo: "Minha localização",
    posicao: "esquerda",
    texto:
      "Mostra sua posição no mapa e a seta azul aponta para a direção em que você está olhando.",
  },
  {
    seletor: 'button[aria-label="Ver todo o grupo no mapa"]',
    titulo: "Ver grupo",
    posicao: "esquerda",
    texto: "Ajusta o zoom para mostrar todos os membros online de uma vez.",
  },
  {
    seletor: 'button[aria-label="Focar no ponto de encontro"]',
    titulo: "Ponto de encontro",
    posicao: "esquerda",
    texto: "Volta o mapa para o ponto de encontro definido pelo líder.",
  },
];

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

function CapturarCliquesRota({
  ativo,
  aoAdicionarPonto,
}: {
  ativo: boolean;
  aoAdicionarPonto: (lat: number, lng: number) => void;
}) {
  useMapEvents({
    click: (evento) => {
      if (ativo) aoAdicionarPonto(evento.latlng.lat, evento.latlng.lng);
    },
  });
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
  const { posicao: posicaoLocal, status, erro, iniciar, parar, setAoAtualizar } =
    useCaravanaTracking();
  const [mostrarLocal, setMostrarLocal] = useState(false);
  const [pedidoLocal, setPedidoLocal] = useState(0);
  const mapaRef = useRef<L.Map | null>(null);
  const focarQuandoChegar = useRef(false);
  const pedidoTs = useRef(0);

  const {
    membros,
    lider,
    poisLider,
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
  const [rumo, setRumo] = useState<number | null>(null);

  const [rotas, setRotas] = useState<Rota[]>(() => lerRotas());
  const [rotaAtivaId, setRotaAtivaId] = useState<string | null>(() => lerRotaAtivaId());
  const [panelAberto, setPanelAberto] = useState(false);
  const [menuAberto, setMenuAberto] = useState(false);
  const [tutorialInterativo, setTutorialInterativo] = useState(false);
  const [modoCriarRota, setModoCriarRota] = useState(false);
  const [rotaEmCriacao, setRotaEmCriacao] = useState<{
    nome: string;
    pontos: CoordenadaRota[];
  } | null>(null);
  const [gravandoTrajeto, setGravandoTrajeto] = useState(false);
  const [trajetoEmGravacao, setTrajetoEmGravacao] = useState<CoordenadaRota[]>([]);
  const [navegacao, setNavegacao] = useState<[number, number][] | null>(null);
  const [carregandoRota, setCarregandoRota] = useState(false);
  const [linhasOsrm, setLinhasOsrm] = useState<Record<string, [number, number][]>>({});
  const [modalPoi, setModalPoi] = useState<PontoModalInfo | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const temporizadorFeedback = useRef<number | null>(null);

  // Atualiza o timer interno a cada segundo para refrescar status e tempo offline
  useEffect(() => {
    const int = setInterval(() => setAgora(Date.now()), 1000);
    return () => clearInterval(int);
  }, []);

  // Monitora a bússola do dispositivo (orientação)
  useEffect(() => {
    const ativo = mostrarLocal || compartilhando;
    if (!ativo) {
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
  }, [mostrarLocal, compartilhando]);

  const solicitarPermissaoBussola = () => {
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
            // O effect acima irá registrar o listener
          }
        })
        .catch(() => void 0);
    }
  };

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
    solicitarPermissaoBussola();
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
    solicitarPermissaoBussola();
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
    solicitarPermissaoBussola();
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

  const mostrarFeedback = useCallback((texto: string) => {
    setFeedback(texto);
    if (temporizadorFeedback.current) window.clearTimeout(temporizadorFeedback.current);
    temporizadorFeedback.current = window.setTimeout(() => setFeedback(null), 2600);
  }, []);

  useEffect(() => {
    return () => {
      if (temporizadorFeedback.current) window.clearTimeout(temporizadorFeedback.current);
    };
  }, []);

  useEffect(() => {
    return assinarRotas(setRotas);
  }, []);

  const rotaAtiva = useMemo(() => obterRotaAtiva(rotas, rotaAtivaId), [rotas, rotaAtivaId]);

  useEffect(() => {
    if (!rotaAtiva || rotaAtiva.tipo !== "personalizada") return;
    let ativo = true;
    tracarRotaOsm(rotaAtiva.pontos).then((coords) => {
      if (ativo && coords) {
        setLinhasOsrm((prev) => ({ ...prev, [rotaAtiva.id]: coords }));
      }
    });
    return () => {
      ativo = false;
    };
  }, [rotaAtiva]);

  const linhaRotaExibicao = useMemo<[number, number][]>(() => {
    if (rotaEmCriacao && rotaEmCriacao.pontos.length > 1) {
      return rotaEmCriacao.pontos.map((p) => [p.lat, p.lng] as [number, number]);
    }
    if (!rotaAtiva) return [];
    return linhasOsrm[rotaAtiva.id] ?? pontosRotaParaLatLng(rotaAtiva);
  }, [rotaEmCriacao, rotaAtiva, linhasOsrm]);

  const pontosRotaVisiveis = useMemo<CoordenadaRota[]>(
    () => (rotaEmCriacao ? rotaEmCriacao.pontos : rotaAtiva ? rotaAtiva.pontos : []),
    [rotaEmCriacao, rotaAtiva]
  );

  const iniciarCriacaoRota = useCallback((nome: string) => {
    setRotaEmCriacao({ nome, pontos: [] });
    setModoCriarRota(true);
    setPanelAberto(false);
    setNavegacao(null);
  }, []);

  const adicionarPontoRota = useCallback(
    (latP: number, lngP: number) => {
      if (!rotaEmCriacao) return;
      setRotaEmCriacao((prev) =>
        prev
          ? {
              ...prev,
              pontos: [
                ...prev.pontos,
                { lat: latP, lng: lngP, nome: `Parada ${prev.pontos.length + 1}` },
              ],
            }
          : prev
      );
    },
    [rotaEmCriacao]
  );

  const finalizarRota = useCallback(() => {
    if (!rotaEmCriacao) return;
    if (rotaEmCriacao.pontos.length < 2) {
      mostrarFeedback("Adicione pelo menos 2 pontos à rota.");
      return;
    }
    const rota = criarRota({ nome: rotaEmCriacao.nome, pontos: rotaEmCriacao.pontos });
    setRotaAtivaId(rota.id);
    setRotas(lerRotas());
    setRotaEmCriacao(null);
    setModoCriarRota(false);
    setPanelAberto(true);
    mostrarFeedback("Rota criada e ativada!");
  }, [rotaEmCriacao, mostrarFeedback]);

  const cancelarCriacaoRota = useCallback(() => {
    setRotaEmCriacao(null);
    setModoCriarRota(false);
  }, []);

  const iniciarGravacao = useCallback(() => {
    const base = posicao ?? posicaoLocal;
    if (base) {
      setTrajetoEmGravacao([{ lat: base.lat, lng: base.lng, ts: Date.now() }]);
    } else {
      setTrajetoEmGravacao([]);
      mostrarFeedback("GPS iniciado. Ande um pouco para capturar os pontos.");
    }
    setGravandoTrajeto(true);
    if (!mostrarLocal) iniciar();
    setPanelAberto(false);
  }, [posicao, posicaoLocal, mostrarLocal, iniciar, mostrarFeedback]);

  useEffect(() => {
    return setAoAtualizar(({ lat, lng }) => {
      if (!gravandoTrajeto) return;
      setTrajetoEmGravacao((prev) => {
        const ultimo = prev[prev.length - 1];
        const podeAdicionar =
          !ultimo ||
          (ultimo.ts !== undefined && Date.now() - ultimo.ts >= 15_000) ||
          filtrarPorDistancia(ultimo, { lat, lng }, 10);
        if (!podeAdicionar) return prev;
        return [...prev, { lat, lng, ts: Date.now() }];
      });
    });
  }, [setAoAtualizar, gravandoTrajeto]);

  const finalizarGravacao = useCallback(
    (nome: string) => {
      if (trajetoEmGravacao.length < 2) {
        mostrarFeedback("Trajeto muito curto. Caminhe um pouco mais.");
        return;
      }
      const trajeto = criarTrajeto({
        nome: nome || "Trajeto gravado",
        pontos: trajetoEmGravacao,
      });
      setRotaAtivaId(trajeto.id);
      setRotas(lerRotas());
      setGravandoTrajeto(false);
      setTrajetoEmGravacao([]);
      setPanelAberto(true);
      mostrarFeedback("Trajeto gravado e ativado!");
    },
    [trajetoEmGravacao, mostrarFeedback]
  );

  const cancelarGravacao = useCallback(() => {
    setGravandoTrajeto(false);
    setTrajetoEmGravacao([]);
  }, []);

  const ativarRota = useCallback((id: string | null) => {
    definirRotaAtiva(id);
    setRotaAtivaId(id);
    setNavegacao(null);
  }, []);

  const removerRota = useCallback((id: string) => {
    removerRotaStore(id);
    setRotas(lerRotas());
    setRotaAtivaId(lerRotaAtivaId());
  }, []);

  const aoClicarPoiLider = useCallback(
    (id: string, nomePoi: string, rotulo: string, latP: number, lngP: number) => {
      setNavegacao(null);
      setModalPoi({ id, nome: nomePoi, rotulo, lat: latP, lng: lngP });
    },
    []
  );

  const navegarParaPonto = useCallback(
    async (alvo: { lat: number; lng: number }) => {
      if (!posicao) {
        mostrarFeedback("Ative sua localização para traçar a rota.");
        setModalPoi(null);
        return;
      }
      setCarregandoRota(true);
      const rota = await tracarRotaOsm([
        { lat: posicao.lat, lng: posicao.lng },
        { lat: alvo.lat, lng: alvo.lng },
      ]);
      setCarregandoRota(false);
      setModalPoi(null);
      setNavegacao(
        rota ?? [
          [posicao.lat, posicao.lng],
          [alvo.lat, alvo.lng],
        ]
      );
    },
    [posicao, mostrarFeedback]
  );

  const abrirExterno = useCallback(() => {
    if (!modalPoi) return;
    const alvo = modalPoi;
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const dest = `${alvo.lat},${alvo.lng}`;
    const url = posicao
      ? isIOS
        ? `maps://maps.apple.com/?saddr=${posicao.lat},${posicao.lng}&daddr=${dest}&dirflg=w`
        : `https://www.google.com/maps/dir/?api=1&origin=${posicao.lat},${posicao.lng}&destination=${dest}&travelmode=walking`
      : isIOS
        ? `maps://maps.apple.com/?q=${dest}`
        : `https://www.google.com/maps/search/?api=1&query=${dest}`;
    window.open(url, "_blank");
    setModalPoi(null);
  }, [posicao, modalPoi]);

  const focarGrupo = () => {
    const mapa = mapaRef.current;
    if (!mapa) return;
    
    const limites = L.latLngBounds([lat, lng], [lat, lng]); // Inicia com o ponto de encontro
    
    if (posicao) {
      limites.extend([posicao.lat, posicao.lng]);
    }

    if (lider) {
      limites.extend([lider.lat, lider.lng]);
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
        <CapturarCliquesRota ativo={modoCriarRota} aoAdicionarPonto={adicionarPontoRota} />
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

        {lider && (
          <Marker position={[lider.lat, lider.lng]} icon={iconeLider(lider.online)}>
            <Popup>
              <div className="text-sm min-w-[150px]">
                <p className="font-extrabold text-amber-700">
                  Líder da caravana
                  <span className={`ml-2 inline-block h-2 w-2 rounded-full ${lider.online ? "bg-emerald-500" : "bg-zinc-400"}`} />
                </p>
                {!lider.online && (
                  <p className="text-[11px] font-bold text-red-600 uppercase tracking-wider mt-0.5">
                    Offline (Visto há {Math.round((agora - lider.ts) / 60_000)} min)
                  </p>
                )}
                <p className="mt-1 text-xs text-zinc-500">{lider.lat.toFixed(5)}, {lider.lng.toFixed(5)}</p>
              </div>
            </Popup>
          </Marker>
        )}

        {poisLider.map((poi) => {
          const meta =
            TIPO_POR_ID[poi.tipo as keyof typeof TIPO_POR_ID] ?? TIPO_POR_ID.atracao;
          return (
            <Marker
              key={poi.id}
              position={[poi.lat, poi.lng]}
              icon={iconePoi(meta.cor, meta.letra)}
              eventHandlers={{
                click: () => aoClicarPoiLider(poi.id, poi.nome, meta.rotulo, poi.lat, poi.lng),
              }}
            />
          );
        })}

        {linhaRotaExibicao.length > 1 && (
          <Polyline
            positions={linhaRotaExibicao}
            pathOptions={{ color: "#1d4ed8", weight: 5, opacity: 0.85 }}
          />
        )}

        {pontosRotaVisiveis.map((p, i) => (
          <Marker
            key={`${p.lat}-${p.lng}-${i}`}
            position={[p.lat, p.lng]}
            icon={iconeParada("#1d4ed8", i + 1)}
          >
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

        {mostrarLocal && posicao && (
          <>
            <CircleMarker
              center={[posicao.lat, posicao.lng]}
              radius={40}
              pathOptions={{ color: "#2563eb", weight: 1, fillColor: "#2563eb", fillOpacity: 0.08 }}
            />
            <Marker position={[posicao.lat, posicao.lng]} icon={iconeMinhaPosicao(rumo, nome ? `Você (${nome})` : "Você")}>
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

        {membros
          .filter((m) => !m.lider)
          .map((m) => {
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

      {/* Menu minimalista */}
      <button
        type="button"
        aria-label="Menu"
        onClick={() => setMenuAberto((v) => !v)}
        className="absolute right-3 top-3 z-[950] flex h-12 w-12 items-center justify-center rounded-full bg-white text-zinc-800 shadow-lg active:scale-95"
      >
        {menuAberto ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </button>

      {menuAberto && (
        <div className="absolute right-3 top-[4.25rem] z-[950] w-56 overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-xl">
          <button
            type="button"
            onClick={() => {
              setPanelAberto(true);
              setMenuAberto(false);
            }}
            className="flex w-full items-center gap-3 border-b border-zinc-100 px-4 py-3 text-sm font-semibold text-zinc-800 active:bg-zinc-50"
          >
            <Route className="h-5 w-5 text-blue-700" />
            Minhas Rotas
          </button>
          <button
            type="button"
            onClick={() => {
              setTutorialInterativo(true);
              setMenuAberto(false);
            }}
            className="flex w-full items-center gap-3 border-b border-zinc-100 px-4 py-3 text-sm font-semibold text-zinc-800 active:bg-zinc-50"
          >
            <BookOpen className="h-5 w-5 text-emerald-700" />
            Tutorial
          </button>
          {sessao && lider && (
            <Link
              href="/"
              onClick={() => setMenuAberto(false)}
              className="flex w-full items-center gap-3 border-b border-zinc-100 px-4 py-3 text-sm font-semibold text-zinc-800 active:bg-zinc-50"
            >
              <Settings className="h-5 w-5 text-amber-700" />
              Configurações do líder
            </Link>
          )}
          <a
            href="/politica-privacidade"
            className="flex w-full items-center gap-3 px-4 py-3 text-sm font-semibold text-zinc-800 active:bg-zinc-50"
          >
            <Shield className="h-5 w-5 text-zinc-600" />
            Política de Privacidade
          </a>
        </div>
      )}

      {feedback && (
        <div className="pointer-events-none absolute inset-x-0 top-16 z-[960] flex justify-center px-3">
          <p className="rounded-full bg-zinc-900/90 px-4 py-2 text-sm font-semibold text-white shadow-lg">
            {feedback}
          </p>
        </div>
      )}

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

      {/* Aviso de modo: criar rota / gravando trajeto */}
      {(modoCriarRota || gravandoTrajeto) && (
        <div className="pointer-events-none absolute inset-x-0 top-[7rem] z-[900] flex justify-center px-3">
          <p
            className={`rounded-full px-4 py-1.5 text-xs font-bold text-white shadow-lg ${
              modoCriarRota ? "bg-blue-700/95" : "bg-emerald-600/95"
            }`}
          >
            {modoCriarRota
              ? `Toque no mapa para adicionar paradas (${rotaEmCriacao?.pontos.length ?? 0})`
              : `Gravando trajeto... ${trajetoEmGravacao.length} pontos`}
          </p>
        </div>
      )}

      {/* Controles de criação de rota / gravação */}
      {modoCriarRota && (
        <div className="absolute bottom-24 left-3 z-[900] flex flex-col gap-2">
          <button
            type="button"
            onClick={cancelarCriacaoRota}
            className="flex min-h-11 items-center justify-center rounded-full bg-white px-4 text-xs font-bold text-zinc-700 shadow-lg active:scale-95 border border-zinc-200"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={finalizarRota}
            className="flex min-h-11 items-center justify-center rounded-full bg-blue-700 px-4 text-xs font-bold text-white shadow-lg active:scale-95"
          >
            Finalizar ({rotaEmCriacao?.pontos.length ?? 0})
          </button>
        </div>
      )}

      {gravandoTrajeto && (
        <div className="absolute bottom-24 left-3 z-[900] flex flex-col gap-2">
          <button
            type="button"
            onClick={() => setPanelAberto(true)}
            className="flex min-h-11 items-center justify-center rounded-full bg-emerald-600 px-4 text-xs font-bold text-white shadow-lg active:scale-95"
          >
            Parar gravação ({trajetoEmGravacao.length})
          </button>
        </div>
      )}

      {/* Barra Flutuante de Reações (Emoji Shouts) no lado esquerdo */}
      {compartilhando && (
        <div
          aria-label="Avisar o grupo"
          className="absolute left-3 top-1/2 z-[900] flex -translate-y-1/2 flex-col gap-2 rounded-2xl bg-white/95 p-2 shadow-lg border border-zinc-200"
        >
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

      {/* Painel de Rotas e Trajetos (particulares) */}
      {panelAberto && (
        <div className="absolute inset-0 z-[1200]">
          <div
            className="absolute inset-0 bg-black/30"
            onClick={() => setPanelAberto(false)}
          />
          <div className="absolute inset-x-0 bottom-0 mx-auto max-h-[70dvh] max-w-2xl overflow-y-auto rounded-t-3xl bg-white p-5 shadow-2xl">
            <RotasPanel
              rotas={rotas}
              rotaAtivaId={rotaAtivaId}
              gravandoTrajeto={gravandoTrajeto}
              trajetoEmGravacao={trajetoEmGravacao}
              aoVoltar={() => setPanelAberto(false)}
              aoIniciarRotaPersonalizada={iniciarCriacaoRota}
              aoIniciarGravacao={iniciarGravacao}
              aoFinalizarGravacao={finalizarGravacao}
              aoCancelarGravacao={cancelarGravacao}
              aoAtivarRota={ativarRota}
              aoRemoverRota={removerRota}
            />
          </div>
        </div>
      )}

      {/* Modal de Ponto de Interesse do Líder */}
      {modalPoi && (
        <ModalPoi
          ponto={modalPoi}
          carregandoRota={carregandoRota}
          aoNavegar={() => navegarParaPonto(modalPoi)}
          aoAbrirExterno={abrirExterno}
          aoFechar={() => setModalPoi(null)}
        />
      )}

      {/* Tutorial interativo */}
      {tutorialInterativo && (
        <TutorialInterativo passos={PASSOS_TUTORIAL} aoSair={() => setTutorialInterativo(false)} />
      )}

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
