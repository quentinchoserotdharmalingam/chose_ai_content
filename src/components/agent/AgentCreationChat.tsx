"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { ArrowLeft, Send, Loader2, Bot, User, Check, Sparkles } from "lucide-react";

interface Message {
  role: "user" | "assistant";
  content: string;
  timestamp?: number;
  suggestions?: string[];
}

interface AgentCreationChatProps {
  onBack: () => void;
  onCreated: (agentId?: string) => void;
}

// Parse suggestion chips from AI response
function parseSuggestions(content: string): { cleanContent: string; suggestions: string[] } {
  const match = content.match(/<!--\s*suggestions:\s*(\[[\s\S]*?\])\s*-->/);
  if (!match) return { cleanContent: content, suggestions: [] };
  try {
    const suggestions = JSON.parse(match[1]) as string[];
    const cleanContent = content.replace(/<!--\s*suggestions:\s*\[[\s\S]*?\]\s*-->/, "").trim();
    return { cleanContent, suggestions };
  } catch {
    return { cleanContent: content, suggestions: [] };
  }
}

const STEPS = [
  { label: "Objectif", description: "Quel problème résoudre ?" },
  { label: "Déclencheur", description: "Quand se déclenche-t-il ?" },
  { label: "Actions", description: "Que doit-il proposer ?" },
  { label: "Validation", description: "Confirmer la configuration" },
];

// Estimate conversation step from message count
function estimateStep(messageCount: number): number {
  if (messageCount <= 2) return 0;
  if (messageCount <= 4) return 1;
  if (messageCount <= 6) return 2;
  return 3;
}

