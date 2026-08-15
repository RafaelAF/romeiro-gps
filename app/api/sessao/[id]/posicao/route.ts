import { NextResponse } from "next/server";
import { atualizarPosicao, type PosicaoMembro } from "@/lib/sessoes";

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

  const { id, lat, lng, ts, cor, nome, bateria, precisao, status, statusTs, online } = body as Partial<PosicaoMembro>;

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
  });
  return NextResponse.json({ ok: true });
}
