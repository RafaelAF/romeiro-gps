export type CategoriaPoi =
  | "turismo_religioso"
  | "saude"
  | "apoio_romeiro"
  | "utilidade_publica"
  | "transporte"
  | "lazer"
  | "turismo"
  | "praca_publica";

export interface Poi {
  id: number;
  nome: string;
  categoria: CategoriaPoi;
  lat: number;
  lng: number;
}

export type TipoPoi = "hotel" | "restaurante" | "atracao";

export interface PoiDinamico {
  id: string;
  nome: string;
  tipo: TipoPoi;
  lat: number;
  lng: number;
  criadoEm: number;
}

export interface CoordenadaRota {
  lat: number;
  lng: number;
  ts?: number;
  nome?: string;
}

export interface RotaPersonalizada {
  id: string;
  nome: string;
  tipo: "personalizada";
  pontos: CoordenadaRota[];
  criadoEm: number;
}

export interface TrajetoGravado {
  id: string;
  nome: string;
  tipo: "gravada";
  pontos: CoordenadaRota[];
  criadoEm: number;
}

export type Rota = RotaPersonalizada | TrajetoGravado;

export interface Membro {
  id: string;
  nome: string;
  telefone?: string;
  corMarcador: string;
  lat: number;
  lng: number;
  ultimaAtualizacao: string;
}

export interface PontoEncontro {
  lat: number;
  lng: number;
  descricao: string;
  onibusPlaca?: string;
  onibusCor?: string;
  onibusDetalhe?: string;
}

export interface Caravana {
  id: string;
  nomeGrupo: string;
  criadoEm: string;
  expiraEm: string;
  ativa: boolean;
  pontoEncontro?: PontoEncontro;
  membros: Membro[];
}

export interface PayloadGps {
  id: string;
  lat: number;
  lng: number;
  ts: number;
}
