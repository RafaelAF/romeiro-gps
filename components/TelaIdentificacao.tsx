"use client";

import { useState } from "react";
import Link from "next/link";
import { Info, Shield, ShieldCheck, Smartphone } from "lucide-react";

interface TelaIdentificacaoProps {
  aoConfirmar: (telefone: string) => void;
}

export default function TelaIdentificacao({ aoConfirmar }: TelaIdentificacaoProps) {
  const [telefone, setTelefone] = useState("");
  const [erro, setErro] = useState<string | null>(null);

  const confirmar = () => {
    const digitos = telefone.replace(/\D/g, "");
    if (digitos.length < 8) {
      setErro("Informe um celular válido.");
      return;
    }
    aoConfirmar(digitos);
  };

  return (
    <div className="absolute inset-0 z-[1000] flex h-full w-full flex-col items-center justify-center gap-6 overflow-y-auto bg-zinc-900/70 p-6 backdrop-blur-sm">
      <div className="text-center">
        <p className="text-3xl font-extrabold text-white">RomeiroGPS</p>
        <p className="mt-1 text-sm font-medium text-blue-100">Aparecida - SP</p>
      </div>

      <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-xl">
        <p className="mb-1 text-lg font-extrabold text-zinc-900">Identifique-se</p>
        <p className="mb-4 text-sm font-medium text-zinc-500">
          Entre com seu celular para atuar como líder e gerar o link do ponto de encontro.
        </p>

        <label className="mb-1 block text-xs font-bold uppercase tracking-wide text-zinc-500">
          Celular
        </label>
        <div className="relative">
          <Smartphone className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-zinc-400" />
          <input
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            placeholder="(00) 00000-0000"
            value={telefone}
            onChange={(e) => setTelefone(e.target.value)}
            className="w-full rounded-2xl border-2 border-zinc-300 bg-white py-4 pl-10 pr-4 text-base font-semibold text-zinc-900 outline-none focus:border-blue-600"
          />
        </div>

        {erro && <p className="mt-2 text-sm font-semibold text-red-600">{erro}</p>}

        <button
          type="button"
          onClick={confirmar}
          className="mt-4 flex min-h-14 w-full items-center justify-center gap-2 rounded-2xl bg-blue-700 px-6 py-4 text-lg font-bold text-white active:scale-[.98]"
        >
          <ShieldCheck className="h-6 w-6" />
          Continuar como líder
        </button>

        <p className="mt-4 flex items-start gap-2 text-xs leading-5 text-zinc-500">
          <Info className="mt-0.5 h-4 w-4 shrink-0" />
          Seu número de celular é usado apenas para identificar você como líder e gerar o link de
          compartilhamento do ponto de encontro. Os dados não são usados para outros fins e ficam
          armazenados somente neste dispositivo.
        </p>
      </div>

      <Link
        href="/politica-privacidade"
        className="flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-xs font-bold text-blue-100 backdrop-blur-sm active:bg-white/20"
      >
        <Shield className="h-4 w-4" />
        Política de Privacidade (LGPD)
      </Link>
    </div>
  );
}
