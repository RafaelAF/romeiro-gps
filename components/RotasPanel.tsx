"use client";

import { useState } from "react";
import {
  ArrowLeft,
  Check,
  Footprints,
  Play,
  Plus,
  Route,
  Square,
  Trash2,
} from "lucide-react";
import type { CoordenadaRota, Rota } from "@/lib/types";

export interface RotasPanelProps {
  rotas: Rota[];
  rotaAtivaId: string | null;
  gravandoTrajeto: boolean;
  trajetoEmGravacao: CoordenadaRota[];
  aoVoltar: () => void;
  aoIniciarRotaPersonalizada: (nome: string) => void;
  aoIniciarGravacao: () => void;
  aoFinalizarGravacao: (nome: string) => void;
  aoCancelarGravacao: () => void;
  aoAtivarRota: (id: string | null) => void;
  aoRemoverRota: (id: string) => void;
}

export default function RotasPanel({
  rotas,
  rotaAtivaId,
  gravandoTrajeto,
  trajetoEmGravacao,
  aoVoltar,
  aoIniciarRotaPersonalizada,
  aoIniciarGravacao,
  aoFinalizarGravacao,
  aoCancelarGravacao,
  aoAtivarRota,
  aoRemoverRota,
}: RotasPanelProps) {
  const [nomeRota, setNomeRota] = useState("");
  const [nomeTrajeto, setNomeTrajeto] = useState("");

  return (
    <div>
      <button
        type="button"
        onClick={aoVoltar}
        className="mb-3 flex items-center gap-2 font-semibold text-blue-700"
      >
        <ArrowLeft className="h-5 w-5" />
        Voltar
      </button>
      <h2 className="mb-3 text-lg font-bold text-zinc-900">Rotas e Trajetos</h2>

      {gravandoTrajeto ? (
        <div className="space-y-3 rounded-2xl border-2 border-emerald-300 bg-emerald-50 p-4">
          <p className="flex items-center gap-2 text-sm font-bold text-emerald-800">
            <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-red-500" />
            Gravando trajeto...
          </p>
          <p className="text-sm font-medium text-zinc-700">
            {trajetoEmGravacao.length} pontos capturados. Continue caminhando ou pare quando
            terminar.
          </p>
          <input
            type="text"
            maxLength={40}
            placeholder="Nome do trajeto (Ex: Subida do Morro)"
            value={nomeTrajeto}
            onChange={(e) => setNomeTrajeto(e.target.value)}
            className="w-full rounded-xl border-2 border-zinc-300 bg-white px-3 py-2.5 text-sm font-semibold text-zinc-900 outline-none focus:border-emerald-600"
          />
          <button
            type="button"
            onClick={() => aoFinalizarGravacao(nomeTrajeto.trim())}
            className="flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-emerald-700 px-4 py-2.5 text-sm font-bold text-white active:scale-[.98]"
          >
            <Square className="h-4 w-4" />
            Parar e salvar
          </button>
          <button
            type="button"
            onClick={aoCancelarGravacao}
            className="w-full rounded-xl border border-zinc-300 bg-white py-2.5 text-sm font-bold text-zinc-700 active:bg-zinc-50"
          >
            Cancelar gravação
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-3">
            <p className="mb-1.5 flex items-center gap-2 text-sm font-bold text-zinc-700">
              <Route className="h-4 w-4 text-blue-700" />
              Rota personalizada
            </p>
            <p className="mb-2 text-xs font-medium text-zinc-500">
              Defina os pontos e a ordem de visitação tocando no mapa.
            </p>
            <input
              type="text"
              maxLength={40}
              placeholder="Nome da rota (Ex: Circuito do Santuário)"
              value={nomeRota}
              onChange={(e) => setNomeRota(e.target.value)}
              className="w-full rounded-xl border-2 border-zinc-300 bg-white px-3 py-2.5 text-sm font-semibold text-zinc-900 outline-none focus:border-blue-600"
            />
            <button
              type="button"
              onClick={() => aoIniciarRotaPersonalizada(nomeRota.trim())}
              disabled={nomeRota.trim().length < 2}
              className="mt-2 flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-blue-700 px-4 py-2.5 text-sm font-bold text-white active:scale-[.98] disabled:opacity-50"
            >
              <Plus className="h-4 w-4" />
              Iniciar nova rota
            </button>
          </div>

          <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-3">
            <p className="mb-1.5 flex items-center gap-2 text-sm font-bold text-zinc-700">
              <Footprints className="h-4 w-4 text-emerald-700" />
              Gravar trajeto
            </p>
            <p className="mb-2 text-xs font-medium text-zinc-500">
              Usado para lugares sem sinal de internet/celular ou ambientes internos: caminhe e o
              app captura os pontos.
            </p>
            <button
              type="button"
              onClick={aoIniciarGravacao}
              className="flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-emerald-700 px-4 py-2.5 text-sm font-bold text-white active:scale-[.98]"
            >
              <Play className="h-4 w-4" />
              Iniciar gravação
            </button>
          </div>

          <div className="space-y-2">
            <p className="text-xs font-bold uppercase tracking-wide text-zinc-500">
              Rotas salvas ({rotas.length})
            </p>
            {rotas.length === 0 && (
              <p className="text-sm font-medium text-zinc-400">Nenhuma rota criada ainda.</p>
            )}
            {rotas.map((rota) => {
              const ativa = rotaAtivaId === rota.id;
              return (
                <div
                  key={rota.id}
                  className={`rounded-2xl border p-3 ${ativa ? "border-blue-300 bg-blue-50" : "border-zinc-200 bg-white"}`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-bold text-zinc-900">{rota.nome}</p>
                      <p className="text-xs font-medium text-zinc-500">
                        {rota.tipo === "personalizada" ? "Rota personalizada" : "Trajeto gravado"} ·{" "}
                        {rota.pontos.length} pontos
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => aoRemoverRota(rota.id)}
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-red-600 active:bg-red-50"
                      aria-label="Excluir rota"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={() => aoAtivarRota(ativa ? null : rota.id)}
                    className={`mt-2 flex min-h-10 w-full items-center justify-center gap-2 rounded-xl px-3 py-2 text-xs font-bold ${
                      ativa
                        ? "border-2 border-blue-300 bg-blue-100 text-blue-800"
                        : "border-2 border-zinc-300 bg-white text-zinc-700 active:bg-zinc-50"
                    }`}
                  >
                    <Check className="h-4 w-4" />
                    {ativa ? "Rota ativa (referência para avisos)" : "Ativar rota"}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}