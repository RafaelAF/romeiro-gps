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
