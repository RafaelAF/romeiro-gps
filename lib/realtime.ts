import type { Caravana, Membro, PayloadGps, PontoEncontro } from "@/lib/types";

export interface DadosCriarCaravana {
  nomeGrupo: string;
  expiraEm: string;
  lider: Membro;
}

export interface RealtimeClient {
  criarCaravana(dados: DadosCriarCaravana): Promise<Caravana>;
  entrarCaravana(caravanaId: string, membro: Membro): Promise<Caravana>;
  atualizarPosicao(caravanaId: string, payload: PayloadGps): Promise<void>;
  definirPontoEncontro(caravanaId: string, ponto: PontoEncontro): Promise<void>;
  assinarCaravana(caravanaId: string, aoAtualizar: (caravana: Caravana) => void): () => void;
  obterCaravana(caravanaId: string): Promise<Caravana | null>;
}

const CANAL = "romeirogps-realtime";
const PREFIXO_CHAVE = "romeirogps:caravana:";

const chave = (id: string) => `${PREFIXO_CHAVE}${id}`;

const assinantesLocais = new Map<string, Set<(c: Caravana) => void>>();

function notificarLocais(c: Caravana): void {
  const lista = assinantesLocais.get(c.id);
  if (!lista) return;
  lista.forEach((fn) => fn(c));
}

function expurgar(c: Caravana): Caravana {
  const expirou = Date.now() >= new Date(c.expiraEm).getTime();
  if (!expirou || !c.ativa) return c;
  return { ...c, ativa: false, membros: [] };
}

let canal: BroadcastChannel | null = null;

function obterCanal(): BroadcastChannel | null {
  if (typeof BroadcastChannel === "undefined") return null;
  if (!canal) canal = new BroadcastChannel(CANAL);
  return canal;
}

function ler(id: string): Caravana | null {
  try {
    const bruto = localStorage.getItem(chave(id));
    if (!bruto) return null;
    return expurgar(JSON.parse(bruto) as Caravana);
  } catch {
    return null;
  }
}

function salvar(c: Caravana): Caravana {
  const limpa = expurgar(c);
  try {
    localStorage.setItem(chave(limpa.id), JSON.stringify(limpa));
  } catch {
    void 0;
  }
  obterCanal()?.postMessage({ tipo: "caravana", caravana: limpa });
  notificarLocais(limpa);
  return limpa;
}

function expurgarTodas(): void {
  for (let i = 0; i < localStorage.length; i += 1) {
    const chaveAtual = localStorage.key(i);
    if (chaveAtual && chaveAtual.startsWith(PREFIXO_CHAVE)) {
      const c = ler(chaveAtual.slice(PREFIXO_CHAVE.length));
      if (c && !c.ativa) localStorage.setItem(chaveAtual, JSON.stringify(c));
    }
  }
}

class LocalRealtimeClient implements RealtimeClient {
  constructor() {
    expurgarTodas();
    obterCanal();
  }

  async criarCaravana(dados: DadosCriarCaravana): Promise<Caravana> {
    const caravana: Caravana = {
      id: `car-${Math.random().toString(36).slice(2, 8)}`,
      nomeGrupo: dados.nomeGrupo,
      criadoEm: new Date().toISOString(),
      expiraEm: dados.expiraEm,
      ativa: true,
      membros: [dados.lider],
    };
    return salvar(caravana);
  }

  async entrarCaravana(caravanaId: string, membro: Membro): Promise<Caravana> {
    const atual = ler(caravanaId);
    if (!atual) throw new Error("CARAVANA_NAO_ENCONTRADA");
    const jaExiste = atual.membros.some((m) => m.id === membro.id);
    const nova: Caravana = {
      ...atual,
      membros: jaExiste
        ? atual.membros.map((m) =>
            m.id === membro.id
              ? { ...membro, lat: m.lat, lng: m.lng, ultimaAtualizacao: m.ultimaAtualizacao }
              : m
          )
        : [...atual.membros, membro],
    };
    return salvar(nova);
  }

  async atualizarPosicao(caravanaId: string, payload: PayloadGps): Promise<void> {
    const atual = ler(caravanaId);
    if (!atual || !atual.ativa) return;
    const nova: Caravana = {
      ...atual,
      membros: atual.membros.map((m) =>
        m.id === payload.id
          ? {
              ...m,
              lat: payload.lat,
              lng: payload.lng,
              ultimaAtualizacao: new Date(payload.ts).toISOString(),
            }
          : m
      ),
    };
    salvar(nova);
  }

  async definirPontoEncontro(caravanaId: string, ponto: PontoEncontro): Promise<void> {
    const atual = ler(caravanaId);
    if (!atual || !atual.ativa) return;
    salvar({ ...atual, pontoEncontro: ponto });
  }

  assinarCaravana(caravanaId: string, aoAtualizar: (c: Caravana) => void): () => void {
    const aoReceberCanal = (evento: MessageEvent) => {
      const msg = evento.data;
      if (msg?.tipo === "caravana" && msg.caravana?.id === caravanaId) {
        aoAtualizar(expurgar(msg.caravana as Caravana));
      }
    };
    const aoReceberStorage = (evento: StorageEvent) => {
      if (evento.key === chave(caravanaId) && evento.newValue) {
        aoAtualizar(expurgar(JSON.parse(evento.newValue) as Caravana));
      }
    };
    obterCanal()?.addEventListener("message", aoReceberCanal);
    window.addEventListener("storage", aoReceberStorage);
    if (!assinantesLocais.has(caravanaId)) {
      assinantesLocais.set(caravanaId, new Set());
    }
    assinantesLocais.get(caravanaId)!.add(aoAtualizar);
    const intervalo = window.setInterval(() => {
      const atual = ler(caravanaId);
      if (atual && !atual.ativa) aoAtualizar(atual);
    }, 30_000);
    return () => {
      obterCanal()?.removeEventListener("message", aoReceberCanal);
      window.removeEventListener("storage", aoReceberStorage);
      assinantesLocais.get(caravanaId)?.delete(aoAtualizar);
      window.clearInterval(intervalo);
    };
  }

  async obterCaravana(caravanaId: string): Promise<Caravana | null> {
    return ler(caravanaId);
  }
}

let instancia: RealtimeClient | null = null;

export function getRealtimeClient(): RealtimeClient {
  if (!instancia) instancia = new LocalRealtimeClient();
  return instancia;
}
