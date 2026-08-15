"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useCaravanaTracking } from "@/lib/useCaravanaTracking";

export interface PosicaoMembro {
  id: string;
  lat: number;
  lng: number;
  ts: number;
  cor: string;
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

function inicializarMembro(): { id: string; cor: string } {
  try {
    const idChave = "romeirogps:membro-id";
    const corChave = "romeirogps:membro-cor";
    let id = sessionStorage.getItem(idChave);
    if (!id) {
      id = Math.random().toString(36).slice(2, 10);
      sessionStorage.setItem(idChave, id);
    }
    let cor = sessionStorage.getItem(corChave);
    if (!cor) {
      cor = CORES[Math.floor(Math.random() * CORES.length)];
      sessionStorage.setItem(corChave, cor);
    }
    return { id, cor };
  } catch {
    return {
      id: Math.random().toString(36).slice(2, 10),
      cor: CORES[0],
    };
  }
}

export function useSessaoRealtime(sessaoId: string | undefined) {
  const [membros, setMembros] = useState<Map<string, PosicaoMembro>>(new Map());
  const [compartilhando, setCompartilhando] = useState(false);
  const [membro] = useState<{ id: string; cor: string }>(inicializarMembro);
  const esFRef = useRef<EventSource | null>(null);

  useEffect(() => {
    if (!sessaoId) return;

    let es: EventSource;
    let tentativas = 0;
    let cancelado = false;

    function conectar() {
      if (cancelado) return;
      es = new EventSource(`/api/sessao/${sessaoId}/stream`);
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
  }, [sessaoId]);

  const { posicao, iniciar, parar, setAoAtualizar } = useCaravanaTracking();

  const publicarPosicao = useCallback(
    async (lat: number, lng: number) => {
      if (!sessaoId) return;
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
          }),
        });
      } catch {
        void 0;
      }
    },
    [sessaoId, membro]
  );

  useEffect(() => {
    setAoAtualizar(({ lat, lng }) => {
      void publicarPosicao(lat, lng);
    });
  }, [setAoAtualizar, publicarPosicao]);

  const ativarCompartilhamento = useCallback(() => {
    iniciar();
    setCompartilhando(true);
  }, [iniciar]);

  const desativarCompartilhamento = useCallback(() => {
    parar();
    setCompartilhando(false);
  }, [parar]);

  const membrosVisiveis = [...membros.values()].filter((m) => m.id !== membro.id);

  return {
    membros: membrosVisiveis,
    meuId: membro.id,
    minhaCor: membro.cor,
    posicao,
    compartilhando,
    ativarCompartilhamento,
    desativarCompartilhamento,
  };
}

