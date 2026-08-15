"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import MapView from "@/components/MapView";
import CaravanaDrawer from "@/components/CaravanaDrawer";
import TelaIdentificacao from "@/components/TelaIdentificacao";
import { useCaravanaTracking } from "@/lib/useCaravanaTracking";
import {
  assinarPontoEncontro,
  gerarLinkCompartilhamento,
  lerPontoEncontro,
  lerTelefone,
  salvarPontoEncontro,
  salvarTelefone,
} from "@/lib/pontoEncontro";
import { CATEGORIAS } from "@/lib/pois";
import type { CategoriaPoi, PontoEncontro } from "@/lib/types";

export default function CaravanaApp() {
  const { posicao, status: gpsStatus, erro, iniciar, parar } = useCaravanaTracking();

  const [telefone, setTelefone] = useState<string | null>(() => lerTelefone());
  const [pontoEncontro, setPontoEncontro] = useState<PontoEncontro | null>(() =>
    lerPontoEncontro()
  );
  const [drawerAberto, setDrawerAberto] = useState(true);
  const [categoriasAtivas, setCategoriasAtivas] = useState<Set<CategoriaPoi>>(
    () => new Set(CATEGORIAS.map((c) => c.id))
  );
  const [feedback, setFeedback] = useState<string | null>(null);
  const temporizadorFeedback = useRef<number | null>(null);

  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => void 0);
    }
  }, []);

  useEffect(() => {
    return assinarPontoEncontro(setPontoEncontro);
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

  const definirEncontro = useCallback((lat: number, lng: number) => {
    salvarPontoEncontro({ lat, lng, descricao: "Ponto de Encontro / Ônibus" });
    setPontoEncontro({ lat, lng, descricao: "Ponto de Encontro / Ônibus" });
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

  const compartilhar = useCallback(async () => {
    if (!pontoEncontro || !telefone) return;
    const url = gerarLinkCompartilhamento(pontoEncontro, telefone);
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

  const alternarCategoria = useCallback((c: CategoriaPoi) => {
    setCategoriasAtivas((prev) => {
      const novo = new Set(prev);
      if (novo.has(c)) novo.delete(c);
      else novo.add(c);
      return novo;
    });
  }, []);

  if (!telefone) {
    return <TelaIdentificacao aoConfirmar={confirmarTelefone} />;
  }

  return (
    <div className="relative h-dvh w-full overflow-hidden bg-zinc-100">
      <div className="absolute inset-0">
        <MapView
          minhaPosicao={posicao ? { lat: posicao.lat, lng: posicao.lng } : null}
          pontoEncontro={pontoEncontro}
          categoriasAtivas={CATEGORIAS.map((c) => c.id).filter((id) =>
            categoriasAtivas.has(id)
          )}
          aoDefinirEncontro={definirEncontro}
        />
      </div>

      <header className="pointer-events-none absolute inset-x-0 top-0 z-[900] flex items-center justify-between p-3">
        <div className="pointer-events-auto rounded-2xl bg-white/95 px-4 py-2 shadow-md">
          <p className="text-base font-extrabold text-blue-900">RomeiroGPS</p>
          <p className="text-[11px] font-medium text-zinc-500">Aparecida - SP</p>
        </div>
      </header>

      <div className="absolute inset-x-0 top-[4.5rem] z-[900] flex gap-2 overflow-x-auto px-3 pb-1 [scrollbar-width:none]">
        {CATEGORIAS.map((c) => {
          const ativa = categoriasAtivas.has(c.id);
          return (
            <button
              key={c.id}
              type="button"
              onClick={() => alternarCategoria(c.id)}
              className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-bold transition-colors ${
                ativa ? "text-white shadow" : "bg-white/90 text-zinc-600 shadow-sm"
              }`}
              style={ativa ? { backgroundColor: c.cor } : undefined}
            >
              {c.rotulo}
            </button>
          );
        })}
      </div>

      {!pontoEncontro && (
        <div className="pointer-events-none absolute inset-x-0 top-[7.5rem] z-[900] flex justify-center px-3">
          <p className="rounded-full bg-amber-500/95 px-4 py-1.5 text-xs font-bold text-white shadow-lg">
            Segure o mapa para marcar o ponto de encontro
          </p>
        </div>
      )}

      <CaravanaDrawer
        aberto={drawerAberto}
        telefone={telefone}
        pontoEncontro={pontoEncontro}
        gpsStatus={gpsStatus}
        erroGps={erro}
        minhaPosicao={posicao}
        feedback={feedback}
        aoAbrir={() => setDrawerAberto(true)}
        aoFechar={() => setDrawerAberto(false)}
        aoLimparPontoEncontro={limparPontoEncontro}
        aoTrocarTelefone={trocarTelefone}
        aoCompartilhar={compartilhar}
        aoSalvarDadosOnibus={salvarDadosOnibus}
      />
    </div>
  );
}
