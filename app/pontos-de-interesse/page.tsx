import type { Metadata } from "next";
import Link from "next/link";
import { CATEGORIAS, POIS } from "@/lib/pois";
import { BASE_URL, slugCategoria, slugPoi } from "@/lib/seo";
import JsonLd from "@/components/JsonLd";
import BotaoVoltar from "@/components/BotaoVoltar";

export const metadata: Metadata = {
  title: "Pontos de interesse em Aparecida - SP",
  description:
    "Lista completa de pontos de interesse em Aparecida - SP: Santuário Nacional, Matriz Basílica, turismo religioso, apoio ao romeiro, saúde, transporte e lazer.",
  alternates: {
    canonical: "/pontos-de-interesse",
  },
  openGraph: {
    title: "Pontos de interesse em Aparecida - SP",
    description:
      "Santuário Nacional, Matriz Basílica e outros pontos de interesse em Aparecida - SP com rota a partir da sua localização.",
    url: "/pontos-de-interesse",
  },
};

const ITEM_LIST_JSON_LD = {
  "@context": "https://schema.org",
  "@type": "ItemList",
  name: "Pontos de interesse em Aparecida - SP",
  itemListElement: POIS.map((poi, index) => ({
    "@type": "ListItem",
    position: index + 1,
    name: poi.nome,
    url: `${BASE_URL}/pontos-de-interesse/${slugPoi(poi)}`,
  })),
};

export default function PaginaPontosDeInteresse() {
  return (
    <main className="min-h-dvh bg-zinc-100">
      <JsonLd dados={ITEM_LIST_JSON_LD} />
      <div className="mx-auto max-w-2xl px-5 py-6">
        <BotaoVoltar />

        <div className="rounded-3xl bg-white p-6 shadow-sm">
          <h1 className="text-2xl font-extrabold text-zinc-900">
            Pontos de interesse em Aparecida - SP
          </h1>
          <p className="mt-2 text-sm leading-6 text-zinc-600">
            Todos os locais mapeados no RomeiroGPS, com rota a partir da sua
            localização. Toque em um ponto para ver detalhes.
          </p>
        </div>

        <div className="mt-5 space-y-5">
          {CATEGORIAS.map((categoria) => {
            const pontos = POIS.filter((p) => p.categoria === categoria.id);
            if (pontos.length === 0) return null;
            return (
              <div key={categoria.id} className="rounded-3xl bg-white p-5 shadow-sm">
                <div className="flex items-center justify-between gap-2">
                  <h2 className="flex items-center gap-2 text-base font-extrabold text-blue-900">
                    <span
                      className="h-3 w-3 rounded-full"
                      style={{ backgroundColor: categoria.cor }}
                    />
                    {categoria.rotulo}
                  </h2>
                  <Link
                    href={`/categorias/${slugCategoria(categoria.id)}`}
                    className="text-xs font-bold text-blue-700"
                  >
                    Ver categoria
                  </Link>
                </div>
                <ul className="mt-3 divide-y divide-zinc-100">
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
              </div>
            );
          })}
        </div>
      </div>
    </main>
  );
}