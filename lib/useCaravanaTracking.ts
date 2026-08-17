"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { PayloadGps } from "@/lib/types";
import { filtrarPorDistancia } from "@/lib/utils";

export type StatusGps = "idle" | "solicitando" | "ativo" | "erro" | "negado";

export interface PosicaoAtual {
  lat: number;
  lng: number;
  precisao: number;
  ts: number;
}

interface OpcoesTracking {
  intervaloMinimoMs?: number;
  distanciaMinimaM?: number;
}

export type AoAtualizarPosicao = (posicao: Omit<PayloadGps, "id">) => void;

export function useCaravanaTracking(opcoes: OpcoesTracking = {}) {
  const { intervaloMinimoMs = 15_000, distanciaMinimaM = 10 } = opcoes;

  const [posicao, setPosicao] = useState<PosicaoAtual | null>(null);
  const [status, setStatus] = useState<StatusGps>("idle");
  const [erro, setErro] = useState<string | null>(null);

  const watchIdRef = useRef<number | null>(null);
  const ultimoEnvioRef = useRef<PosicaoAtual | null>(null);
  const aoAtualizarRef = useRef<Set<AoAtualizarPosicao>>(new Set());

  const setAoAtualizar = useCallback((callback: AoAtualizarPosicao) => {
    aoAtualizarRef.current.add(callback);
    return () => {
      aoAtualizarRef.current.delete(callback);
    };
  }, []);

  const parar = useCallback(() => {
    if (watchIdRef.current !== null && "geolocation" in navigator) {
      navigator.geolocation.clearWatch(watchIdRef.current);
    }
    watchIdRef.current = null;
    ultimoEnvioRef.current = null;
    setStatus("idle");
    setErro(null);
  }, []);

  const iniciar = useCallback(() => {
    if (watchIdRef.current !== null) return;
    if (!("geolocation" in navigator)) {
      setStatus("erro");
      setErro("Geolocalização não suportada neste navegador.");
      return;
    }
    setStatus("solicitando");
    setErro(null);

    watchIdRef.current = navigator.geolocation.watchPosition(
      (posicaoNova) => {
        const atual: PosicaoAtual = {
          lat: posicaoNova.coords.latitude,
          lng: posicaoNova.coords.longitude,
          precisao: posicaoNova.coords.accuracy,
          ts: Date.now(),
        };
        setPosicao(atual);
        setStatus("ativo");

        const ultimo = ultimoEnvioRef.current;
        const deveEnviar =
          !ultimo ||
          atual.ts - ultimo.ts >= intervaloMinimoMs ||
          filtrarPorDistancia(ultimo, atual, distanciaMinimaM);
        if (deveEnviar) {
          ultimoEnvioRef.current = atual;
          const snapshot = {
            lat: atual.lat,
            lng: atual.lng,
            ts: atual.ts,
          };
          aoAtualizarRef.current.forEach((fn) => fn(snapshot));
        }
      },
      (erroNavegador) => {
        if (erroNavegador.code === 1) {
          setStatus("negado");
          setErro("Permissão de localização negada. Ative-a nas configurações.");
        } else {
          setStatus("erro");
          setErro(`Erro de geolocalização (código ${erroNavegador.code}).`);
        }
      },
      { enableHighAccuracy: true, maximumAge: 10_000, timeout: 15_000 }
    );
  }, [intervaloMinimoMs, distanciaMinimaM]);

  useEffect(() => {
    return () => {
      if (watchIdRef.current !== null && "geolocation" in navigator) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, []);

  return { posicao, status, erro, iniciar, parar, setAoAtualizar };
}
