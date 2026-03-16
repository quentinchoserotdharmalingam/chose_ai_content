import Anthropic from "@anthropic-ai/sdk";
import {
  getInterviewSystemPrompt,
  getInterviewAnalysisPrompt,
  getSuggestAnalysisTemplatePrompt,
  getSuggestScopePrompt,
  getSuggestQuestionsPrompt,
  getSuggestTitleDescriptionPrompt,
  type InterviewPromptParams,
} from "@/lib/prompts/interview-system";
import { getPulseSystemPrompt, getPulseAnalysisPrompt, type PulsePromptParams } from "@/lib/prompts/pulse-system";
import type { AnalysisTemplateDimension } from "@/types";

const client = new Anthropic();

export function getInterviewChatStream(
  config: InterviewPromptParams,
  messages: Array<{ role: "user" | "assistant"; content: string }>,
  questionCount: number,
  isFirstMessage = false
) {
  const systemPrompt = getInterviewSystemPrompt(config);
  const contextNote =
    questionCount > 0
      ? `\n[Contexte interne — invisible pour le collaborateur : ${questionCount} questions posées sur ${config.maxQuestions} max]`
      : "";

  // Use Haiku for the first greeting message (faster), Sonnet for the rest
  return client.messages.stream({
    model: isFirstMessage ? "claude-haiku-4-5-20251001" : "claude-sonnet-4-20250514",
    max_tokens: isFirstMessage ? 250 : 400,
    system: systemPrompt + contextNote,
    messages,
  });
}

export function getPulseChatStream(
  config: PulsePromptParams,
  messages: Array<{ role: "user" | "assistant"; content: string }>,
  questionCount: number
) {
  const systemPrompt = getPulseSystemPrompt(config);
  const contextNote =
    questionCount > 0
      ? `\n[Contexte interne : ${questionCount} questions posées sur ${config.maxFollowUps} max]`
      : "";

  return client.messages.stream({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 200,
    system: systemPrompt + contextNote,
    messages,
  });
}

export async function generatePulseAnalysis(
  pulseQuestion: string,
  score: number,
  messages: Array<{ role: string; content: string }>
): Promise<{ summary: string; rawAnalysis: string }> {
  const prompt = getPulseAnalysisPrompt(pulseQuestion, score, messages);

  const response = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 1000,
    messages: [{ role: "user", content: prompt }],
  });

  const content = response.content[0];
  if (content.type !== "text") throw new Error("Unexpected response type");

  const jsonMatch = content.text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error("No JSON found in pulse analysis response");

  const parsed = JSON.parse(jsonMatch[0]);
  return {
    summary: JSON.stringify(parsed),
    rawAnalysis: content.text,
  };
}

export async function generateInterviewAnalysis(
  messages: Array<{ role: string; content: string }>,
  analysisTemplate: AnalysisTemplateDimension[]
): Promise<{ summary: string; rawAnalysis: string }> {
  const prompt = getInterviewAnalysisPrompt(messages, analysisTemplate);

  const response = await client.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 4000,
    messages: [{ role: "user", content: prompt }],
  });

  const content = response.content[0];
  if (content.type !== "text") throw new Error("Unexpected response type");

  const jsonMatch = content.text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error("No JSON found in analysis response");

  const parsed = JSON.parse(jsonMatch[0]);
  return {
    summary: JSON.stringify(parsed),
    rawAnalysis: content.text,
  };
}

export async function suggestAnalysisTemplate(
  theme: string,
  customTheme?: string,
  scopeIn?: string
): Promise<AnalysisTemplateDimension[]> {
  const prompt = getSuggestAnalysisTemplatePrompt(theme, customTheme, scopeIn);

  const response = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 2000,
    messages: [{ role: "user", content: prompt }],
  });

  const content = response.content[0];
  if (content.type !== "text") throw new Error("Unexpected response type");

  const jsonMatch = content.text.match(/\[[\s\S]*\]/);
  if (!jsonMatch) throw new Error("No JSON array found in suggestion response");

  return JSON.parse(jsonMatch[0]) as AnalysisTemplateDimension[];
}

export async function suggestScope(
  theme: string,
  customTheme?: string
): Promise<{ scopeIn: string; scopeOut: string }> {
  const prompt = getSuggestScopePrompt(theme, customTheme);

  const response = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 1500,
    messages: [{ role: "user", content: prompt }],
  });

  const content = response.content[0];
  if (content.type !== "text") throw new Error("Unexpected response type");

  const jsonMatch = content.text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error("No JSON found");

  return JSON.parse(jsonMatch[0]);
}

export async function suggestQuestions(
  theme: string,
  customTheme?: string,
  scopeIn?: string,
  scopeOut?: string,
  tone?: string
): Promise<{ anchorQuestions: string[]; checkpointQuestions: string[] }> {
  const prompt = getSuggestQuestionsPrompt(theme, customTheme, scopeIn, scopeOut, tone);

  const response = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 2000,
    messages: [{ role: "user", content: prompt }],
  });

  const content = response.content[0];
  if (content.type !== "text") throw new Error("Unexpected response type");

  const jsonMatch = content.text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error("No JSON found");

  return JSON.parse(jsonMatch[0]);
}

export async function suggestTitleDescription(
  theme: string,
  customTheme?: string,
  scopeIn?: string,
  tone?: string
): Promise<{ title: string; description: string }> {
  const prompt = getSuggestTitleDescriptionPrompt(theme, customTheme, scopeIn, tone);

  const response = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 500,
    messages: [{ role: "user", content: prompt }],
  });

  const content = response.content[0];
  if (content.type !== "text") throw new Error("Unexpected response type");

  const jsonMatch = content.text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error("No JSON found");

  return JSON.parse(jsonMatch[0]);
}
