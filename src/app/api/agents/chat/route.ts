import { NextRequest } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { getAgentCreationPrompt } from "@/lib/prompts/agent-suggestions";

const client = new Anthropic();

export async function POST(request: NextRequest) {
  const { messages } = await request.json();

  const stream = client.messages.stream({
    model: "claude-sonnet-4-20250514",
    max_tokens: 1000,
    system: getAgentCreationPrompt(),
    messages: messages.map((m: { role: string; content: string }) => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    })),
  });

  const encoder = new TextEncoder();
  const readable = new ReadableStream({
    async start(controller) {
      for await (const event of stream) {
        if (event.type === "content_block_delta" && event.delta.type === "text_delta") {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text: event.delta.text })}\n\n`));
        }
      }
      controller.enqueue(encoder.encode("data: [DONE]\n\n"));
      controller.close();
    },
  });

  return new Response(readable, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
