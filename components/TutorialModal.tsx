"use client";

import { Compass, Flag, GraduationCap, MapPin, Route, Share2, X } from "lucide-react";

export interface TutorialModalProps {
  aoFechar: () => void;
}

const PASSOS = [
  {
    icone: MapPin,
    titulo: "Criar pontos",
    texto:
      "Segure o mapa para criar um ponto. Escolha o tipo (ponto de encontro, hotel, restaurante ou atração) e dê um nome. O ponto fica salvo neste dispositivo.",
  },
  {
    icone: Compass,
    titulo: "Navegar até um ponto",
    texto:
      "Toque em qualquer ponto no mapa para abrir o modal e traçar a rota direto no mapa, sem precisar sair do app. Você também pode abrir no Google Maps.",
  },
  {
    icone: Route,
    titulo: "Rota personalizada",
    texto:
      "No painel inferior, em Rotas, crie uma rota com os pontos e a ordem de visitação que você definir. Toque no mapa para adicionar cada parada.",
  },
  {
    icone: GraduationCap,
    titulo: "Gravar trajeto",
    texto:
      "Perfeito para lugares sem sinal de internet ou ambientes internos: ative a gravação do trajeto e ande. O app captura os pontos da sua caminhada automaticamente.",
  },
  {
    icone: Flag,
    titulo: "Ponto de encontro",
    texto:
      "O ponto de encontro é único: ao marcar um novo, o anterior é substituído. Compartilhe o link do ponto com os romeiros.",
  },
  {
    icone: Share2,
    titulo: "Compartilhar",
    texto:
      "O link gerado é temporário e vale por 24 horas. Quem abrir o link vê o ponto de encontro e pode compartilhar a própria localização com você.",
  },
];

export default function TutorialModal({ aoFechar }: TutorialModalProps) {
  return (
    <div className="absolute inset-0 z-[2000] flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
      <div className="flex max-h-[85dvh] w-full max-w-md flex-col rounded-3xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-zinc-100 px-6 py-4">
          <h3 className="text-lg font-extrabold text-zinc-950">Tutorial de funcionalidades</h3>
          <button
            type="button"
            onClick={aoFechar}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-zinc-100 text-zinc-500 active:bg-zinc-200"
            aria-label="Fechar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 space-y-3 overflow-y-auto px-6 py-4">
          {PASSOS.map((passo) => {
            const Icone = passo.icone;
            return (
              <div key={passo.titulo} className="flex gap-3 rounded-2xl border border-zinc-200 bg-zinc-50 p-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-700 text-white">
                  <Icone className="h-5 w-5" />
                </span>
                <div>
                  <p className="text-sm font-extrabold text-zinc-900">{passo.titulo}</p>
                  <p className="mt-0.5 text-xs leading-5 text-zinc-600">{passo.texto}</p>
                </div>
              </div>
            );
          })}
        </div>

        <div className="px-6 py-4">
          <button
            type="button"
            onClick={aoFechar}
            className="w-full rounded-2xl bg-blue-700 py-3 text-base font-bold text-white active:scale-[.98]"
          >
            Entendi
          </button>
        </div>
      </div>
    </div>
  );
}