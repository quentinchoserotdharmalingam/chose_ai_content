import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { getInterviewChatStream } from "@/lib/interview";
import type { InterviewPromptParams } from "@/lib/prompts/interview-system";

export const maxDuration = 60;

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();
  const { sessionId, messages } = body;

  if (!sessionId || !messages) {
    return new Response(JSON.stringify({ error: "sessionId et messages requis" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const interview = await prisma.interviewResource.findUnique({ where: { id } });
  if (!interview || interview.status !== "published") {
    return new Response(JSON.stringify({ error: "Interview introuvable ou non publiée" }), {
      status: 404,
      headers: { "Content-Type": "application/json" },
    });
  }

  const session = await prisma.interviewSession.findUnique({
    where: { id: sessionId },
    include: { _count: { select: { messages: true } } },
  });

  if (!session || session.interviewResourceId !== id) {
    return new Response(JSON.stringify({ error: "Session introuvable" }), {
      status: 404,
      headers: { "Content-Type": "application/json" },
    });
  }

  if (session.status !== "in_progress") {
    return new Response(JSON.stringify({ error: "Session terminée" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const assistantQuestionCount = Math.floor(session._count.messages / 2);

  const config: InterviewPromptParams = {
    theme: interview.theme,
    tone: interview.tone,
    scopeIn: interview.scopeIn || undefined,
    scopeOut: interview.scopeOut || undefined,
    anchorQuestions: JSON.parse(interview.anchorQuestions),
    checkpointQuestions: JSON.parse(interview.checkpointQuestions),
    targetDurationMinutes: interview.targetDurationMinutes,
    maxQuestions: interview.maxQuestions,
    participantName: session.participantName || undefined,
  };

  // Save user message to DB
  const lastUserMsg = messages[messages.length - 1];
  if (lastUserMsg && lastUserMsg.role === "user") {
    await prisma.interviewMessage.create({
      data: {
        sessionId,
        role: "user",
        content: lastUserMsg.content,
      },
    });
  }

  const stream = getInterviewChatStream(config, messages, assistantQuestionCount);

  const encoder = new TextEncoder();
  let fullResponse = "";

  const readableStream = new ReadableStream({
    async start(controller) {
      try {
        for await (const event of stream) {
          if (event.type === "content_block_delta") {
            const delta = event.delta;
            if ("text" in delta) {
              fullResponse += delta.text;
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text: delta.text })}\n\n`));
            }
          }
        }

        // Save assistant response to DB
        if (fullResponse) {
          await prisma.interviewMessage.create({
            data: {
              sessionId,
              role: "assistant",
              content: fullResponse,
            },
          });
        }

        // Check if we should auto-close (reached max questions)
        const updatedCount = assistantQuestionCount + 1;
        if (updatedCount >= interview.maxQuestions) {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ meta: "max_questions_reached" })}\n\n`));
        }

        controller.enqueue(encoder.encode("data: [DONE]\n\n"));
        controller.close();
      } catch (error) {
        console.error("Interview chat stream error:", error);
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
