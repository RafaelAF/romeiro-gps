import { assinar, listarMembros, type PosicaoMembro } from "@/lib/sessoes";

export const dynamic = "force-dynamic";

function evento(dados: PosicaoMembro): string {
  return `data: ${JSON.stringify(dados)}\n\n`;
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: sessaoId } = await params;

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

      _request.signal.addEventListener("abort", () => {
        cancelar();
        clearInterval(heartbeat);
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
