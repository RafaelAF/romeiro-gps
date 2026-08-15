import type { Metadata } from "next";
import Link from "next/link";
import VerApp from "@/components/VerApp";

export const metadata: Metadata = {
  title: "Ponto de encontro",
};

export default async function PaginaVer({
  searchParams,
}: {
  searchParams: Promise<{ lat?: string; lng?: string; rotulo?: string; exp?: string; sessao?: string }>;
}) {
  const params = await searchParams;
  const lat = Number(params.lat);
  const lng = Number(params.lng);

  if (
    !Number.isFinite(lat) ||
    !Number.isFinite(lng) ||
    lat < -90 ||
    lat > 90 ||
    lng < -180 ||
    lng > 180
  ) {
    return (
      <div className="flex h-dvh flex-col items-center justify-center gap-4 bg-zinc-100 p-6 text-center">
        <p className="text-2xl font-extrabold text-blue-900">Link inválido</p>
        <p className="text-sm text-zinc-600">Peça ao líder um novo link de compartilhamento.</p>
        <Link
          href="/"
          className="rounded-2xl bg-blue-700 px-6 py-3 text-base font-bold text-white"
        >
          Abrir RomeiroGPS
        </Link>
      </div>
    );
  }

  return (
    <VerApp
      lat={lat}
      lng={lng}
      rotulo={params.rotulo || "Ponto de Encontro"}
      exp={params.exp}
      sessao={params.sessao}
    />
  );
}

