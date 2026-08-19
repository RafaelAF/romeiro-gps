"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import MapView from "@/components/MapView";
import CaravanaDrawer from "@/components/CaravanaDrawer";
import TelaIdentificacao from "@/components/TelaIdentificacao";
import CriarPontoModal, { type TipoNovoPonto } from "@/components/CriarPontoModal";
import ModalPoi, { type PontoModalInfo } from "@/components/ModalPoi";
import TutorialModal from "@/components/TutorialModal";
import { useCaravanaTracking } from "@/lib/useCaravanaTracking";
import { useSessaoLider } from "@/lib/useSessaoLider";
import {
  assinarPontoEncontro,
  gerarLinkCompartilhamento,
  lerPontoEncontro,
  lerSessaoLider,
  lerTelefone,
  montarLinkVisualizacao,
  salvarPontoEncontro,
  salvarSessaoLider,
  salvarTelefone,
} from "@/lib/pontoEncontro";
import {
  adicionarPoi,
  assinarPois,
  lerPois,
  removerPoi as removerPoiStore,
} from "@/lib/poisDinamicos";
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
import { filtrarPorDistancia } from "@/lib/utils";
import type { CoordenadaRota, PoiDinamico, PontoEncontro, Rota } from "@/lib/types";

export default function CaravanaApp() {
  const { posicao, status: gpsStatus, erro, iniciar, parar, setAoAtualizar } =
    useCaravanaTracking();

  const [telefone, setTelefone] = useState<string | null>(() => lerTelefone());
  const [pontoEncontro, setPontoEncontro] = useState<PontoEncontro | null>(() =>
    lerPontoEncontro()
  );
  const [pois, setPois] = useState<PoiDinamico[]>(() => lerPois());
  const [rotas, setRotas] = useState<Rota[]>(() => lerRotas());
  const [rotaAtivaId, setRotaAtivaId] = useState<string | null>(() => lerRotaAtivaId());
  const [sessaoLider, setSessaoLider] = useState<string | null>(() => lerSessaoLider());
  const [drawerAberto, setDrawerAberto] = useState(true);
  const [feedback, setFeedback] = useState<string | null>(null);
  const temporizadorFeedback = useRef<number | null>(null);

  const [criarPonto, setCriarPonto] = useState<{ lat: number; lng: number } | null>(null);
  const [modalPoi, setModalPoi] = useState<PontoModalInfo | null>(null);
  const [tutorialAberto, setTutorialAberto] = useState(false);

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

  const rotaAtiva = useMemo(() => obterRotaAtiva(rotas, rotaAtivaId), [rotas, rotaAtivaId]);

  const { membros, avisos } = useSessaoLider(sessaoLider, rotaAtiva);

  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => void 0);
    }
  }, []);

  useEffect(() => {
    return assinarPontoEncontro(setPontoEncontro);
  }, []);

  useEffect(() => {
    return assinarPois(setPois);
  }, []);

  useEffect(() => {
    return assinarRotas(setRotas);
  }, []);

  useEffect(() => {
    if (!telefone) return;
    iniciar();
    return parar;
  }, [iniciar, parar, telefone]);

  useEffect(() => {
    return () => {
      if (temporizadorFeedback.current) window.clearTimeout(temporizadorFeedback.current);
    };
  }, []);

  const mostrarFeedback = useCallback((texto: string) => {
    setFeedback(texto);
    if (temporizadorFeedback.current) window.clearTimeout(temporizadorFeedback.current);
    temporizadorFeedback.current = window.setTimeout(() => setFeedback(null), 2600);
  }, []);

  const confirmarTelefone = useCallback((novo: string) => {
    salvarTelefone(novo);
    setTelefone(novo);
    setDrawerAberto(true);
  }, []);

  const trocarTelefone = useCallback(() => {
    salvarTelefone("");
    setTelefone(null);
    setPontoEncontro(null);
  }, []);

  const limparPontoEncontro = useCallback(() => {
    salvarPontoEncontro(null);
    setPontoEncontro(null);
  }, []);

  const salvarDadosOnibus = useCallback((placa: string, cor: string, detalhe: string) => {
    setPontoEncontro((prev) => {
      if (!prev) return null;
      const novo = { ...prev, onibusPlaca: placa, onibusCor: cor, onibusDetalhe: detalhe };
      salvarPontoEncontro(novo);
      return novo;
    });
  }, []);

  const compartilhar = useCallback(async () => {
    if (!pontoEncontro || !telefone) return;
    const { url, sessao } = gerarLinkCompartilhamento(pontoEncontro, telefone);
    setSessaoLider(sessao);
    if (navigator.share) {
      try {
        await navigator.share({
          title: "Ponto de Encontro - RomeiroGPS",
          url,
        });
        return;
      } catch {
        return;
      }
    }
    try {
      await navigator.clipboard.writeText(url);
      mostrarFeedback("Link copiado!");
    } catch {
      window.prompt("Copie o link:", url);
    }
  }, [pontoEncontro, telefone, mostrarFeedback]);

  const visualizar = useCallback(() => {
    if (!pontoEncontro || !telefone) return;
    let sessao = sessaoLider;
    if (!sessao) {
      sessao = Math.random().toString(36).slice(2, 10);
      salvarSessaoLider(sessao);
      setSessaoLider(sessao);
    }
    const url = montarLinkVisualizacao(pontoEncontro, telefone, sessao);
    window.open(url, "_blank");
  }, [pontoEncontro, telefone, sessaoLider]);

  const aoLongPress = useCallback((lat: number, lng: number) => {
    setCriarPonto({ lat, lng });
  }, []);

  const salvarNovoPonto = useCallback(
    (tipo: TipoNovoPonto, nome: string) => {
      if (!criarPonto) return;
      if (tipo === "ponto_encontro") {
        salvarPontoEncontro({ lat: criarPonto.lat, lng: criarPonto.lng, descricao: nome });
        setPontoEncontro({ lat: criarPonto.lat, lng: criarPonto.lng, descricao: nome });
        mostrarFeedback("Ponto de encontro atualizado!");
      } else {
        adicionarPoi({ tipo, nome: nome.trim(), lat: criarPonto.lat, lng: criarPonto.lng });
        setPois(lerPois());
        mostrarFeedback("Ponto criado!");
      }
      setCriarPonto(null);
    },
    [criarPonto, mostrarFeedback]
  );

  const removerPoi = useCallback((id: string) => {
    removerPoiStore(id);
    setPois(lerPois());
  }, []);

  const aoClicarPoi = useCallback(
    (id: string, nome: string, rotulo: string, lat: number, lng: number) => {
      setNavegacao(null);
      setModalPoi({ id, nome, rotulo, lat, lng });
    },
    []
  );

  const aoClicarEncontro = useCallback(() => {
    if (!pontoEncontro) return;
    setNavegacao(null);
    setModalPoi({
      id: "encontro",
      nome: pontoEncontro.descricao,
      rotulo: "Ponto de Encontro",
      lat: pontoEncontro.lat,
      lng: pontoEncontro.lng,
    });
  }, [pontoEncontro]);

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
      setNavegacao(rota ?? [
        [posicao.lat, posicao.lng],
        [alvo.lat, alvo.lng],
      ]);
      setDrawerAberto(false);
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

  const iniciarCriacaoRota = useCallback((nome: string) => {
    setRotaEmCriacao({ nome, pontos: [] });
    setModoCriarRota(true);
    setDrawerAberto(false);
    setNavegacao(null);
  }, []);

  const adicionarPontoRota = useCallback(
    (lat: number, lng: number) => {
      if (!rotaEmCriacao) return;
      const ponto = { lat, lng, nome: `Parada ${rotaEmCriacao.pontos.length + 1}` };
      setRotaEmCriacao((prev) =>
        prev ? { ...prev, pontos: [...prev.pontos, ponto] } : prev
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
    setDrawerAberto(true);
    mostrarFeedback("Rota criada e ativada!");
  }, [rotaEmCriacao, mostrarFeedback]);

  const cancelarCriacaoRota = useCallback(() => {
    setRotaEmCriacao(null);
    setModoCriarRota(false);
  }, []);

  const iniciarGravacao = useCallback(() => {
    if (!posicao) {
      mostrarFeedback("Aguarde o GPS para gravar o trajeto.");
      return;
    }
    setTrajetoEmGravacao([{ lat: posicao.lat, lng: posicao.lng, ts: Date.now() }]);
    setGravandoTrajeto(true);
    setDrawerAberto(false);
  }, [posicao, mostrarFeedback]);

  useEffect(() => {
    return setAoAtualizar(({ lat, lng }) => {
      if (gravandoTrajeto) {
        setTrajetoEmGravacao((prev) => {
          const ultimo = prev[prev.length - 1];
          const podeAdicionar =
            !ultimo ||
            (ultimo.ts !== undefined && Date.now() - ultimo.ts >= 15_000) ||
            filtrarPorDistancia(ultimo, { lat, lng }, 10);
          if (!podeAdicionar) return prev;
          return [...prev, { lat, lng, ts: Date.now() }];
        });
      }
      if (sessaoLider) {
        void fetch(`/api/sessao/${sessaoLider}/posicao`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: "lider-romeirogps",
            lat,
            lng,
            ts: Date.now(),
            cor: "#f59e0b",
            nome: "Líder",
            bateria: null,
            precisao: 0,
            status: "",
            statusTs: 0,
            online: true,
            lider: true,
            pois: pois.map((p) => ({ id: p.id, nome: p.nome, tipo: p.tipo, lat: p.lat, lng: p.lng })),
          }),
        }).catch(() => void 0);
      }
    });
  }, [setAoAtualizar, gravandoTrajeto, sessaoLider, pois]);

  const finalizarGravacao = useCallback(
    (nome: string) => {
      if (trajetoEmGravacao.length < 2) {
        mostrarFeedback("Trajeto muito curto. Caminhe um pouco mais.");
        return;
      }
      const trajeto = criarTrajeto({ nome: nome || "Trajeto gravado", pontos: trajetoEmGravacao });
      setRotaAtivaId(trajeto.id);
      setRotas(lerRotas());
      setGravandoTrajeto(false);
      setTrajetoEmGravacao([]);
      setDrawerAberto(true);
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

  const avisosNotificados = useRef<Set<string>>(new Set());
  useEffect(() => {
    const idsAtuais = new Set(avisos.map((a) => a.id));
    for (const id of [...avisosNotificados.current]) {
      if (!idsAtuais.has(id)) avisosNotificados.current.delete(id);
    }
    for (const a of avisos) {
      if (!avisosNotificados.current.has(a.id)) {
        avisosNotificados.current.add(a.id);
        if ("vibrate" in navigator) navigator.vibrate?.([200, 100, 200]);
        mostrarFeedback(`${a.nome || "Um romeiro"} saiu do trajeto!`);
      }
    }
  }, [avisos, mostrarFeedback]);

  return (
    <div className="relative h-dvh w-full overflow-hidden bg-zinc-100">
      <div className="absolute inset-0">
        <MapView
          minhaPosicao={posicao ? { lat: posicao.lat, lng: posicao.lng } : null}
          pontoEncontro={pontoEncontro}
          pois={pois}
          linhaRota={linhaRotaExibicao}
          pontosRota={pontosRotaVisiveis}
          navegacao={navegacao}
          membros={membros}
          modoCriarRota={modoCriarRota}
          aoLongPress={aoLongPress}
          aoAdicionarPontoRota={adicionarPontoRota}
          aoClicarPoi={aoClicarPoi}
          aoClicarEncontro={aoClicarEncontro}
        />
      </div>

      {!telefone ? (
        <TelaIdentificacao aoConfirmar={confirmarTelefone} />
      ) : (
        <>
      <header className="pointer-events-none absolute inset-x-0 top-0 z-[900] flex items-center justify-between p-3">
        <div className="pointer-events-auto rounded-2xl bg-white/95 px-4 py-2 shadow-md">
          <p className="text-base font-extrabold text-blue-900">RomeiroGPS</p>
          <p className="text-[11px] font-medium text-zinc-500">Aparecida - SP</p>
        </div>
      </header>

      {(modoCriarRota || gravandoTrajeto) && (
        <div className="pointer-events-none absolute inset-x-0 top-[4.5rem] z-[900] flex justify-center px-3">
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

      {!pontoEncontro && !modoCriarRota && !gravandoTrajeto && (
        <div className="pointer-events-none absolute inset-x-0 top-[7.5rem] z-[900] flex justify-center px-3">
          <p className="rounded-full bg-amber-500/95 px-4 py-1.5 text-xs font-bold text-white shadow-lg">
            Segure o mapa para marcar o ponto de encontro
          </p>
        </div>
      )}

      {avisos.length > 0 && (
        <div className="absolute inset-x-0 top-[7.5rem] z-[900] flex justify-center px-3">
          <button
            type="button"
            onClick={() => setDrawerAberto(true)}
            className="flex items-center gap-2 rounded-full bg-red-600/95 px-4 py-2 text-xs font-bold text-white shadow-lg active:scale-[.98]"
          >
            <span className="h-2 w-2 animate-pulse rounded-full bg-white" />
            {avisos.length} fora do trajeto · toque para ver
          </button>
        </div>
      )}

      {feedback && (
        <div className="pointer-events-none absolute inset-x-0 top-16 z-[950] flex justify-center px-3">
          <p className="rounded-full bg-zinc-900/90 px-4 py-2 text-sm font-bold text-white shadow-lg">
            {feedback}
          </p>
        </div>
      )}

      {modoCriarRota && (
        <div className="absolute inset-x-0 bottom-32 z-[900] flex justify-center gap-2 px-4">
          <button
            type="button"
            onClick={cancelarCriacaoRota}
            className="rounded-xl bg-white px-5 py-3 text-sm font-bold text-zinc-700 shadow-lg active:scale-95"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={finalizarRota}
            className="rounded-xl bg-blue-700 px-5 py-3 text-sm font-bold text-white shadow-lg active:scale-95"
          >
            Finalizar ({rotaEmCriacao?.pontos.length ?? 0})
          </button>
        </div>
      )}

      {gravandoTrajeto && (
        <div className="absolute inset-x-0 bottom-32 z-[900] flex justify-center px-4">
          <button
            type="button"
            onClick={() => setDrawerAberto(true)}
            className="rounded-xl bg-red-600 px-5 py-3 text-sm font-bold text-white shadow-lg active:scale-95"
          >
            Parar e salvar
          </button>
        </div>
      )}

      <CaravanaDrawer
        aberto={drawerAberto}
        telefone={telefone}
        pontoEncontro={pontoEncontro}
        gpsStatus={gpsStatus}
        erroGps={erro}
        minhaPosicao={posicao}
        pois={pois}
        rotas={rotas}
        rotaAtivaId={rotaAtivaId}
        gravandoTrajeto={gravandoTrajeto}
        trajetoEmGravacao={trajetoEmGravacao}
        avisos={avisos}
        aoAbrir={() => setDrawerAberto(true)}
        aoFechar={() => setDrawerAberto(false)}
        aoLimparPontoEncontro={limparPontoEncontro}
        aoTrocarTelefone={trocarTelefone}
        aoReiniciarGps={() => {
          parar();
          iniciar();
        }}
        aoCompartilhar={compartilhar}
        aoVisualizar={visualizar}
        aoSalvarDadosOnibus={salvarDadosOnibus}
        aoRemoverPoi={removerPoi}
        aoIniciarRotaPersonalizada={iniciarCriacaoRota}
        aoIniciarGravacao={iniciarGravacao}
        aoFinalizarGravacao={finalizarGravacao}
        aoCancelarGravacao={cancelarGravacao}
        aoAtivarRota={ativarRota}
        aoRemoverRota={removerRota}
        aoAbrirTutorial={() => setTutorialAberto(true)}
      />

      {criarPonto && (
        <CriarPontoModal
          lat={criarPonto.lat}
          lng={criarPonto.lng}
          aoSalvar={salvarNovoPonto}
          aoFechar={() => setCriarPonto(null)}
        />
      )}

      {modalPoi && (
        <ModalPoi
          ponto={modalPoi}
          carregandoRota={carregandoRota}
          aoNavegar={() => navegarParaPonto(modalPoi)}
          aoAbrirExterno={abrirExterno}
          aoFechar={() => setModalPoi(null)}
        />
      )}

      {tutorialAberto && <TutorialModal aoFechar={() => setTutorialAberto(false)} />}
        </>
      )}
    </div>
  );
}