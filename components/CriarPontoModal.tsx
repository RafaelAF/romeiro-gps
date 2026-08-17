"use client";

import { useState } from "react";
import { Flag, MapPin, Hotel, UtensilsCrossed, Landmark, X } from "lucide-react";
import type { TipoPoi } from "@/lib/types";

export type TipoNovoPonto = "ponto_encontro" | TipoPoi;

export interface CriarPontoModalProps {
  lat: number;
  lng: number;
  aoSalvar: (tipo: TipoNovoPonto, nome: string) => void;
  aoFechar: () => void;
}

const OPCOES: { tipo: TipoNovoPonto; rotulo: string; descricao: string; icone: typeof Flag; cor: string }[] = [
  { tipo: "ponto_encontro", rotulo: "Ponto de Encontro", descricao: "Substitui o ponto anterior", icone: Flag, cor: "#dc2626" },
  { tipo: "hotel", rotulo: "Hotel", descricao: "Hospedagem", icone: Hotel, cor: "#7c3aed" },
  { tipo: "restaurante", rotulo: "Restaurante", descricao: "Alimentação", icone: UtensilsCrossed, cor: "#d97706" },
  { tipo: "atracao", rotulo: "Atração", descricao: "Ponto turístico", icone: Landmark, cor: "#16a34a" },
];

export default function CriarPontoModal({ lat, lng, aoSalvar, aoFechar }: CriarPontoModalProps) {
  const [tipo, setTipo] = useState<TipoNovoPonto>("ponto_encontro");
  const [nome, setNome] = useState("");
  const [erro, setErro] = useState<string | null>(null);

  const salvar = () => {
    const limpo = nome.trim();
    if (tipo !== "ponto_encontro" && limpo.length < 2) {
      setErro("Dê um nome ao ponto (mínimo 2 letras).");
      return;
    }
    aoSalvar(tipo, limpo || "Ponto de Encontro / Ônibus");
  };

  return (
    <div className="absolute inset-0 z-[2000] flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-lg font-extrabold text-zinc-950">Novo ponto</h3>
            <p className="mt-0.5 flex items-center gap-1 font-mono text-xs text-zinc-500">
              <MapPin className="h-3.5 w-3.5" />
              {lat.toFixed(5)}, {lng.toFixed(5)}
            </p>
          </div>
          <button
            type="button"
            onClick={aoFechar}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-zinc-100 text-zinc-500 active:bg-zinc-200"
            aria-label="Fechar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2">
          {OPCOES.map((opcao) => {
            const Icone = opcao.icone;
            const selecionado = tipo === opcao.tipo;
            return (
              <button
                key={opcao.tipo}
                type="button"
                onClick={() => {
                  setTipo(opcao.tipo);
                  setErro(null);
                }}
                className={`flex flex-col items-start gap-1.5 rounded-2xl border-2 p-3 text-left transition-colors ${
                  selecionado ? "border-blue-600 bg-blue-50" : "border-zinc-200 bg-white"
                }`}
              >
                <span
                  className="flex h-9 w-9 items-center justify-center rounded-xl text-white"
                  style={{ backgroundColor: opcao.cor }}
                >
                  <Icone className="h-5 w-5" />
                </span>
                <span className="text-sm font-bold text-zinc-900">{opcao.rotulo}</span>
                <span className="text-[11px] font-medium text-zinc-500">{opcao.descricao}</span>
              </button>
            );
          })}
        </div>

        <label className="mb-1 mt-4 block text-xs font-bold uppercase tracking-wide text-zinc-500">
          Nome
        </label>
        <input
          type="text"
          maxLength={40}
          placeholder={tipo === "ponto_encontro" ? "Ponto de Encontro / Ônibus" : "Ex: Padaria do Romeiro"}
          value={nome}
          onChange={(e) => {
            setNome(e.target.value);
            setErro(null);
          }}
          className="w-full rounded-2xl border-2 border-zinc-300 bg-white px-4 py-3 text-base font-semibold text-zinc-900 outline-none focus:border-blue-600"
          autoFocus
        />
        {erro && <p className="mt-2 text-xs font-semibold text-red-600">{erro}</p>}

        <div className="mt-5 flex gap-2">
          <button
            type="button"
            onClick={aoFechar}
            className="flex-1 rounded-xl border border-zinc-300 bg-white py-3 text-sm font-bold text-zinc-700 active:bg-zinc-50"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={salvar}
            className="flex-1 rounded-xl bg-blue-700 py-3 text-sm font-bold text-white active:scale-95"
          >
            Salvar ponto
          </button>
        </div>
      </div>
    </div>
  );
}