export function AgentCreationChat({ onBack, onCreated }: AgentCreationChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [detectedConfig, setDetectedConfig] = useState<Record<string, unknown> | null>(null);
  const [creating, setCreating] = useState(false);
  const [initialized, setInitialized] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement | null>(null);

  const scrollToBottom = useCallback((instant = false) => {
    if (scrollContainerRef.current) {
      const container = scrollContainerRef.current;
      if (instant) {
        container.scrollTop = container.scrollHeight;
      } else {
        container.scrollTo({
          top: container.scrollHeight,
          behavior: "smooth",
        });
      }
    }
  }, []);

  // Auto-resize textarea
  const resizeTextarea = useCallback(() => {
    const ta = inputRef.current;
    if (!ta) return;
    ta.style.height = "auto";
    ta.style.height = Math.min(ta.scrollHeight, 120) + "px";
  }, []);

  useEffect(() => {
    resizeTextarea();
  }, [input, resizeTextarea]);

  // Scroll on new messages
  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // Init conversation
  useEffect(() => {
    if (!initialized) {
      setInitialized(true);
      sendMessage("Bonjour, je souhaite créer un nouvel agent IA.", true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const sendMessage = async (text: string, isInitial = false) => {
    if (streaming) return;

    const userMsg: Message = { role: "user", content: text, timestamp: Date.now() };
    const newMessages: Message[] = isInitial ? [userMsg] : [...messages, userMsg];

    setMessages(newMessages);
    setInput("");
    setStreaming(true);

    try {
      const res = await fetch("/api/agents/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: newMessages.map(({ role, content }) => ({ role, content })) }),
      });

      const reader = res.body?.getReader();
      if (!reader) return;

      let assistantMessage = "";
      const assistantMsg: Message = { role: "assistant", content: "", timestamp: Date.now() };
      setMessages([...newMessages, assistantMsg]);

      const decoder = new TextDecoder();
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split("\n");

        for (const line of lines) {
          if (line.startsWith("data: ") && line !== "data: [DONE]") {
            try {
              const data = JSON.parse(line.slice(6));
              assistantMessage += data.text;
              setMessages((prev) => [
                ...prev.slice(0, -1),
                { role: "assistant", content: assistantMessage, timestamp: assistantMsg.timestamp },
              ]);
            } catch {
              // skip
            }
          }
        }
      }

      // Parse suggestions from response
      const { cleanContent, suggestions } = parseSuggestions(assistantMessage);
      if (suggestions.length > 0 || cleanContent !== assistantMessage) {
        setMessages((prev) => [
          ...prev.slice(0, -1),
          { role: "assistant", content: cleanContent, timestamp: assistantMsg.timestamp, suggestions },
        ]);
        assistantMessage = cleanContent;
      }

      // Detect config in response
      const jsonMatch = assistantMessage.match(/```json\s*([\s\S]*?)```/);
      if (jsonMatch) {
        try {
          const config = JSON.parse(jsonMatch[1]);
          if (config.ready && config.agent) {
            setDetectedConfig(config.agent);
          }
        } catch {
          // not valid JSON
        }
      }
    } catch (error) {
      console.error("Chat error:", error);
      setMessages((prev) => [
        ...prev.slice(0, -1),
        { role: "assistant", content: "Désolé, une erreur est survenue. Veuillez réessayer.", timestamp: Date.now() },
      ]);
    } finally {
      setStreaming(false);
      inputRef.current?.focus();
    }
  };

  const createAgent = async () => {
    if (!detectedConfig) return;
    setCreating(true);
    try {
      const res = await fetch("/api/agents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(detectedConfig),
      });
      const created = await res.json();
      onCreated(created.id);
    } catch (error) {
      console.error("Create error:", error);
    } finally {
      setCreating(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (input.trim() && !streaming) sendMessage(input.trim());
    }
  };

  const handleSubmit = () => {
    if (input.trim() && !streaming) sendMessage(input.trim());
  };

  const currentStep = estimateStep(messages.length);
  const configName = (detectedConfig as { name?: string })?.name;

  // Format assistant message: hide raw JSON, render basic markdown
  const formatContent = (content: string, role: "user" | "assistant") => {
    if (role === "user") return content;

    // Replace JSON blocks and suggestion comments with nothing
    let formatted = content.replace(/```json[\s\S]*?```/g, "").replace(/<!--\s*suggestions:\s*\[[\s\S]*?\]\s*-->/, "").trim();

    // Bold
    formatted = formatted.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
    // Italic
    formatted = formatted.replace(/\*(.*?)\*/g, "<em>$1</em>");
    // Inline code
    formatted = formatted.replace(/`([^`]+)`/g, '<code class="rounded bg-black/5 px-1 py-0.5 text-[12px]">$1</code>');
    // Lists
    formatted = formatted.replace(/^- (.+)$/gm, '<span class="flex gap-2 items-start"><span class="text-ht-primary mt-0.5">•</span><span>$1</span></span>');
    formatted = formatted.replace(/^\d+\. (.+)$/gm, '<span class="flex gap-2 items-start"><span class="text-ht-primary font-medium mt-0">$&</span></span>');

    return formatted;
  };

  return (
    <div className="flex flex-col h-[calc(100vh-200px)] max-h-[800px]">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-ht-border mb-0">
        <button
          onClick={onBack}
          className="flex items-center gap-2 rounded-lg px-3 py-2 text-[13px] text-ht-text-secondary hover:text-ht-text hover:bg-ht-fill-secondary transition-all"
        >
          <ArrowLeft className="h-4 w-4" />
          <span className="hidden sm:inline">Retour</span>
        </button>
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-[#FF6058] to-[#FF8A65] text-white">
            <Sparkles className="h-3.5 w-3.5" />
          </div>
          <span className="text-[14px] font-semibold text-ht-text">Créer un agent</span>
        </div>
        <div className="w-20" />
      </div>

      {/* Progress stepper */}
      <div className="flex items-center gap-1 py-3 px-2 overflow-x-auto">
        {STEPS.map((step, i) => (
          <div key={i} className="flex items-center gap-1 shrink-0">
            <div className="flex items-center gap-1.5">
              <div
                className={`flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-semibold transition-all duration-300 ${
                  i < currentStep
                    ? "bg-green-500 text-white"
                    : i === currentStep
                    ? "bg-ht-primary text-white shadow-sm shadow-ht-primary/30"
                    : "bg-ht-fill-secondary text-ht-text-secondary"
                }`}
              >
                {i < currentStep ? <Check className="h-3 w-3" /> : i + 1}
              </div>
              <div className="hidden sm:block">
                <p className={`text-[11px] font-medium leading-none ${
                  i <= currentStep ? "text-ht-text" : "text-ht-text-secondary"
                }`}>
                  {step.label}
                </p>
              </div>
            </div>
            {i < STEPS.length - 1 && (
              <div className={`h-px w-6 mx-1 transition-colors duration-300 ${
                i < currentStep ? "bg-green-400" : "bg-ht-border"
              }`} />
            )}
          </div>
        ))}
      </div>

      {/* Messages area */}
      <div
        ref={scrollContainerRef}
        className="flex-1 overflow-y-auto scroll-smooth overscroll-contain chat-scroll"
        style={{ minHeight: 0 }}
      >
        <div className="max-w-2xl mx-auto px-3 py-4 space-y-5">
          {messages.map((msg, i) => {
            const isUser = msg.role === "user";
            const isFirst = i === 0;
            // Hide the auto-sent first message
            if (isFirst && isUser) return null;

            return (
              <div
                key={i}
                className={`flex gap-3 chat-message-in ${
                  isUser ? "flex-row-reverse" : ""
                }`}
              >
                {/* Avatar */}
                {!isUser && (
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#FF6058] to-[#FF8A65] text-white shadow-sm mt-0.5">
                    <Bot className="h-4 w-4" />
                  </div>
                )}
                {isUser && (
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-ht-primary/10 text-ht-primary mt-0.5">
                    <User className="h-4 w-4" />
                  </div>
                )}

                {/* Bubble */}
                <div
                  className={`max-w-[85%] sm:max-w-[75%] rounded-2xl px-4 py-3 text-[13px] leading-relaxed ${
                    isUser
                      ? "bg-ht-primary text-white rounded-tr-md"
                      : "bg-white border border-ht-border text-ht-text rounded-tl-md shadow-sm"
                  }`}
                >
                  {isUser ? (
                    <p className="whitespace-pre-wrap">{msg.content}</p>
                  ) : (
                    <div
                      className="whitespace-pre-wrap [&_strong]:font-semibold [&_em]:italic [&_code]:font-mono"
                      dangerouslySetInnerHTML={{ __html: formatContent(msg.content, msg.role) }}
                    />
                  )}
                </div>

              </div>
            );
          })}

          {/* Typing indicator */}
          {streaming && messages.length > 0 && messages[messages.length - 1]?.content === "" && (
            <div className="flex gap-3 chat-message-in">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#FF6058] to-[#FF8A65] text-white shadow-sm mt-0.5">
                <Bot className="h-4 w-4" />
              </div>
              <div className="rounded-2xl rounded-tl-md bg-white border border-ht-border px-4 py-3 shadow-sm">
                <div className="flex gap-1.5 items-center">
                  <span className="h-2 w-2 rounded-full bg-ht-text-secondary/40 animate-bounce [animation-delay:0ms]" />
                  <span className="h-2 w-2 rounded-full bg-ht-text-secondary/40 animate-bounce [animation-delay:150ms]" />
                  <span className="h-2 w-2 rounded-full bg-ht-text-secondary/40 animate-bounce [animation-delay:300ms]" />
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} className="h-1" />
        </div>
      </div>

      {/* Config detection banner */}
      {detectedConfig && (
        <div className="mx-3 mb-2 rounded-xl border-2 border-green-300 bg-green-50 p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 chat-config-in">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-green-100 text-green-600">
              <Check className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[14px] font-semibold text-green-800">
                Agent prêt : {configName}
              </p>
              <p className="text-[12px] text-green-600 mt-0.5">
                Configuration générée. Vous pouvez créer l&apos;agent ou continuer à affiner.
              </p>
            </div>
          </div>
          <button
            onClick={createAgent}
            disabled={creating}
            className="flex items-center gap-2 shrink-0 rounded-xl bg-green-600 px-5 py-2.5 text-[13px] font-medium text-white hover:bg-green-700 disabled:opacity-50 transition-all active:scale-95 shadow-sm"
          >
            {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            {creating ? "Création..." : "Créer cet agent"}
          </button>
        </div>
      )}

      {/* Suggestion chips — above input */}
      {(() => {
        const lastAssistant = [...messages].reverse().find((m) => m.role === "assistant");
        if (!lastAssistant?.suggestions?.length || streaming) return null;
        return (
          <div className="px-3 pt-3 pb-1">
            <div className="max-w-2xl mx-auto flex flex-wrap gap-2 justify-center">
              {lastAssistant.suggestions.map((suggestion, si) => (
                <button
                  key={si}
                  onClick={() => sendMessage(suggestion)}
                  disabled={streaming}
                  className="rounded-full border border-ht-border bg-white px-3.5 py-1.5 text-[12px] text-ht-text hover:bg-ht-primary hover:text-white hover:border-ht-primary transition-all active:scale-95 shadow-sm"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        );
      })()}

      {/* Input area */}
      <div className="border-t border-ht-border bg-white px-3 pt-3 pb-2 rounded-b-xl">
        <div className="max-w-2xl mx-auto flex gap-2 items-end">
          <div className="flex-1 relative">
            <textarea
              ref={(el) => { inputRef.current = el; }}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={
                detectedConfig
                  ? "Ajuster la configuration ou valider ci-dessus..."
                  : streaming
                  ? "L'assistant réfléchit..."
                  : "Décrivez votre besoin..."
              }
              disabled={streaming}
              rows={1}
              className="w-full resize-none rounded-xl border border-ht-border bg-ht-fill-secondary/50 px-4 py-3 pr-12 text-[13px] text-ht-text placeholder:text-ht-text-secondary/70 focus:border-ht-primary focus:bg-white focus:outline-none focus:ring-2 focus:ring-ht-primary/10 disabled:opacity-50 transition-all"
              style={{ maxHeight: "120px" }}
            />
            <button
              onClick={handleSubmit}
              disabled={!input.trim() || streaming}
              className={`absolute right-2 bottom-2 flex h-8 w-8 items-center justify-center rounded-lg transition-all ${
                input.trim() && !streaming
                  ? "bg-ht-primary text-white hover:bg-ht-primary-dark active:scale-90 shadow-sm"
                  : "bg-transparent text-ht-text-secondary/40"
              }`}
            >
              {streaming ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </button>
          </div>
        </div>
        <p className="text-center text-[11px] text-ht-text-secondary/60 mt-2">
          Entrée pour envoyer · Shift+Entrée pour un retour à la ligne
        </p>
      </div>
    </div>
  );
}
