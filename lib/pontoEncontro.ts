import type { PontoEncontro } from "@/lib/types";

const CHAVE = "romeirogps:ponto-encontro";
const CANAL = "romeirogps-ponto-encontro";
const CHAVE_TELEFONE = "romeirogps:telefone";

export function lerPontoEncontro(): PontoEncontro | null {
  try {
    const bruto = localStorage.getItem(CHAVE);
    return bruto ? (JSON.parse(bruto) as PontoEncontro) : null;
  } catch {
    return null;
  }
}

export function salvarPontoEncontro(ponto: PontoEncontro | null): void {
  try {
    if (ponto) localStorage.setItem(CHAVE, JSON.stringify(ponto));
    else localStorage.removeItem(CHAVE);
  } catch {
    void 0;
  }
  const canal = typeof BroadcastChannel !== "undefined" ? new BroadcastChannel(CANAL) : null;
  canal?.postMessage({ tipo: "ponto-encontro", ponto });
  canal?.close();
}

export function assinarPontoEncontro(
  aoAtualizar: (ponto: PontoEncontro | null) => void
): () => void {
  const aoReceber = (evento: MessageEvent) => {
    const msg = evento.data;
    if (msg?.tipo === "ponto-encontro") aoAtualizar(msg.ponto ?? null);
  };
  const aoReceberStorage = (evento: StorageEvent) => {
    if (evento.key === CHAVE) {
      aoAtualizar(evento.newValue ? (JSON.parse(evento.newValue) as PontoEncontro) : null);
    }
  };
  let canal: BroadcastChannel | null = null;
  if (typeof BroadcastChannel !== "undefined") {
    canal = new BroadcastChannel(CANAL);
    canal.addEventListener("message", aoReceber);
  }
  window.addEventListener("storage", aoReceberStorage);
  return () => {
    canal?.removeEventListener("message", aoReceber);
    canal?.close();
    window.removeEventListener("storage", aoReceberStorage);
  };
}

export function lerTelefone(): string | null {
  try {
    return localStorage.getItem(CHAVE_TELEFONE);
  } catch {
    return null;
  }
}

export function salvarTelefone(telefone: string): void {
  try {
    if (telefone) localStorage.setItem(CHAVE_TELEFONE, telefone);
    else localStorage.removeItem(CHAVE_TELEFONE);
  } catch {
    void 0;
  }
}

export function idLider(telefone: string): string {
  let hash = 5381;
  for (let i = 0; i < telefone.length; i++) {
    hash = ((hash << 5) + hash) ^ telefone.charCodeAt(i);
  }
  return `lid-${(hash >>> 0).toString(36)}`;
}

export const VALIDADE_LINK_MS = 48 * 60 * 60 * 1000;

export function gerarLinkCompartilhamento(ponto: PontoEncontro, telefone: string): string {
  const origem = typeof window !== "undefined" ? window.location.origin : "";
  const sessao = Math.random().toString(36).slice(2, 10);
  const params = new URLSearchParams({
    lider: idLider(telefone),
    lat: ponto.lat.toFixed(6),
    lng: ponto.lng.toFixed(6),
    rotulo: ponto.descricao,
    exp: String(Date.now() + VALIDADE_LINK_MS),
    sessao,
  });
  return `${origem}/ver?${params.toString()}`;
}

