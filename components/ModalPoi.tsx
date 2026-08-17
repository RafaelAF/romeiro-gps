"use client";

import { Compass, ExternalLink, Loader2, MapPin, X } from "lucide-react";

export interface PontoModalInfo {
  id: string;
  nome: string;
  rotulo: string;
  lat: number;
  lng: number;
}

export interface ModalPoiProps {
  ponto: PontoModalInfo;
  carregandoRota: boolean;
  aoNavegar: () => void;
  aoAbrirExterno: () => void;
  aoFechar: () => void;
}

export default function ModalPoi({
  ponto,
  carregandoRota,
  aoNavegar,
  aoAbrirExterno,
  aoFechar,
}: ModalPoiProps) {
  return (
    <div className="absolute inset-0 z-[2000] flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
      <div className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-xs font-bold uppercase tracking-wide text-blue-700">{ponto.rotulo}</p>
            <h3 className="truncate text-lg font-extrabold text-zinc-950">{ponto.nome}</h3>
            <p className="mt-0.5 flex items-center gap-1 font-mono text-xs text-zinc-500">
              <MapPin className="h-3.5 w-3.5 shrink-0" />
              {ponto.lat.toFixed(5)}, {ponto.lng.toFixed(5)}
            </p>
          </div>
          <button
            type="button"
            onClick={aoFechar}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-zinc-100 text-zinc-500 active:bg-zinc-200"
            aria-label="Fechar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-5 flex flex-col gap-2">
          <button
            type="button"
            onClick={aoNavegar}
            disabled={carregandoRota}
            className="flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-blue-700 px-4 py-3 text-base font-bold text-white active:scale-[.98] disabled:opacity-60"
          >
            {carregandoRota ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                Traçando rota...
              </>
            ) : (
              <>
                <Compass className="h-5 w-5" />
                Traçar rota no mapa
              </>
            )}
          </button>
          <button
            type="button"
            onClick={aoAbrirExterno}
            className="flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl border-2 border-zinc-300 bg-white px-4 py-3 text-base font-bold text-zinc-800 active:scale-[.98]"
          >
            <ExternalLink className="h-5 w-5" />
            Abrir no Google Maps
          </button>
        </div>
      </div>
    </div>
  );
}