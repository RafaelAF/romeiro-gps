import Link from "next/link";
import { CATEGORIAS, POIS } from "@/lib/pois";
import { BASE_URL, slugCategoria, slugPoi } from "@/lib/seo";
import JsonLd from "@/components/JsonLd";

const FAQ = [
  {
    pergunta: "Como chegar ao Santuário Nacional em Aparecida?",
    resposta:
      "O Santuário Nacional fica na Av. Dr. Júlio Prestes de Albuquerque, em Aparecida - SP. No mapa do RomeiroGPS, toque no ponto do Santuário e use a opção de rota para chegar a pé, de carro ou de ônibus a partir da sua localização.",
  },
  {
    pergunta: "O que é o ponto de encontro por link?",
    resposta:
      "O líder marca um ponto de encontro no mapa e gera um link temporário de compartilhamento. Quem recebe o link abre a visão do seguidor com o ponto fixo no mapa, válido por até 24 horas. O telefone do líder nunca é exibido.",
  },
  {
    pergunta: "Quais pontos de interesse o RomeiroGPS mostra em Aparecida?",
    resposta:
      "O app reúne pontos de turismo religioso (como o Santuário Nacional, a Matriz Basílica e o Morro do Cruzeiro), apoio ao romeiro, saúde, transporte, lazer, praças e serviços públicos, todos com rota até o local.",
  },
  {
    pergunta: "Preciso criar conta para usar o RomeiroGPS?",
    resposta:
      "Não. O líder apenas se identifica com o número de celular, que é usado exclusivamente para gerar o identificador do link de compartilhamento. Nenhum dado é enviado a servidores: tudo fica salvo no seu dispositivo.",
  },
];

const FAQ_JSON_LD = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: FAQ.map((item) => ({
    "@type": "Question",
    name: item.pergunta,
    acceptedAnswer: { "@type": "Answer", text: item.resposta },
  })),
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

const WEB_SITE_JSON_LD = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "RomeiroGPS",
  url: BASE_URL,
  inLanguage: "pt-BR",
  description:
    "Mapa de pontos de interesse, rotas e caravanas em tempo real em Aparecida - SP.",
};

export default function SeoHome() {
  return (
    <section className="bg-zinc-100">
      <JsonLd dados={WEB_SITE_JSON_LD} />
      <JsonLd dados={ITEM_LIST_JSON_LD} />
      <JsonLd dados={FAQ_JSON_LD} />

      <div className="mx-auto max-w-2xl px-5 py-10">
        <div className="rounded-3xl bg-white p-6 shadow-sm">
          <h1 className="text-2xl font-extrabold text-zinc-900">
            Pontos de interesse em Aparecida - SP
          </h1>
          <p className="mt-2 text-sm leading-6 text-zinc-600">
            Descubra o Santuário Nacional, a Matriz Basílica, pontos de turismo
            religioso, apoio ao romeiro, saúde, transporte e lazer. Toque no mapa
            para ver cada local e traçar sua rota.
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

        <div className="mt-5 rounded-3xl bg-white p-5 shadow-sm">
          <h2 className="text-base font-extrabold text-blue-900">
            Perguntas frequentes
          </h2>
          <div className="mt-2 space-y-2">
            {FAQ.map((item) => (
              <details
                key={item.pergunta}
                className="rounded-2xl border border-zinc-200 px-4 py-3"
              >
                <summary className="cursor-pointer text-sm font-bold text-zinc-800">
                  {item.pergunta}
                </summary>
                <p className="mt-2 text-sm leading-6 text-zinc-600">
                  {item.resposta}
                </p>
              </details>
            ))}
          </div>
        </div>

        <p className="mt-6 text-center text-xs text-zinc-400">
          {POIS.length} pontos mapeados em Aparecida - SP ·{" "}
          <Link href="/politica-privacidade" className="underline">
            Política de Privacidade
          </Link>
        </p>
      </div>
    </section>
  );
}