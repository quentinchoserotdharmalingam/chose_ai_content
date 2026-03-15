import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { getChatStream } from "@/lib/claude";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { resourceId, messages } = body;

  if (!resourceId || !messages) {
    return new Response(JSON.stringify({ error: "resourceId et messages requis" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const resource = await prisma.resource.findUnique({ where: { id: resourceId } });

  if (!resource || !resource.extractedText || !resource.objective) {
    return new Response(JSON.stringify({ error: "Ressource introuvable ou incomplète" }), {
      status: 404,
      headers: { "Content-Type": "application/json" },
    });
  }

  const stream = getChatStream(resource.extractedText, resource.objective, messages);

  const encoder = new TextEncoder();
  const readableStream = new ReadableStream({
    async start(controller) {
      try {
        for await (const event of stream) {
          if (event.type === "content_block_delta") {
            const delta = event.delta;
            if ("text" in delta) {
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text: delta.text })}\n\n`));
            }
          }
        }
        controller.enqueue(encoder.encode("data: [DONE]\n\n"));
        controller.close();
      } catch (error) {
        console.error("Chat stream error:", error);
        controller.error(error);
      }
    },
  });

  return new Response(readableStream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
