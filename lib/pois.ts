import type { CategoriaPoi, Poi } from "@/lib/types";
import geoJson from "@/data/pois.json";

interface Feature {
  type: string;
  geometry: { type: string; coordinates: [number, number] };
  properties: { id: number; nome: string; categoria: CategoriaPoi };
}

const features = (geoJson as { type: string; features: Feature[] }).features;

export const POIS: Poi[] = features.map((f) => ({
  id: f.properties.id,
  nome: f.properties.nome,
  categoria: f.properties.categoria,
  lat: f.geometry.coordinates[1],
  lng: f.geometry.coordinates[0],
}));

export const CATEGORIAS: { id: CategoriaPoi; rotulo: string; cor: string }[] = [
  { id: "turismo_religioso", rotulo: "Religioso", cor: "#7c3aed" },
  { id: "saude", rotulo: "Saúde", cor: "#dc2626" },
  { id: "apoio_romeiro", rotulo: "Apoio ao Romeiro", cor: "#ea580c" },
  { id: "utilidade_publica", rotulo: "Serviços Públicos", cor: "#475569" },
  { id: "transporte", rotulo: "Transporte", cor: "#0284c7" },
  { id: "lazer", rotulo: "Lazer", cor: "#d97706" },
  { id: "turismo", rotulo: "Turismo", cor: "#059669" },
  { id: "praca_publica", rotulo: "Praças", cor: "#65a30d" },
];

export const CATEGORIA_POR_ID: Record<CategoriaPoi, (typeof CATEGORIAS)[number]> =
  Object.fromEntries(CATEGORIAS.map((c) => [c.id, c])) as Record<
    CategoriaPoi,
    (typeof CATEGORIAS)[number]
  >;
