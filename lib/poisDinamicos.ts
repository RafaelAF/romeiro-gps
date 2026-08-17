import type { PoiDinamico, TipoPoi } from "@/lib/types";

const CHAVE = "romeirogps:pois";
const CANAL = "romeirogps-pois";

export const TIPOS_POI: { id: TipoPoi; rotulo: string; cor: string; letra: string }[] = [
  { id: "hotel", rotulo: "Hotel", cor: "#7c3aed", letra: "H" },
  { id: "restaurante", rotulo: "Restaurante", cor: "#d97706", letra: "R" },
  { id: "atracao", rotulo: "Atração", cor: "#16a34a", letra: "A" },
];

export const TIPO_POR_ID: Record<TipoPoi, (typeof TIPOS_POI)[number]> = Object.fromEntries(
  TIPOS_POI.map((t) => [t.id, t])
) as Record<TipoPoi, (typeof TIPOS_POI)[number]>;

export function lerPois(): PoiDinamico[] {
  try {
    const bruto = localStorage.getItem(CHAVE);
    const lista = bruto ? (JSON.parse(bruto) as PoiDinamico[]) : [];
    return Array.isArray(lista) ? lista : [];
  } catch {
    return [];
  }
}

function salvarPois(lista: PoiDinamico[]): void {
  try {
    localStorage.setItem(CHAVE, JSON.stringify(lista));
  } catch {
    void 0;
  }
  const canal = typeof BroadcastChannel !== "undefined" ? new BroadcastChannel(CANAL) : null;
  canal?.postMessage({ tipo: "pois", lista });
  canal?.close();
}

export function adicionarPoi(dados: Omit<PoiDinamico, "id" | "criadoEm">): PoiDinamico {
  const poi: PoiDinamico = {
    ...dados,
    id: `poi-${Math.random().toString(36).slice(2, 10)}`,
    criadoEm: Date.now(),
  };
  salvarPois([...lerPois(), poi]);
  return poi;
}

export function removerPoi(id: string): void {
  salvarPois(lerPois().filter((p) => p.id !== id));
}

export function assinarPois(aoAtualizar: (lista: PoiDinamico[]) => void): () => void {
  const aoReceber = (evento: MessageEvent) => {
    const msg = evento.data;
    if (msg?.tipo === "pois" && Array.isArray(msg.lista)) aoAtualizar(msg.lista);
  };
  const aoReceberStorage = (evento: StorageEvent) => {
    if (evento.key === CHAVE && evento.newValue) {
      try {
        aoAtualizar(JSON.parse(evento.newValue) as PoiDinamico[]);
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
