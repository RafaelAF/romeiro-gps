import { assinar, listarMembros, marcarOffline, type PosicaoMembro } from "@/lib/sessoes";

export const dynamic = "force-dynamic";

function evento(dados: PosicaoMembro): string {
  return `data: ${JSON.stringify(dados)}\n\n`;
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: sessaoId } = await params;
  const { searchParams } = new URL(request.url);
  const membroId = searchParams.get("membroId");

  const snapshot = listarMembros(sessaoId);

  const stream = new ReadableStream({
    start(controller) {
      const enc = new TextEncoder();
      controller.enqueue(enc.encode(": ok\n\n"));

      for (const membro of snapshot) {
        controller.enqueue(enc.encode(evento(membro)));
      }

      const cancelar = assinar(sessaoId, (posicao) => {
        try {
          controller.enqueue(enc.encode(evento(posicao)));
        } catch {
          void 0;
        }
      });

      const heartbeat = setInterval(() => {
        try {
          controller.enqueue(enc.encode(": ping\n\n"));
        } catch {
          clearInterval(heartbeat);
        }
      }, 25_000);

      request.signal.addEventListener("abort", () => {
        cancelar();
        clearInterval(heartbeat);
        if (membroId) {
          marcarOffline(sessaoId, membroId);
        }
        try {
          controller.close();
        } catch {
          void 0;
        }
      });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
