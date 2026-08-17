import type { CoordenadaRota, Rota, RotaPersonalizada, TrajetoGravado } from "@/lib/types";
import { haversineKm } from "@/lib/utils";

const CHAVE_ROTAS = "romeirogps:rotas";
const CHAVE_ATIVA = "romeirogps:rota-ativa";
const CANAL = "romeirogps-rotas";

export function lerRotas(): Rota[] {
  try {
    const bruto = localStorage.getItem(CHAVE_ROTAS);
    const lista = bruto ? (JSON.parse(bruto) as Rota[]) : [];
    return Array.isArray(lista) ? lista : [];
  } catch {
    return [];
  }
}

function salvarRotas(lista: Rota[]): void {
  try {
    localStorage.setItem(CHAVE_ROTAS, JSON.stringify(lista));
  } catch {
    void 0;
  }
  const canal = typeof BroadcastChannel !== "undefined" ? new BroadcastChannel(CANAL) : null;
  canal?.postMessage({ tipo: "rotas", lista });
  canal?.close();
}

export function assinarRotas(aoAtualizar: (lista: Rota[]) => void): () => void {
  const aoReceber = (evento: MessageEvent) => {
    const msg = evento.data;
    if (msg?.tipo === "rotas" && Array.isArray(msg.lista)) aoAtualizar(msg.lista);
  };
  const aoReceberStorage = (evento: StorageEvent) => {
    if (evento.key === CHAVE_ROTAS && evento.newValue) {
      try {
        aoAtualizar(JSON.parse(evento.newValue) as Rota[]);
      } catch {
        void 0;
      }
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

export function salvarRota(rota: Rota): void {
  const atual = lerRotas();
  const semAntiga = atual.filter((r) => r.id !== rota.id);
  salvarRotas([...semAntiga, rota]);
}

export function criarRota(dados: Omit<RotaPersonalizada, "id" | "tipo" | "criadoEm">): Rota {
  const rota: RotaPersonalizada = {
    ...dados,
    id: `rota-${Math.random().toString(36).slice(2, 10)}`,
    tipo: "personalizada",
    criadoEm: Date.now(),
  };
  salvarRota(rota);
  return rota;
}

export function criarTrajeto(dados: Omit<TrajetoGravado, "id" | "tipo" | "criadoEm">): Rota {
  const rota: TrajetoGravado = {
    ...dados,
    id: `traj-${Math.random().toString(36).slice(2, 10)}`,
    tipo: "gravada",
    criadoEm: Date.now(),
  };
  salvarRota(rota);
  return rota;
}

export function removerRota(id: string): void {
  salvarRotas(lerRotas().filter((r) => r.id !== id));
  if (lerRotaAtivaId() === id) definirRotaAtiva(null);
}

export function lerRotaAtivaId(): string | null {
  try {
    return localStorage.getItem(CHAVE_ATIVA);
  } catch {
    return null;
  }
}

export function definirRotaAtiva(id: string | null): void {
  try {
    if (id) localStorage.setItem(CHAVE_ATIVA, id);
    else localStorage.removeItem(CHAVE_ATIVA);
  } catch {
    void 0;
  }
}

export function obterRotaAtiva(lista: Rota[], idAtiva: string | null): Rota | null {
  if (!idAtiva) return null;
  return lista.find((r) => r.id === idAtiva) ?? null;
}

export function decodificarPolilinha(encoded: string): [number, number][] {
  const pontos: [number, number][] = [];
  let idx = 0;
  let lat = 0;
  let lng = 0;
  while (idx < encoded.length) {
    let result = 0;
    let shift = 0;
    let b: number;
    do {
      b = encoded.charCodeAt(idx++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    const dLat = result & 1 ? ~(result >> 1) : result >> 1;
    lat += dLat;

    result = 0;
    shift = 0;
    do {
      b = encoded.charCodeAt(idx++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    const dLng = result & 1 ? ~(result >> 1) : result >> 1;
    lng += dLng;

    pontos.push([lat / 1e5, lng / 1e5]);
  }
  return pontos;
}

export async function tracarRotaOsm(pontos: CoordenadaRota[]): Promise<[number, number][] | null> {
  if (pontos.length < 2) return null;
  const coords = pontos.map((p) => `${p.lng.toFixed(6)},${p.lat.toFixed(6)}`).join(";");
  const url = `https://router.project-osrm.org/route/v1/driving/${coords}?overview=full&geometries=polyline`;
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const dados = await res.json();
    const geometria = dados?.routes?.[0]?.geometry as string | undefined;
    if (!geometria) return null;
    return decodificarPolilinha(geometria);
  } catch {
    return null;
  }
}

export function pontosRotaParaLatLng(rota: Rota): [number, number][] {
  return rota.pontos.map((p) => [p.lat, p.lng]);
}

export function distanciaParaPolilinhaKm(
  ponto: { lat: number; lng: number },
  coords: CoordenadaRota[]
): number {
  if (!coords || coords.length === 0) return Infinity;
  if (coords.length === 1) return haversineKm(ponto, coords[0]);
  let min = Infinity;
  for (let i = 0; i < coords.length - 1; i += 1) {
    min = Math.min(min, distanciaPontoSegmentoKm(ponto, coords[i], coords[i + 1]));
  }
  return min;
}

function distanciaPontoSegmentoKm(
  p: { lat: number; lng: number },
  a: CoordenadaRota,
  b: CoordenadaRota
): number {
  const raio = 6371;
  const cosY = Math.cos(p.lat * (Math.PI / 180)) || 1e-9;
  const px = p.lng * cosY;
  const py = p.lat;
  const ax = a.lng * cosY;
  const ay = a.lat;
  const bx = b.lng * cosY;
  const by = b.lat;
  const dx = bx - ax;
  const dy = by - ay;
  let t = 0;
  if (dx !== 0 || dy !== 0) {
    t = ((px - ax) * dx + (py - ay) * dy) / (dx * dx + dy * dy);
  }
  t = Math.max(0, Math.min(1, t));
  const cx = ax + t * dx;
  const cy = ay + t * dy;
  const dLat = (cy - py) * (Math.PI / 180);
  const dLng = ((cx - px) / cosY) * (Math.PI / 180);
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(cy * (Math.PI / 180)) *
      Math.cos(py * (Math.PI / 180)) *
      Math.sin(dLng / 2) ** 2;
  return 2 * raio * Math.asin(Math.sqrt(s));
}
