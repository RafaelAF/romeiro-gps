"use client";

import { useState } from "react";
import {
  ArrowLeft,
  ChevronDown,
  ChevronUp,
  Crown,
  Info,
  MapPin,
  Navigation,
  Phone,
  Share2,
  Trash2,
} from "lucide-react";
import type { PontoEncontro } from "@/lib/types";
import { CATEGORIA_TELEFONE, TELEFONES_UTEIS } from "@/data/telefones";
import type { PosicaoAtual, StatusGps } from "@/lib/useCaravanaTracking";

export interface CaravanaDrawerProps {
  aberto: boolean;
  telefone: string;
  pontoEncontro: PontoEncontro | null;
  gpsStatus: StatusGps;
  erroGps: string | null;
  minhaPosicao: PosicaoAtual | null;
  feedback: string | null;
  aoAbrir: () => void;
  aoFechar: () => void;
  aoLimparPontoEncontro: () => void;
  aoTrocarTelefone: () => void;
  aoCompartilhar: () => void;
}

function ChipGps({ status }: { status: StatusGps }) {
  const config = {
    idle: { texto: "Localização desativada", cor: "bg-zinc-200 text-zinc-700" },
    solicitando: { texto: "Solicitando localização...", cor: "bg-amber-100 text-amber-800" },
    ativo: { texto: "Localização ativa", cor: "bg-emerald-100 text-emerald-800" },
    erro: { texto: "Erro de GPS", cor: "bg-red-100 text-red-800" },
    negado: { texto: "Permissão de localização negada", cor: "bg-red-100 text-red-800" },
  }[status];
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold ${config.cor}`}
    >
      <Navigation className="h-3.5 w-3.5" />
      {config.texto}
    </span>
  );
}

function mascararTelefone(telefone: string): string {
  const digitos = telefone.replace(/\D/g, "");
  if (digitos.length <= 4) return `••${digitos}`;
  return `••••••${digitos.slice(-4)}`;
}

export default function CaravanaDrawer({
  aberto,
  telefone,
  pontoEncontro,
  gpsStatus,
  erroGps,
  minhaPosicao,
  feedback,
  aoAbrir,
  aoFechar,
  aoLimparPontoEncontro,
  aoTrocarTelefone,
  aoCompartilhar,
}: CaravanaDrawerProps) {
  const [mostrarTelefones, setMostrarTelefones] = useState(false);

  const cabecalho = (
    <button
      type="button"
      onClick={aberto ? aoFechar : aoAbrir}
      className="flex w-full items-center justify-between px-5 py-4"
    >
      <div className="min-w-0 text-left">
        <p className="flex items-center gap-2 text-xl font-extrabold text-blue-900">
          RomeiroGPS
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-bold text-amber-800">
            <Crown className="h-3.5 w-3.5" />
            Líder
          </span>
        </p>
        <p className="truncate text-sm font-medium text-zinc-600">
          {gpsStatus === "ativo"
            ? "Sua localização em tempo real"
            : "Turismo e caravanas em Aparecida - SP"}
        </p>
      </div>
      {aberto ? (
        <ChevronDown className="h-7 w-7 shrink-0 text-zinc-500" />
      ) : (
        <ChevronUp className="h-7 w-7 shrink-0 text-zinc-500" />
      )}
    </button>
  );

  return (
    <div
      className={`absolute inset-x-0 bottom-0 z-[1000] transition-transform duration-300 ${
        aberto ? "translate-y-0" : "translate-y-[calc(100%-5rem)]"
      }`}
    >
      <div className="mx-auto max-w-2xl rounded-t-3xl border-t border-zinc-200 bg-white shadow-[0_-4px_24px_rgba(0,0,0,.18)]">
        {cabecalho}

        {aberto && (
          <div className="max-h-[62dvh] overflow-y-auto px-5 pb-6">
            {mostrarTelefones ? (
              <div>
                <button
                  type="button"
                  onClick={() => setMostrarTelefones(false)}
                  className="mb-3 flex items-center gap-2 font-semibold text-blue-700"
                >
                  <ArrowLeft className="h-5 w-5" />
                  Voltar
                </button>
                <h2 className="mb-3 text-lg font-bold text-zinc-900">Telefones Úteis</h2>
                {Object.entries(CATEGORIA_TELEFONE).map(([categoria, rotulo]) => (
                  <div key={categoria} className="mb-4">
                    <p className="mb-1 text-xs font-bold uppercase tracking-wide text-zinc-500">
                      {rotulo}
                    </p>
                    <div className="divide-y divide-zinc-100 rounded-2xl border border-zinc-200">
                      {TELEFONES_UTEIS.filter((t) => t.categoria === categoria).map((t) => (
                        <a
                          key={t.id}
                          href={`tel:${t.numero.replace(/\D/g, "")}`}
                          className="flex items-center justify-between gap-3 px-4 py-3 active:bg-zinc-50"
                        >
                          <span className="text-sm font-semibold text-zinc-800">{t.nome}</span>
                          <span className="inline-flex items-center gap-1.5 text-sm font-bold text-blue-800">
                            <Phone className="h-4 w-4" />
                            {t.numero}
                          </span>
                        </a>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                <div className="flex flex-wrap items-center gap-2">
                  <ChipGps status={gpsStatus} />
                </div>

                {erroGps && <p className="text-sm font-semibold text-red-600">{erroGps}</p>}

                <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-3">
                  <p className="mb-1 flex items-center gap-2 text-sm font-bold text-zinc-700">
                    <Navigation className="h-4 w-4" />
                    Minha localização
                  </p>
                  {minhaPosicao ? (
                    <p className="font-mono text-sm font-medium text-zinc-800">
                      {minhaPosicao.lat.toFixed(5)}, {minhaPosicao.lng.toFixed(5)}
                      <span className="ml-2 text-xs text-zinc-400">
                        precisão ±{Math.round(minhaPosicao.precisao)} m
                      </span>
                    </p>
                  ) : (
                    <p className="text-sm font-medium text-zinc-500">
                      Aguardando sinal de GPS...
                    </p>
                  )}
                </div>

                <div className="flex items-center justify-between gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-3">
                  <div>
                    <p className="flex items-center gap-2 text-sm font-bold text-zinc-700">
                      <Crown className="h-4 w-4" />
                      Você é o líder
                    </p>
                    <p className="text-xs font-medium text-zinc-500">
                      Celular {mascararTelefone(telefone)} · segure o mapa para marcar o ponto.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={aoTrocarTelefone}
                    className="shrink-0 rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-xs font-bold text-zinc-700 active:bg-zinc-50"
                  >
                    Trocar
                  </button>
                </div>

                <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-3">
                  <p className="mb-1 flex items-center gap-2 text-sm font-bold text-zinc-700">
                    <MapPin className="h-4 w-4" />
                    Ponto de Encontro
                  </p>
                  {pontoEncontro ? (
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm font-medium text-zinc-800">
                          {pontoEncontro.descricao} (
                          {pontoEncontro.lat.toFixed(5)}, {pontoEncontro.lng.toFixed(5)})
                        </p>
                        <button
                          type="button"
                          onClick={aoLimparPontoEncontro}
                          className="inline-flex shrink-0 items-center gap-1 rounded-lg px-2 py-1 text-xs font-bold text-red-700 active:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                          Limpar
                        </button>
                      </div>
                      <button
                        type="button"
                        onClick={aoCompartilhar}
                        className="mt-3 flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-blue-700 px-4 py-3 text-base font-bold text-white active:scale-[.98]"
                      >
                        <Share2 className="h-5 w-5" />
                        Compartilhar ponto de encontro
                      </button>
                      <p className="mt-1.5 text-center text-xs font-medium text-zinc-400">
                        O link é válido por 48 horas.
                      </p>
                      {feedback && (
                        <p className="mt-2 text-center text-sm font-bold text-emerald-700">
                          {feedback}
                        </p>
                      )}
                    </div>
                  ) : (
                    <p className="text-sm font-medium text-amber-700">
                      Segure o mapa para marcar o ponto de encontro.
                    </p>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => setMostrarTelefones(true)}
                  className="flex min-h-14 w-full items-center justify-center gap-3 rounded-2xl border-2 border-zinc-300 bg-white px-6 py-4 text-lg font-semibold text-zinc-800 active:scale-[.98]"
                >
                  <Phone className="h-6 w-6" />
                  Telefones Úteis
                </button>

                <p className="flex items-start gap-2 text-xs leading-5 text-zinc-500">
                  <Info className="mt-0.5 h-4 w-4 shrink-0" />
                  Você é o líder e o app funciona como mapa pessoal: localização, pontos turísticos e
                  o ponto de encontro, compartilhável por link. O número de celular é usado apenas
                  para identificação e geração do link; os dados não são usados para outros fins.
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
