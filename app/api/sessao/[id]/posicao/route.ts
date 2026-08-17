import { NextResponse } from "next/server";
import { atualizarPosicao, type PoiSessao, type PosicaoMembro } from "@/lib/sessoes";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: sessaoId } = await params;
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ erro: "JSON inválido" }, { status: 400 });
  }

  const { id, lat, lng, ts, cor, nome, bateria, precisao, status, statusTs, online, lider, pois } = body as Partial<PosicaoMembro>;

  if (
    typeof id !== "string" ||
    typeof lat !== "number" ||
    typeof lng !== "number" ||
    typeof ts !== "number" ||
    typeof cor !== "string" ||
    typeof nome !== "string" ||
    nome.trim() === "" ||
    !Number.isFinite(lat) ||
    !Number.isFinite(lng) ||
    lat < -90 ||
    lat > 90 ||
    lng < -180 ||
    lng > 180
  ) {
    return NextResponse.json({ erro: "Payload inválido" }, { status: 400 });
  }

  // Valida e sanitiza os novos campos opcionais
  const baterVal = typeof bateria === "number" && bateria >= 0 && bateria <= 100 ? bateria : null;
  const precVal = typeof precisao === "number" && precisao >= 0 ? precisao : 0;
  const statusVal = typeof status === "string" ? status.slice(0, 10) : "";
  const statusTsVal = typeof statusTs === "number" ? statusTs : 0;
  const onlineVal = typeof online === "boolean" ? online : true;
  const liderVal = typeof lider === "boolean" ? lider : false;
  const poisVal: PoiSessao[] = Array.isArray(pois)
    ? pois
        .filter(
          (p): p is PoiSessao =>
            !!p &&
            typeof p.id === "string" &&
            typeof p.nome === "string" &&
            typeof p.tipo === "string" &&
            typeof p.lat === "number" &&
            typeof p.lng === "number" &&
            Number.isFinite(p.lat) &&
            Number.isFinite(p.lng)
        )
        .slice(0, 50)
        .map((p) => ({
          id: p.id.slice(0, 40),
          nome: p.nome.slice(0, 40),
          tipo: p.tipo.slice(0, 20),
          lat: p.lat,
          lng: p.lng,
        }))
    : [];

  atualizarPosicao(sessaoId, {
    id,
    lat,
    lng,
    ts: Date.now(),
    cor,
    nome: nome.slice(0, 30),
    bateria: baterVal,
    precisao: precVal,
    status: statusVal,
    statusTs: statusTsVal,
    online: onlineVal,
    lider: liderVal,
    pois: liderVal ? poisVal : [],
  });
  return NextResponse.json({ ok: true });
}
