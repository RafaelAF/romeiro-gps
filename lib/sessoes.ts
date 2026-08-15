export interface PosicaoMembro {
  id: string;
  lat: number;
  lng: number;
  ts: number;
  cor: string;
  nome: string;
  bateria: number | null;
  precisao: number;
  status: string;
  statusTs: number;
  online: boolean;
}

type Assinante = (p: PosicaoMembro) => void;

const membros = new Map<string, Map<string, PosicaoMembro>>();
const assinantes = new Map<string, Set<Assinante>>();

// Manter a posição offline por até 15 minutos antes de apagar de vez
const STALE_MS = 15 * 60 * 1000;
const EXPURGO_INTERVALO_MS = 5 * 60 * 1000;

function expurgar(): void {
  const agora = Date.now();
  for (const [sessaoId, mapa] of membros) {
    for (const [id, p] of mapa) {
      if (agora - p.ts > STALE_MS) mapa.delete(id);
    }
    if (mapa.size === 0) {
      membros.delete(sessaoId);
      assinantes.delete(sessaoId);
    }
  }
}

if (typeof setInterval !== "undefined") {
  setInterval(expurgar, EXPURGO_INTERVALO_MS);
}

export function atualizarPosicao(sessaoId: string, posicao: PosicaoMembro): void {
  if (!membros.has(sessaoId)) membros.set(sessaoId, new Map());
  membros.get(sessaoId)!.set(posicao.id, posicao);
  assinantes.get(sessaoId)?.forEach((cb) => cb(posicao));
}

export function marcarOffline(sessaoId: string, membroId: string): void {
  const mapa = membros.get(sessaoId);
  if (!mapa) return;
  const p = mapa.get(membroId);
  if (!p || !p.online) return;
  
  const atualizada: PosicaoMembro = {
    ...p,
    online: false,
    ts: Date.now(), // Atualiza o timestamp para marcar o momento da desconexão
  };
  mapa.set(membroId, atualizada);
  assinantes.get(sessaoId)?.forEach((cb) => cb(atualizada));
}

export function listarMembros(sessaoId: string): PosicaoMembro[] {
  const mapa = membros.get(sessaoId);
  if (!mapa) return [];
  const agora = Date.now();
  return [...mapa.values()].filter((p) => agora - p.ts <= STALE_MS);
}

export function assinar(sessaoId: string, cb: Assinante): () => void {
  if (!assinantes.has(sessaoId)) assinantes.set(sessaoId, new Set());
  assinantes.get(sessaoId)!.add(cb);
  return () => assinantes.get(sessaoId)?.delete(cb);
}
