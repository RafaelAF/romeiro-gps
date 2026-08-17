"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useCaravanaTracking } from "@/lib/useCaravanaTracking";

export interface PoiSessao {
  id: string;
  nome: string;
  tipo: string;
  lat: number;
  lng: number;
}

export interface PosicaoMembro {
  id: string;
  lat: number;
  lng: number;
  ts: number;
  cor: string;
  nome: string;
  bateria: number | null;
  precisao: number;
  status: string;
  statusTs: number;
  online: boolean;
  lider?: boolean;
  pois?: PoiSessao[];
}

const CORES = [
  "#f97316",
  "#8b5cf6",
  "#ec4899",
  "#14b8a6",
  "#eab308",
  "#06b6d4",
  "#a855f7",
  "#22c55e",
];

function obterNomeSalvo(): string {
  try {
    return localStorage.getItem("romeirogps:membro-nome") || "";
  } catch {
    return "";
  }
}

function salvarNomeLocal(nome: string): void {
  try {
    localStorage.setItem("romeirogps:membro-nome", nome);
  } catch {
    void 0;
  }
}

function inicializarMembro(): { id: string; cor: string } {
  try {
    const idChave = "romeirogps:membro-id";
    const corChave = "romeirogps:membro-cor";
    let id = localStorage.getItem(idChave);
    if (!id) {
      id = Math.random().toString(36).slice(2, 10);
      localStorage.setItem(idChave, id);
    }
    let cor = localStorage.getItem(corChave);
    if (!cor) {
      cor = CORES[Math.floor(Math.random() * CORES.length)];
      localStorage.setItem(corChave, cor);
    }
    return { id, cor };
  } catch {
    return {
      id: Math.random().toString(36).slice(2, 10),
      cor: CORES[0],
    };
  }
}

interface NavigatorWithBattery extends Navigator {
  getBattery?: () => Promise<{ level: number }>;
}

async function obterNivelBateria(): Promise<number | null> {
  try {
    const nav = navigator as NavigatorWithBattery;
    if (nav.getBattery) {
      const bat = await nav.getBattery();
      return Math.round(bat.level * 100);
    }
  } catch {
    void 0;
  }
  return null;
}

export function useSessaoRealtime(sessaoId: string | undefined) {
  const [membros, setMembros] = useState<Map<string, PosicaoMembro>>(new Map());
  const [compartilhando, setCompartilhando] = useState(false);
  const [membro] = useState<{ id: string; cor: string }>(inicializarMembro);
  const [nome, setNomeState] = useState<string>(obterNomeSalvo);
  const [statusText, setStatusText] = useState<string>("");
  const [statusTs, setStatusTs] = useState<number>(0);
  const esFRef = useRef<EventSource | null>(null);

  const definirNome = useCallback((novoNome: string) => {
    const limpo = novoNome.trim().slice(0, 30);
    salvarNomeLocal(limpo);
    setNomeState(limpo);
  }, []);

  useEffect(() => {
    if (!sessaoId) return;

    let es: EventSource;
    let tentativas = 0;
    let cancelado = false;

    function conectar() {
      if (cancelado) return;
      // Passa ?membroId=... para sabermos quem desconectou se fechar a aba
      es = new EventSource(`/api/sessao/${sessaoId}/stream?membroId=${membro.id}`);
      esFRef.current = es;

      es.onmessage = (e) => {
        try {
          const p = JSON.parse(e.data) as PosicaoMembro;
          setMembros((prev) => new Map(prev).set(p.id, p));
        } catch {
          void 0;
        }
      };

      es.onerror = () => {
        es.close();
        if (cancelado) return;
        tentativas += 1;
        const delay = Math.min(1000 * 2 ** tentativas, 30_000);
        setTimeout(conectar, delay);
      };

      es.onopen = () => {
        tentativas = 0;
      };
    }

    conectar();

    return () => {
      cancelado = true;
      es?.close();
      esFRef.current = null;
    };
  }, [sessaoId, membro.id]);

  const { posicao, iniciar, parar, setAoAtualizar } = useCaravanaTracking();

  const publicarPosicao = useCallback(
    async (lat: number, lng: number, statusForcado?: string, statusTsForcado?: number) => {
      if (!sessaoId || !nome) return;
      
      const bat = await obterNivelBateria();
      const gpsPrecisao = posicao ? Math.round(posicao.precisao) : 0;
      
      const sText = statusForcado !== undefined ? statusForcado : statusText;
      const sTs = statusTsForcado !== undefined ? statusTsForcado : statusTs;

      try {
        await fetch(`/api/sessao/${sessaoId}/posicao`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: membro.id,
            lat,
            lng,
            ts: Date.now(),
            cor: membro.cor,
            nome,
            bateria: bat,
            precisao: gpsPrecisao,
            status: sText,
            statusTs: sTs,
            online: true,
          }),
        });
      } catch {
        void 0;
      }
    },
    [sessaoId, membro, nome, posicao, statusText, statusTs]
  );

  useEffect(() => {
    return setAoAtualizar(({ lat, lng }) => {
      void publicarPosicao(lat, lng);
    });
  }, [setAoAtualizar, publicarPosicao]);

  const enviarStatus = useCallback(
    async (novoStatus: string) => {
      const ts = novoStatus === "" ? 0 : Date.now();
      setStatusText(novoStatus);
      setStatusTs(ts);
      
      // Se tiver localização ativa, manda imediatamente
      if (posicao) {
        await publicarPosicao(posicao.lat, posicao.lng, novoStatus, ts);
      }
    },
    [posicao, publicarPosicao]
  );

  const ativarCompartilhamento = useCallback(() => {
    iniciar();
    setCompartilhando(true);
  }, [iniciar]);

  const desativarCompartilhamento = useCallback(() => {
    parar();
    setCompartilhando(false);
  }, [parar]);

  const membrosVisiveis = [...membros.values()].filter((m) => m.id !== membro.id);
  const lider = membrosVisiveis.find((m) => m.lider) ?? null;
  const poisLider = lider?.pois ?? [];

  return {
    membros: membrosVisiveis,
    lider,
    poisLider,
    meuId: membro.id,
    minhaCor: membro.cor,
    posicao,
    compartilhando,
    nome,
    statusText,
    statusTs,
    definirNome,
    enviarStatus,
    ativarCompartilhamento,
    desativarCompartilhamento,
  };
}
