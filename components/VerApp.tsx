"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";

const VerMapa = dynamic(() => import("@/components/VerMapa"), { ssr: false });

export interface VerAppProps {
  lat: number;
  lng: number;
  rotulo: string;
  exp?: string;
  sessao?: string;
}

export default function VerApp({ lat, lng, rotulo, exp, sessao }: VerAppProps) {
  const [expirado] = useState(() => {
    const expiraEm = Number(exp);
    return !Number.isFinite(expiraEm) || Date.now() > expiraEm;
  });

  if (expirado) {
    return (
      <div className="flex h-dvh flex-col items-center justify-center gap-4 bg-zinc-100 p-6 text-center">
        <p className="text-2xl font-extrabold text-blue-900">Link expirado</p>
        <p className="text-sm text-zinc-600">
          Este link é válido por 48 horas após ser compartilhado. Peça ao líder um novo link.
        </p>
        <Link
          href="/"
          className="rounded-2xl bg-blue-700 px-6 py-3 text-base font-bold text-white"
        >
          Abrir RomeiroGPS
        </Link>
      </div>
    );
  }

  return <VerMapa lat={lat} lng={lng} rotulo={rotulo} sessao={sessao} />;
}

