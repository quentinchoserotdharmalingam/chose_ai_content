import Anthropic from "@anthropic-ai/sdk";
import type { AnalysisResult, FormatSlug } from "@/types";
import { getAnalyzePrompt } from "@/lib/prompts/analyze";
import { getSynthesePrompt } from "@/lib/prompts/synthese";
import { getFlashcardsPrompt } from "@/lib/prompts/flashcards";
import { getModulePrompt } from "@/lib/prompts/module";
import { getScenariosPrompt } from "@/lib/prompts/scenarios";
import { getChatSystemPrompt } from "@/lib/prompts/chat-system";

const client = new Anthropic();

export async function analyzeDocument(text: string): Promise<AnalysisResult> {
  const response = await client.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 2000,
    messages: [
      {
        role: "user",
        content: getAnalyzePrompt(text),
      },
    ],
  });

  const content = response.content[0];
  if (content.type !== "text") throw new Error("Unexpected response type");

  const jsonMatch = content.text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error("No JSON found in response");

  return JSON.parse(jsonMatch[0]) as AnalysisResult;
}

export async function generateFormatContent(
  text: string,
  objective: string,
  format: FormatSlug,
  tone: string = "professional"
): Promise<object> {
  const promptFn: Record<FormatSlug, ((t: string, o: string, tone: string) => string) | null> = {
    synthese: getSynthesePrompt,
    flashcards: getFlashcardsPrompt,
    module: getModulePrompt,
    scenarios: getScenariosPrompt,
    chat: null,
  };

  const fn = promptFn[format];
  if (!fn) throw new Error(`Format "${format}" is dynamic and cannot be pre-generated`);

  const response = await client.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 4000,
    messages: [
      {
        role: "user",
        content: fn(text, objective, tone),
      },
    ],
  });

  const content = response.content[0];
  if (content.type !== "text") throw new Error("Unexpected response type");

  const jsonMatch = content.text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error("No JSON found in response");

  return JSON.parse(jsonMatch[0]);
}

export function getChatStream(
  text: string,
  objective: string,
  messages: Array<{ role: "user" | "assistant"; content: string }>
) {
  return client.messages.stream({
    model: "claude-sonnet-4-20250514",
    max_tokens: 1000,
    system: getChatSystemPrompt(text, objective),
    messages,
  });
}
