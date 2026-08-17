"use client";

import { useEffect, useRef, useState } from "react";
import { distanciaParaPolilinhaKm } from "@/lib/rotas";
import type { Rota } from "@/lib/types";

export interface MembroLider {
  id: string;
  cor: string;
  nome: string;
  lat: number;
  lng: number;
  online: boolean;
  status: string;
  statusTs: number;
  foraDesde: number | null;
  foraDoTrajeto: boolean;
}

interface MembroInterno {
  id: string;
  cor: string;
  nome: string;
  lat: number;
  lng: number;
  online: boolean;
  status: string;
  statusTs: number;
  sessaoId: string | null;
  foraRotaId: string | null;
  foraDesde: number | null;
}

const LIMITE_FORA_TRAJETO_M = 60;
const TEMPO_FORA_TRAJETO_MS = 60_000;
const ID_LIDER = "lider-romeirogps";

export function useSessaoLider(sessaoId: string | null, rotaAtiva: Rota | null) {
  const [membros, setMembros] = useState<Map<string, MembroInterno>>(new Map());
  const [agora, setAgora] = useState(() => Date.now());
  const rotaRef = useRef<Rota | null>(rotaAtiva);

  useEffect(() => {
    rotaRef.current = rotaAtiva;
  }, [rotaAtiva]);

  useEffect(() => {
    if (!sessaoId) return;

    let es: EventSource | null = null;
    let cancelado = false;

    const conectar = () => {
      if (cancelado) return;
      es = new EventSource(`/api/sessao/${sessaoId}/stream?membroId=${ID_LIDER}`);
      es.onmessage = (e) => {
        try {
          const p = JSON.parse(e.data) as {
            id: string;
            cor: string;
            nome: string;
            lat: number;
            lng: number;
            online: boolean;
            status?: string;
            statusTs?: number;
          };
          if (!p?.id || p.id === ID_LIDER) return;

          const rota = rotaRef.current;
          const rotaIdAtual = rota?.id ?? null;
          let foraDesde: number | null = null;
          let foraRotaId: string | null = null;
          if (rota && p.online) {
            const distM = distanciaParaPolilinhaKm(p, rota.pontos) * 1000;
            if (distM > LIMITE_FORA_TRAJETO_M) {
              foraDesde = Date.now();
              foraRotaId = rotaIdAtual;
            }
          }

          setMembros((prev) => {
            const anterior = prev.get(p.id);
            const anteriorValido =
              anterior && anterior.foraRotaId === rotaIdAtual ? anterior.foraDesde : null;
            return new Map(prev).set(p.id, {
              id: p.id,
              cor: p.cor,
              nome: p.nome,
              lat: p.lat,
              lng: p.lng,
              online: p.online,
              status: p.status ?? "",
              statusTs: p.statusTs ?? 0,
              sessaoId,
              foraRotaId,
              foraDesde:
                foraDesde !== null && anteriorValido !== null
                  ? Math.min(foraDesde, anteriorValido)
                  : foraDesde,
            });
          });
        } catch {
          void 0;
        }
      };
      es.onerror = () => {
        es?.close();
        if (cancelado) return;
        setTimeout(conectar, 3000);
      };
    };

    conectar();

    const intervalo = setInterval(() => setAgora(Date.now()), 5000);

    return () => {
      cancelado = true;
      es?.close();
      clearInterval(intervalo);
    };
  }, [sessaoId]);

  const rotaId = rotaAtiva?.id ?? null;

  const membrosLista: MembroLider[] = [...membros.values()]
    .filter((m) => m.sessaoId === sessaoId)
    .map((m) => {
      const foraDesde = m.foraRotaId === rotaId ? m.foraDesde : null;
      const foraDoTrajeto =
        foraDesde !== null && agora - foraDesde > TEMPO_FORA_TRAJETO_MS;
      return {
        id: m.id,
        cor: m.cor,
        nome: m.nome,
        lat: m.lat,
        lng: m.lng,
        online: m.online,
        status: m.status,
        statusTs: m.statusTs,
        foraDesde,
        foraDoTrajeto,
      };
    });

  return { membros: membrosLista, avisos: membrosLista.filter((m) => m.foraDoTrajeto) };
}