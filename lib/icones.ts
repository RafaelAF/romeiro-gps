import L from "leaflet";

export function iconeMinhaPosicao(rumo: number | null, label = "Você"): L.DivIcon {
  const setaHtml =
    rumo !== null
      ? `<svg width="64" height="64" viewBox="0 0 64 64" style="position:absolute;top:0;left:0;transform:rotate(${rumo}deg);transform-origin:32px 32px;pointer-events:none;">
           <path d="M32 6 C34 16 40 23 47 24 L32 42 L17 24 C24 23 30 16 32 6 Z" fill="#2563eb" stroke="#ffffff" stroke-width="2.5" stroke-linejoin="round" style="filter:drop-shadow(0 1px 3px rgba(0,0,0,.3));"/>
         </svg>`
      : "";

  const html = `
    <div style="position:relative;width:64px;height:84px;">
      ${setaHtml}
      <div style="position:absolute;top:23px;left:23px;width:18px;height:18px;border-radius:9999px;background:#2563eb;border:3px solid #ffffff;box-shadow:0 1px 6px rgba(0,0,0,.35);"></div>
      <span style="position:absolute;top:46px;left:50%;transform:translateX(-50%);font-size:11px;font-weight:700;background:rgba(255,255,255,.95);padding:1px 6px;border-radius:6px;color:#1d4ed8;box-shadow:0 1px 4px rgba(0,0,0,.15);white-space:nowrap;">${label}</span>
    </div>`;
  return L.divIcon({ className: "", html, iconSize: [64, 84], iconAnchor: [32, 32] });
}

export function iconeEncontro(): L.DivIcon {
  const html = `
    <svg width="36" height="44" viewBox="0 0 24 32" xmlns="http://www.w3.org/2000/svg" style="filter:drop-shadow(0 1px 4px rgba(0,0,0,.4));">
      <path d="M2 8 L22 8 L12 26 Z" fill="#dc2626" stroke="#7f1d1d" stroke-width="1.5"/>
      <rect x="1.2" y="1" width="21.6" height="4" rx="1" fill="#b91c1c" stroke="#7f1d1d" stroke-width="1"/>
      <line x1="12" y1="8" x2="12" y2="26" stroke="#7f1d1d" stroke-width="1.5"/>
    </svg>`;
  return L.divIcon({ className: "", html, iconSize: [36, 44], iconAnchor: [18, 42] });
}

export function iconePoi(cor: string, letra: string): L.DivIcon {
  const html = `
    <div style="position:relative;width:38px;height:46px;">
      <svg width="38" height="46" viewBox="0 0 38 46" style="filter:drop-shadow(0 1px 4px rgba(0,0,0,.4));">
        <path d="M19 2 C10 2 4 9 4 18 C4 28 19 44 19 44 C19 44 34 28 34 18 C34 9 28 2 19 2 Z" fill="${cor}" stroke="#ffffff" stroke-width="2"/>
        <circle cx="19" cy="18" r="7" fill="#ffffff"/>
        <text x="19" y="22" text-anchor="middle" font-size="11" font-weight="800" fill="${cor}">${letra}</text>
      </svg>
    </div>`;
  return L.divIcon({ className: "", html, iconSize: [38, 46], iconAnchor: [19, 44] });
}

export function iconeMembro(
  cor: string,
  label: string,
  online: boolean,
  status: string,
  statusAtivo: boolean
): L.DivIcon {
  const opacidade = online ? "1" : "0.45";
  const filtro = online ? "" : "filter: grayscale(0.85);";
  const statusHtml =
    status && statusAtivo
      ? `<div style="position:absolute;top:-28px;left:50%;transform:translateX(-50%);background:#ffffff;border:2px solid ${cor};border-radius:999px;padding:2px 6px;font-size:16px;box-shadow:0 2px 8px rgba(0,0,0,.2);display:flex;align-items:center;justify-content:center;animation: bounce 1s infinite alternate;">
           ${status}
         </div>`
      : "";

  const html = `
    <div style="display:flex;flex-direction:column;align-items:center;gap:2px;opacity:${opacidade};${filtro}position:relative;">
      ${statusHtml}
      <div style="width:16px;height:16px;border-radius:9999px;background:${cor};border:3px solid #ffffff;box-shadow:0 0 0 5px ${cor}40,0 1px 6px rgba(0,0,0,.35);"></div>
      <span style="font-size:11px;font-weight:700;background:rgba(255,255,255,.95);padding:1px 6px;border-radius:6px;color:${online ? cor : "#71717a"};box-shadow:0 1px 4px rgba(0,0,0,.15);white-space:nowrap;">
        ${label} ${online ? "" : " (offline)"}
      </span>
    </div>`;
  return L.divIcon({ className: "", html, iconSize: [80, 42], iconAnchor: [40, 20] });
}

export function iconeLider(online: boolean): L.DivIcon {
  const opacidade = online ? "1" : "0.5";
  const corona = online
    ? `<svg width="26" height="18" viewBox="0 0 26 18" style="position:absolute;top:-8px;left:50%;transform:translateX(-50%);filter:drop-shadow(0 1px 2px rgba(0,0,0,.4));">
         <path d="M2 15 L24 15 L20 3 L14 9 L13 4 L12 9 L6 3 Z" fill="#fbbf24" stroke="#b45309" stroke-width="1.2"/>
       </svg>`
    : "";
  const html = `
    <div style="position:relative;display:flex;flex-direction:column;align-items:center;opacity:${opacidade};">
      ${corona}
      <div style="width:26px;height:26px;border-radius:9999px;background:#f59e0b;border:3px solid #ffffff;box-shadow:0 0 0 5px #f59e0b55,0 0 12px 2px #f59e0b88,0 1px 6px rgba(0,0,0,.35);"></div>
      <span style="font-size:11px;font-weight:800;background:#ffffff;padding:1px 7px;border-radius:6px;color:#b45309;box-shadow:0 1px 4px rgba(0,0,0,.15);white-space:nowrap;border:1px solid #f59e0b;">
        Líder ${online ? "" : "(offline)"}
      </span>
    </div>`;
  return L.divIcon({ className: "", html, iconSize: [90, 58], iconAnchor: [45, 34] });
}

export function iconeParada(cor: string, index: number): L.DivIcon {
  const letra = String(index + 1);
  const html = `
    <div style="position:relative;width:34px;height:42px;">
      <svg width="34" height="42" viewBox="0 0 34 42" style="filter:drop-shadow(0 1px 4px rgba(0,0,0,.4));">
        <path d="M17 2 C9 2 4 8 4 16 C4 25 17 40 17 40 C17 40 30 25 30 16 C30 8 25 2 17 2 Z" fill="${cor}" stroke="#ffffff" stroke-width="2"/>
        <circle cx="17" cy="16" r="7" fill="#ffffff"/>
        <text x="17" y="20" text-anchor="middle" font-size="10" font-weight="800" fill="${cor}">${letra}</text>
      </svg>
    </div>`;
  return L.divIcon({ className: "", html, iconSize: [34, 42], iconAnchor: [17, 40] });
}
