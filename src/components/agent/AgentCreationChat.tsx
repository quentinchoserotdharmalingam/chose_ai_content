"use client";

import { useState, useRef, useEffect } from "react";
import { ArrowLeft, Send, Loader2, Bot, User, Check } from "lucide-react";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface AgentCreationChatProps {
  onBack: () => void;
  onCreated: () => void;
}

export function AgentCreationChat({ onBack, onCreated }: AgentCreationChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [detectedConfig, setDetectedConfig] = useState<Record<string, unknown> | null>(null);
  const [creating, setCreating] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    // Start conversation
    sendMessage("Bonjour, je souhaite créer un nouvel agent IA.", true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async (text: string, isInitial = false) => {
    if (streaming) return;

    const newMessages: Message[] = isInitial
      ? [{ role: "user", content: text }]
      : [...messages, { role: "user", content: text }];

    setMessages(newMessages);
    setInput("");
    setStreaming(true);

    try {
      const res = await fetch("/api/agents/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: newMessages }),
      });

      const reader = res.body?.getReader();
      if (!reader) return;

      let assistantMessage = "";
      setMessages([...newMessages, { role: "assistant", content: "" }]);

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
                { role: "assistant", content: assistantMessage },
              ]);
            } catch {
              // skip invalid JSON
            }
          }
        }
      }

      // Check if the response contains a ready config
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
    } finally {
      setStreaming(false);
      inputRef.current?.focus();
    }
  };

  const createAgent = async () => {
    if (!detectedConfig) return;
    setCreating(true);
    try {
      await fetch("/api/agents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(detectedConfig),
      });
      onCreated();
    } catch (error) {
      console.error("Create error:", error);
    } finally {
      setCreating(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (input.trim()) sendMessage(input.trim());
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-220px)]">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-[13px] text-ht-text-secondary hover:text-ht-text transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Retour
        </button>
        <div className="flex items-center gap-2">
          <Bot className="h-4 w-4 text-ht-primary" />
          <span className="text-[14px] font-semibold text-ht-text">Création d&apos;agent assistée</span>
        </div>
        <div className="w-20" />
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto rounded-xl border border-ht-border bg-white p-4 space-y-4">
        {messages.map((msg, i) => (
          <div key={i} className={`flex gap-3 ${msg.role === "user" ? "justify-end" : ""}`}>
            {msg.role === "assistant" && (
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#FF6058] to-[#FF8A65] text-white">
                <Bot className="h-4 w-4" />
              </div>
            )}
            <div
              className={`max-w-[80%] rounded-2xl px-4 py-3 text-[13px] leading-relaxed ${
                msg.role === "user"
                  ? "bg-ht-primary text-white"
                  : "bg-ht-fill-secondary text-ht-text"
              }`}
            >
              <div className="whitespace-pre-wrap">{msg.content.replace(/```json[\s\S]*?```/g, "[Configuration détectée]")}</div>
            </div>
            {msg.role === "user" && (
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-ht-fill-secondary text-ht-text">
                <User className="h-4 w-4" />
              </div>
            )}
          </div>
        ))}
        {streaming && messages[messages.length - 1]?.content === "" && (
          <div className="flex gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#FF6058] to-[#FF8A65] text-white">
              <Bot className="h-4 w-4" />
            </div>
            <div className="rounded-2xl bg-ht-fill-secondary px-4 py-3">
              <Loader2 className="h-4 w-4 animate-spin text-ht-text-secondary" />
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Detected config banner */}
      {detectedConfig && (
        <div className="mt-3 rounded-xl border border-green-200 bg-green-50 p-4 flex items-center justify-between">
          <div>
            <p className="text-[13px] font-semibold text-green-700">
              Configuration d&apos;agent détectée : {(detectedConfig as { name?: string }).name}
            </p>
            <p className="text-[12px] text-green-600 mt-0.5">
              L&apos;IA a généré une configuration complète pour votre agent.
            </p>
          </div>
          <button
            onClick={createAgent}
            disabled={creating}
            className="flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-[13px] font-medium text-white hover:bg-green-700 disabled:opacity-50 transition-all"
          >
            {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
            {creating ? "Création..." : "Créer cet agent"}
          </button>
        </div>
      )}

      {/* Input */}
      <div className="mt-3 flex gap-2">
        <textarea
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Décrivez le problème que votre agent doit résoudre..."
          rows={1}
          className="flex-1 resize-none rounded-xl border border-ht-border bg-white px-4 py-3 text-[13px] text-ht-text placeholder:text-ht-text-secondary focus:border-ht-primary focus:outline-none"
        />
        <button
          onClick={() => input.trim() && sendMessage(input.trim())}
          disabled={!input.trim() || streaming}
          className="flex h-11 w-11 items-center justify-center rounded-xl bg-ht-primary text-white transition-all hover:bg-ht-primary-dark disabled:opacity-50"
        >
          <Send className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
