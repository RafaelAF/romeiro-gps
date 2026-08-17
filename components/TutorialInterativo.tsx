"use client";

import { useCallback, useEffect, useState } from "react";
import { ChevronRight, X } from "lucide-react";

export interface PassoTutorial {
  seletor?: string;
  obterAlvo?: () => HTMLElement | null;
  titulo: string;
  texto: string;
  posicao?: "auto" | "acima" | "abaixo" | "esquerda" | "direita";
}

interface Retangulo {
  top: number;
  left: number;
  width: number;
  height: number;
}

export default function TutorialInterativo({
  passos,
  aoSair,
}: {
  passos: PassoTutorial[];
  aoSair: () => void;
}) {
  const localizarAlvo = useCallback((passo: PassoTutorial): HTMLElement | null => {
    if (passo.obterAlvo) return passo.obterAlvo();
    if (passo.seletor) return document.querySelector<HTMLElement>(passo.seletor);
    return null;
  }, []);

  const proximoValido = useCallback(
    (inicio: number) => {
      for (let i = inicio; i < passos.length; i++) {
        if (localizarAlvo(passos[i])) return i;
      }
      return -1;
    },
    [passos, localizarAlvo],
  );

  const [indice, setIndice] = useState<number>(() => proximoValido(0));
  const [, forcarRender] = useState(0);

  useEffect(() => {
    const aoRedimensionar = () => forcarRender((t) => t + 1);
    window.addEventListener("resize", aoRedimensionar);
    window.addEventListener("scroll", aoRedimensionar, true);
    return () => {
      window.removeEventListener("resize", aoRedimensionar);
      window.removeEventListener("scroll", aoRedimensionar, true);
    };
  }, []);

  const passo = indice >= 0 ? passos[indice] : undefined;
  const alvo = passo ? localizarAlvo(passo) : null;

  const botaoCancelar = (
    <button
      type="button"
      onClick={aoSair}
      className="fixed left-3 top-3 z-[2600] flex items-center gap-2 rounded-full bg-zinc-900/95 px-4 py-2.5 text-sm font-bold text-white shadow-lg active:scale-95"
    >
      <X className="h-4 w-4" />
      Cancelar tutorial
    </button>
  );

  if (!passo || !alvo) {
    return <>{botaoCancelar}</>;
  }

  const r = alvo.getBoundingClientRect();
  const ret: Retangulo = { top: r.top, left: r.left, width: r.width, height: r.height };
  const ultimo = proximoValido(indice + 1) === -1;

  const avancar = () => {
    const p = proximoValido(indice + 1);
    if (p === -1) aoSair();
    else setIndice(p);
  };

  const popupW = 270;
  const margem = 12;
  let x: number;
  let y: number;
  let alinharCentroY = false;

  if (passo.posicao === "esquerda" || passo.posicao === "direita") {
    alinharCentroY = true;
    y = ret.top + ret.height / 2;
    x =
      passo.posicao === "esquerda"
        ? ret.left - popupW - margem
        : ret.left + ret.width + margem;
    x = Math.max(margem, Math.min(x, window.innerWidth - popupW - margem));
    y = Math.min(Math.max(y, 90), window.innerHeight - 90);
  } else {
    const abaixo =
      passo.posicao === "abaixo" || (passo.posicao !== "acima" && ret.top < window.innerHeight / 2);
    x = ret.left + ret.width / 2 - popupW / 2;
    y = abaixo ? ret.top + ret.height + margem : ret.top - margem;
    x = Math.max(margem, Math.min(x, window.innerWidth - popupW - margem));
    if (y < 0) y = 0;
    if (y > window.innerHeight - 150) y = window.innerHeight - 150;
  }

  return (
    <div className="fixed inset-0 z-[2500]">
      <div className="absolute inset-0" style={{ pointerEvents: "none" }}>
        <div
          style={{
            position: "absolute",
            top: ret.top,
            left: ret.left,
            width: ret.width,
            height: ret.height,
            borderRadius: 14,
            boxShadow: "0 0 0 9999px rgba(0,0,0,0.55)",
          }}
        />
      </div>

      {botaoCancelar}

      <div
        className="fixed z-[2600] rounded-2xl border border-zinc-200 bg-white p-4 shadow-2xl"
        style={{
          left: x,
          top: y,
          width: popupW,
          transform: alinharCentroY ? "translateY(-50%)" : undefined,
        }}
      >
        <p className="text-[10px] font-extrabold uppercase tracking-wider text-blue-700">
          Passo {indice + 1} de {passos.length}
        </p>
        <h3 className="mt-0.5 text-base font-extrabold text-zinc-900">{passo.titulo}</h3>
        <p className="mt-1 text-sm leading-5 text-zinc-600">{passo.texto}</p>
        <div className="mt-3 flex items-center gap-2">
          {!ultimo && (
            <button
              type="button"
              onClick={aoSair}
              className="rounded-xl border border-zinc-300 bg-white px-3 py-2 text-xs font-bold text-zinc-600 active:bg-zinc-50"
            >
              Pular
            </button>
          )}
          <button
            type="button"
            onClick={avancar}
            className={`ml-auto flex items-center gap-1 rounded-xl px-4 py-2 text-sm font-bold text-white active:scale-95 ${
              ultimo ? "bg-emerald-700" : "bg-blue-700"
            }`}
          >
            {ultimo ? "Concluir" : "Próximo"}
            {!ultimo && <ChevronRight className="h-4 w-4" />}
          </button>
        </div>
      </div>
    </div>
  );
}