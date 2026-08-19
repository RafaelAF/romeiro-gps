import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CATEGORIAS, POIS } from "@/lib/pois";
import { BASE_URL, categoriaPorSlug, rotuloCategoria, slugCategoria, slugPoi } from "@/lib/seo";
import JsonLd from "@/components/JsonLd";
import BotaoVoltar from "@/components/BotaoVoltar";

export const dynamicParams = false;

export function generateStaticParams() {
  return CATEGORIAS.map((categoria) => ({ slug: slugCategoria(categoria.id) }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const categoria = categoriaPorSlug(slug);
  if (!categoria) return {};
  const rotulo = rotuloCategoria(categoria);
  return {
    title: `${rotulo} em Aparecida - SP`,
    description: `Pontos de ${rotulo.toLowerCase()} em Aparecida - SP mapeados no RomeiroGPS, com rota a partir da sua localização.`,
    alternates: {
      canonical: `/categorias/${slug}`,
    },
    openGraph: {
      title: `${rotulo} em Aparecida - SP`,
      description: `Pontos de ${rotulo.toLowerCase()} em Aparecida - SP com rota no RomeiroGPS.`,
      url: `/categorias/${slug}`,
    },
  };
}

export default async function PaginaCategoria({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const categoria = categoriaPorSlug(slug);
  if (!categoria) notFound();

  const rotulo = rotuloCategoria(categoria);
  const pontos = POIS.filter((p) => p.categoria === categoria);

  const itemListJsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: `${rotulo} em Aparecida - SP`,
    itemListElement: pontos.map((poi, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: poi.nome,
      url: `${BASE_URL}/pontos-de-interesse/${slugPoi(poi)}`,
    })),
  };

  return (
    <main className="min-h-dvh bg-zinc-100">
      <JsonLd dados={itemListJsonLd} />
      <div className="mx-auto max-w-2xl px-5 py-6">
        <BotaoVoltar />

        <div className="rounded-3xl bg-white p-6 shadow-sm">
          <h1 className="text-2xl font-extrabold text-zinc-900">
            {rotulo} em Aparecida - SP
          </h1>
          <p className="mt-2 text-sm leading-6 text-zinc-600">
            {pontos.length}{" "}
            {pontos.length === 1 ? "ponto mapeado" : "pontos mapeados"} no
            RomeiroGPS nesta categoria.
          </p>
        </div>

        <ul className="mt-5 divide-y divide-zinc-100 rounded-3xl bg-white p-5 shadow-sm">
          {pontos.map((poi) => (
            <li key={poi.id}>
              <Link
                href={`/pontos-de-interesse/${slugPoi(poi)}`}
                className="flex items-center justify-between gap-2 py-2.5 text-sm font-semibold text-zinc-800 active:opacity-70"
              >
                <span>{poi.nome}</span>
                <span className="text-xs font-medium text-zinc-400">
                  Aparecida - SP
                </span>
              </Link>
            </li>
          ))}
        </ul>

        <p className="mt-6 text-center text-xs text-zinc-400">
          <Link href="/pontos-de-interesse" className="underline">
            Todos os pontos de interesse
          </Link>{" "}
          ·{" "}
          <Link href="/" className="underline">
            Voltar ao mapa RomeiroGPS
          </Link>
        </p>
      </div>
    </main>
  );
}