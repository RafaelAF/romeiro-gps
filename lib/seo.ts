import { CATEGORIAS, POIS } from "@/lib/pois";
import type { CategoriaPoi, Poi } from "@/lib/types";

export const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://romeirogps.app.br";

export function slugificar(texto: string): string {
  return texto
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[()]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

const SLUG_POR_ID = new Map<number, string>();
for (const poi of POIS) {
  let slug = slugificar(poi.nome);
  if ([...SLUG_POR_ID.values()].includes(slug)) slug = `${slug}-${poi.id}`;
  SLUG_POR_ID.set(poi.id, slug);
}

export function slugPoi(poi: Poi): string {
  return SLUG_POR_ID.get(poi.id) ?? slugificar(poi.nome);
}

export function poiPorSlug(slug: string): Poi | undefined {
  return POIS.find((p) => slugPoi(p) === slug);
}

const SLUGS_CATEGORIA: Record<CategoriaPoi, string> = {
  turismo_religioso: "turismo-religioso",
  saude: "saude",
  apoio_romeiro: "apoio-ao-romeiro",
  utilidade_publica: "servicos-publicos",
  transporte: "transporte",
  lazer: "lazer",
  turismo: "turismo",
  praca_publica: "pracas",
};

const CATEGORIA_POR_SLUG: Record<string, CategoriaPoi> = Object.fromEntries(
  Object.entries(SLUGS_CATEGORIA).map(([id, slug]) => [slug, id as CategoriaPoi])
);

export function slugCategoria(categoria: CategoriaPoi): string {
  return SLUGS_CATEGORIA[categoria];
}

export function categoriaPorSlug(slug: string): CategoriaPoi | undefined {
  return CATEGORIA_POR_SLUG[slug];
}

export function rotuloCategoria(categoria: CategoriaPoi): string {
  return CATEGORIAS.find((c) => c.id === categoria)?.rotulo ?? categoria;
}

const TIPO_JSON_LD: Record<CategoriaPoi, string> = {
  turismo_religioso: "TouristAttraction",
  saude: "Place",
  apoio_romeiro: "Place",
  utilidade_publica: "Place",
  transporte: "Place",
  lazer: "TouristAttraction",
  turismo: "TouristAttraction",
  praca_publica: "TouristAttraction",
};

export function tipoJsonLd(categoria: CategoriaPoi): string {
  return TIPO_JSON_LD[categoria];
}

const DESCRICOES: Record<CategoriaPoi, string> = {
  turismo_religioso: "ponto de turismo religioso",
  saude: "serviço de saúde",
  apoio_romeiro: "ponto de apoio ao romeiro",
  utilidade_publica: "serviço público",
  transporte: "ponto de transporte",
  lazer: "opção de lazer",
  turismo: "atrativo turístico",
  praca_publica: "praça pública",
};

export function descricaoPoi(poi: Poi): string {
  return `${poi.nome} — ${DESCRICOES[poi.categoria]} em Aparecida - SP. Localize no mapa do RomeiroGPS e trace sua rota até lá.`;
}