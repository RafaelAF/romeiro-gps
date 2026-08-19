import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { POIS } from "@/lib/pois";
import {
  BASE_URL,
  descricaoPoi,
  poiPorSlug,
  rotuloCategoria,
  slugPoi,
  tipoJsonLd,
} from "@/lib/seo";
import type { Poi } from "@/lib/types";
import JsonLd from "@/components/JsonLd";
import BotaoVoltar from "@/components/BotaoVoltar";

export const dynamicParams = false;

export function generateStaticParams() {
  return POIS.map((poi) => ({ slug: slugPoi(poi) }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const poi = poiPorSlug(slug);
  if (!poi) return {};
  return {
    title: poi.nome,
    description: descricaoPoi(poi),
    alternates: {
      canonical: `/pontos-de-interesse/${slug}`,
    },
    openGraph: {
      title: `${poi.nome} em Aparecida - SP`,
      description: descricaoPoi(poi),
      url: `/pontos-de-interesse/${slug}`,
    },
  };
}

function jsonLdPoi(poi: Poi): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": tipoJsonLd(poi.categoria),
    name: poi.nome,
    description: descricaoPoi(poi),
    url: `${BASE_URL}/pontos-de-interesse/${slugPoi(poi)}`,
    image: `${BASE_URL}/icon.svg`,
    address: {
      "@type": "PostalAddress",
      addressLocality: "Aparecida",
      addressRegion: "SP",
      addressCountry: "BR",
    },
    geo: {
      "@type": "GeoCoordinates",
      latitude: poi.lat,
      longitude: poi.lng,
    },
  };
}

export default async function PaginaPonto({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const poi = poiPorSlug(slug);
  if (!poi) notFound();

  return (
    <main className="min-h-dvh bg-zinc-100">
      <JsonLd dados={jsonLdPoi(poi)} />
      <div className="mx-auto max-w-2xl px-5 py-6">
        <BotaoVoltar />

        <div className="rounded-3xl bg-white p-6 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-wide text-blue-700">
            {rotuloCategoria(poi.categoria)} · Aparecida - SP
          </p>
          <h1 className="mt-1 text-2xl font-extrabold text-zinc-900">{poi.nome}</h1>
          <p className="mt-3 text-sm leading-6 text-zinc-600">{descricaoPoi(poi)}</p>
          <p className="mt-3 text-sm font-medium text-zinc-500">
            Coordenadas: {poi.lat.toFixed(5)}, {poi.lng.toFixed(5)}
          </p>
          <p className="mt-4">
            <Link
              href="/pontos-de-interesse"
              className="inline-flex items-center rounded-2xl bg-blue-700 px-5 py-3 text-sm font-bold text-white active:scale-[.98]"
            >
              Ver todos os pontos de interesse
            </Link>
          </p>
        </div>

        <p className="mt-6 text-center text-xs text-zinc-400">
          <Link href="/" className="underline">
            Voltar ao mapa RomeiroGPS
          </Link>{" "}
          ·{" "}
          <Link href="/politica-privacidade" className="underline">
            Política de Privacidade
          </Link>
        </p>
      </div>
    </main>
  );
}