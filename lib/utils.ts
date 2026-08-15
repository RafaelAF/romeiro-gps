export const CENTRO_APARECIDA = { lat: -22.845, lng: -45.236 };

const CORES_MARCADOR = [
  "#dc2626",
  "#2563eb",
  "#16a34a",
  "#d97706",
  "#7c3aed",
  "#db2777",
  "#0891b2",
  "#65a30d",
];

export function gerarId(prefixo: string): string {
  return `${prefixo}-${Math.random().toString(36).slice(2, 10)}`;
}

export function gerarCor(): string {
  return CORES_MARCADOR[Math.floor(Math.random() * CORES_MARCADOR.length)];
}

export function gerarLinkCaravana(id: string): string {
  if (typeof window === "undefined") return `/caravana/${id}`;
  return `${window.location.origin}/caravana/${id}`;
}

export function haversineKm(
  a: { lat: number; lng: number },
  b: { lat: number; lng: number }
): number {
  const raio = 6371;
  const dLat = (b.lat - a.lat) * (Math.PI / 180);
  const dLng = (b.lng - a.lng) * (Math.PI / 180);
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(a.lat * (Math.PI / 180)) *
      Math.cos(b.lat * (Math.PI / 180)) *
      Math.sin(dLng / 2) ** 2;
  return 2 * raio * Math.asin(Math.sqrt(s));
}

export function filtrarPorDistancia(
  ultimo: { lat: number; lng: number },
  atual: { lat: number; lng: number },
  distanciaMinimaM: number
): boolean {
  return haversineKm(ultimo, atual) * 1000 >= distanciaMinimaM;
}

export function escaparHtml(texto: string): string {
  return texto
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function iniciais(nome: string): string {
  return nome
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
}

export function formatarTempoRestante(expiraEm: string): string {
  const restante = new Date(expiraEm).getTime() - Date.now();
  if (restante <= 0) return "Expirado";
  const horas = Math.floor(restante / 3_600_000);
  const minutos = Math.floor((restante % 3_600_000) / 60_000);
  if (horas <= 0) return `${minutos} min`;
  return `${horas}h ${minutos}min`;
}
