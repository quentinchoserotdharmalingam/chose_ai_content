"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Send,
  Loader2,
  RotateCcw,
  Sparkles,
  Bot,
  User,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ChatMessage } from "@/types";

interface Props {
  resourceId: string;
}

const SUGGESTIONS = [
  "C'est quoi l'idée principale ?",
  "Explique-moi comme si j'avais 10 ans",
  "Comment appliquer ça concrètement ?",
];

/** Render basic markdown: **bold** */
function renderMarkdown(text: string) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <strong key={i} className="font-semibold">
          {part.slice(2, -2)}
        </strong>
      );
    }
    return part;
  });
}

export function ChatRenderer({ resourceId }: Props) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [initialized, setInitialized] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // Initialize chat with first assistant message
  useEffect(() => {
    if (!initialized) {
      setInitialized(true);
      sendMessage([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const sendMessage = async (currentMessages: ChatMessage[]) => {
    setStreaming(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          resourceId,
          messages:
            currentMessages.length === 0
              ? [{ role: "user" as const, content: "Salut !" }]
              : currentMessages,
        }),
      });

      if (!res.ok) throw new Error("Erreur chat");

      const reader = res.body?.getReader();
      if (!reader) throw new Error("No reader");

      const decoder = new TextDecoder();
      let assistantMsg = "";

      setMessages((prev) => [...prev, { role: "assistant", content: "" }]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split("\n");

        for (const line of lines) {
          if (line.startsWith("data: ") && line !== "data: [DONE]") {
            try {
              const parsed = JSON.parse(line.slice(6));
              if (parsed.text) {
                assistantMsg += parsed.text;
                setMessages((prev) => {
                  const updated = [...prev];
                  updated[updated.length - 1] = {
                    role: "assistant",
                    content: assistantMsg,
                  };
                  return updated;
                });
              }
            } catch {
              // Skip malformed chunks
            }
          }
        }
      }
    } catch (error) {
      console.error("Chat error:", error);
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Désolé, une erreur est survenue. Réessaie." },
      ]);
    } finally {
      setStreaming(false);
    }
  };

  const handleSend = (text?: string) => {
    const message = text || input.trim();
    if (!message || streaming) return;

    const userMessage: ChatMessage = { role: "user", content: message };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput("");
    sendMessage(newMessages);
    inputRef.current?.focus();
  };

  const handleReset = () => {
    setMessages([]);
    setInitialized(false);
    setTimeout(() => {
      setInitialized(true);
      sendMessage([]);
    }, 100);
  };

  const userMessageCount = messages.filter((m) => m.role === "user").length;
  const showSuggestions = !streaming && messages.length > 0 && messages.length <= 2;

  return (
    <div className="flex h-[520px] flex-col rounded-xl border-2 border-gray-200 bg-white">
      {/* Header */}
      <div className="flex items-center justify-between border-b px-4 py-2.5">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-100">
            <Bot className="h-3.5 w-3.5 text-blue-600" />
          </div>
          <div>
            <p className="text-sm font-medium">Coach</p>
            <p className="text-xs text-gray-400">
              {userMessageCount} échange{userMessageCount !== 1 ? "s" : ""}
            </p>
          </div>
        </div>
        <Button variant="ghost" size="sm" onClick={handleReset} disabled={streaming}>
          <RotateCcw className="h-3.5 w-3.5" />
        </Button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
        <AnimatePresence initial={false}>
          {messages.map((msg, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
              className={`flex gap-2 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              {msg.role === "assistant" && (
                <div className="mt-1 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-blue-50">
                  <Bot className="h-3 w-3 text-blue-500" />
                </div>
              )}
              <div
                className={`max-w-[85%] rounded-2xl px-3.5 py-2 text-sm leading-relaxed ${
                  msg.role === "user"
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 text-gray-800"
                }`}
              >
                {msg.content ? renderMarkdown(msg.content) : (
                  <span className="flex items-center gap-1.5 text-gray-400">
                    <Loader2 className="h-3 w-3 animate-spin" />
                    <span className="text-xs">Réflexion...</span>
                  </span>
                )}
              </div>
              {msg.role === "user" && (
                <div className="mt-1 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-blue-100">
                  <User className="h-3 w-3 text-blue-600" />
                </div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Suggestions */}
        {showSuggestions && (
          <motion.div
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="flex flex-wrap gap-1.5 pt-2"
          >
            {SUGGESTIONS.map((suggestion, i) => (
              <button
                key={i}
                onClick={() => handleSend(suggestion)}
                className="rounded-full border border-gray-200 bg-white px-3 py-1.5 text-xs text-gray-500 transition-colors hover:border-blue-300 hover:bg-blue-50 hover:text-blue-600"
              >
                {suggestion}
              </button>
            ))}
          </motion.div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t px-3 py-2.5">
        <div className="flex gap-2">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            placeholder="Pose ta question..."
            disabled={streaming}
            className="flex-1 rounded-full border border-gray-200 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
          />
          <Button
            size="icon"
            className="rounded-full"
            onClick={() => handleSend()}
            disabled={streaming || !input.trim()}
          >
            {streaming ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
