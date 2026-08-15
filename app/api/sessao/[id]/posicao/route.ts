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

  const { id, lat, lng, ts, cor, nome } = body as Partial<PosicaoMembro>;

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

  atualizarPosicao(sessaoId, { id, lat, lng, ts: Date.now(), cor, nome: nome.slice(0, 30) });
  return NextResponse.json({ ok: true });
}
