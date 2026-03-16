"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useParams } from "next/navigation";
import { Send, Loader2, Bot, ShieldCheck, Activity } from "lucide-react";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface PulseData {
  id: string;
  title: string;
  pulseQuestion: string;
  theme: string;
  tone: string;
  pulseMaxFollowUps: number;
  status: string;
}

const SCORE_COLORS: Record<number, string> = {
  1: "bg-red-500",
  2: "bg-red-400",
  3: "bg-orange-500",
  4: "bg-orange-400",
  5: "bg-amber-400",
  6: "bg-yellow-400",
  7: "bg-lime-400",
  8: "bg-green-400",
  9: "bg-green-500",
  10: "bg-emerald-500",
};

export default function PulsePage() {
  const params = useParams();
  const pulseId = params.id as string;

  const [pulse, setPulse] = useState<PulseData | null>(null);
  const [loading, setLoading] = useState(true);
  const [phase, setPhase] = useState<"name" | "score" | "chat" | "done">("name");
  const [participantName, setParticipantName] = useState("");
  const [selectedScore, setSelectedScore] = useState<number | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [readyToComplete, setReadyToComplete] = useState(false);
  const [completing, setCompleting] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = useCallback(() => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  }, []);

  useEffect(() => scrollToBottom(), [messages, scrollToBottom]);

  // Load pulse data
  useEffect(() => {
    fetch(`/api/interviews/${pulseId}`)
      .then((res) => res.json())
      .then((data) => {
        setPulse(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [pulseId]);

  const startWithScore = async () => {
    if (selectedScore === null || !participantName.trim()) return;
    setPhase("chat");
    setStreaming(true);

    try {
      // Create session with pulseScore
      const res = await fetch(`/api/interviews/${pulseId}/sessions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ participantName, pulseScore: selectedScore }),
      });
      const session = await res.json();
      setSessionId(session.id);

      // If resuming existing session with messages
      if (session.messages && session.messages.length > 0) {
        const restored: Message[] = session.messages.map((m: { role: string; content: string }) => ({
          role: m.role as "user" | "assistant",
          content: m.content,
        }));
        setMessages(restored);
        setStreaming(false);
        return;
      }

      // Generate first AI follow-up based on score
      await streamMessage(session.id, []);
    } catch {
      setStreaming(false);
    }
  };

  const streamMessage = useCallback(async (sid: string, msgs: Message[]) => {
    setStreaming(true);
    try {
      const res = await fetch(`/api/interviews/${pulseId}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId: sid, messages: msgs }),
      });

      if (!res.ok) return;
      const reader = res.body?.getReader();
      if (!reader) return;

      const decoder = new TextDecoder();
      let assistantContent = "";
      let maxReached = false;

      setMessages((prev) => [...prev, { role: "assistant", content: "" }]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value);
        const lines = chunk.split("\n");

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const data = line.slice(6);
          if (data === "[DONE]") continue;
          try {
            const parsed = JSON.parse(data);
            if (parsed.text) {
              assistantContent += parsed.text;
              setMessages((prev) => {
                const updated = [...prev];
                updated[updated.length - 1] = { role: "assistant", content: assistantContent };
                return updated;
              });
            }
            if (parsed.meta === "max_questions_reached") maxReached = true;
          } catch { /* ignore */ }
        }
      }

      if (maxReached) setReadyToComplete(true);
    } catch { /* silent */ } finally {
      setStreaming(false);
    }
  }, [pulseId]);

  const handleSend = async () => {
    if (!input.trim() || streaming || !sessionId) return;
    const userMessage: Message = { role: "user", content: input.trim() };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput("");
    await streamMessage(sessionId, newMessages);
  };

  const handleComplete = async () => {
    if (!sessionId) return;
    setCompleting(true);
    try {
      await fetch(`/api/interviews/${pulseId}/sessions/${sessionId}/complete`, { method: "POST" });
      setPhase("done");
    } catch { /* silent */ } finally {
      setCompleting(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <Loader2 className="h-8 w-8 animate-spin text-coral" />
      </div>
    );
  }

  if (!pulse || pulse.status !== "published") {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <p className="text-gray-500">Ce pulse n&apos;est pas disponible.</p>
      </div>
    );
  }

  // Name prompt
  if (phase === "name") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-gray-50 to-white p-4">
        <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
          <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-xl bg-coral/10">
            <Activity className="h-6 w-6 text-coral" />
          </div>
          <h1 className="mb-2 text-xl font-semibold">{pulse.title}</h1>
          <p className="mb-4 text-sm text-gray-600">
            Un check-in rapide avec un suivi IA personnalisé. Cela prend moins de 2 minutes.
          </p>

          <div className="mb-4 space-y-2.5">
            <div className="flex items-start gap-2.5 rounded-lg bg-blue-50 p-3">
              <ShieldCheck className="mt-0.5 h-4 w-4 flex-shrink-0 text-blue-500" />
              <p className="text-xs text-blue-700">
                <strong>Confidentialité</strong> — Vos réponses sont traitées de manière confidentielle.
              </p>
            </div>
            <div className="flex items-start gap-2.5 rounded-lg bg-amber-50 p-3">
              <Bot className="mt-0.5 h-4 w-4 flex-shrink-0 text-amber-600" />
              <p className="text-xs text-amber-800">
                <strong>Intelligence artificielle</strong> — Un assistant IA vous posera quelques questions de suivi.
              </p>
            </div>
          </div>

          <div className="mb-4">
            <label className="mb-1.5 block text-sm font-medium">Votre prénom</label>
            <input
              type="text"
              value={participantName}
              onChange={(e) => setParticipantName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && participantName.trim() && setPhase("score")}
              placeholder="Prénom"
              className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm focus:border-coral focus:outline-none focus:ring-1 focus:ring-coral"
              autoFocus
            />
          </div>
          <button
            onClick={() => setPhase("score")}
            disabled={!participantName.trim()}
            className="w-full rounded-full bg-coral py-2.5 text-sm font-semibold text-white hover:bg-coral-dark disabled:opacity-50"
          >
            Continuer
          </button>
        </div>
      </div>
    );
  }

  // Score selection
  if (phase === "score") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-gray-50 to-white p-4">
        <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-8 shadow-sm text-center">
          <div className="mb-6 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-coral/10">
            <Activity className="h-6 w-6 text-coral" />
          </div>
          <h2 className="mb-2 text-lg font-semibold">{pulse.title}</h2>
          <p className="mb-8 text-sm text-gray-600">{pulse.pulseQuestion}</p>

          {/* Score buttons */}
          <div className="mb-4 grid grid-cols-5 gap-3">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
              <button
                key={n}
                onClick={() => setSelectedScore(n)}
                className={`flex h-12 w-full items-center justify-center rounded-xl text-[15px] font-semibold transition-all duration-200 ${
                  selectedScore === n
                    ? `${SCORE_COLORS[n]} text-white scale-110 shadow-md`
                    : "border border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50"
                }`}
              >
                {n}
              </button>
            ))}
          </div>

          <div className="mb-6 flex justify-between px-1 text-[11px] text-gray-400">
            <span>Pas du tout</span>
            <span>Parfaitement</span>
          </div>

          <button
            onClick={startWithScore}
            disabled={selectedScore === null || streaming}
            className="w-full rounded-full bg-coral py-3 text-sm font-semibold text-white hover:bg-coral-dark disabled:opacity-50"
          >
            {streaming ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" /> Chargement...
              </span>
            ) : (
              "Valider"
            )}
          </button>
        </div>
      </div>
    );
  }

  // Done
  if (phase === "done") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
        <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-8 text-center shadow-sm">
          <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
            <span className="text-xl">&#10003;</span>
          </div>
          <h2 className="mb-2 text-lg font-semibold">Merci pour votre retour !</h2>
          <p className="mb-6 text-sm text-gray-600">
            Votre réponse a été enregistrée. Elle contribue à améliorer votre expérience.
          </p>
          <button
            onClick={() => window.close()}
            className="w-full rounded-full bg-coral py-2.5 text-sm font-semibold text-white hover:bg-coral-dark"
          >
            Fermer cette page
          </button>
          <p className="mt-3 text-[11px] text-gray-400">Vous pouvez fermer cet onglet en toute sécurité.</p>
        </div>
      </div>
    );
  }

  // Chat phase
  return (
    <div className="flex h-dvh flex-col bg-gray-50">
      {/* Header */}
      <div className="border-b border-gray-200 bg-white">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-coral/10">
              <Activity className="h-3.5 w-3.5 text-coral" />
            </div>
            <div>
              <h1 className="text-sm font-medium leading-tight">{pulse.title}</h1>
              <p className="text-[10px] text-gray-400">Score : {selectedScore}/10</p>
            </div>
          </div>
          {(readyToComplete || messages.length >= 4) && (
            <button
              onClick={handleComplete}
              disabled={completing}
              className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-40"
            >
              {completing ? <Loader2 className="h-3 w-3 animate-spin" /> : "Terminer"}
            </button>
          )}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-6">
        <div className="mx-auto max-w-2xl space-y-4">
          {messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
              {msg.role === "assistant" && (
                <div className="mr-2 mt-1 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-coral/10">
                  <Bot className="h-3.5 w-3.5 text-coral" />
                </div>
              )}
              <div className="max-w-[75%]">
                <div className={`rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                  msg.role === "user"
                    ? "bg-coral text-white"
                    : "bg-white border border-gray-200 text-gray-800"
                }`}>
                  {msg.content || (
                    <span className="flex items-center gap-1.5 text-gray-400">
                      <Loader2 className="h-3 w-3 animate-spin" />
                      <span className="text-xs">L&apos;IA rédige...</span>
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input */}
      <div className="border-t border-gray-200 bg-white px-4 pb-[calc(0.75rem+env(safe-area-inset-bottom,0px))] pt-3">
        <div className="mx-auto max-w-2xl">
          {readyToComplete ? (
            <div className="py-2 text-center">
              <p className="mb-3 text-xs text-gray-500">Merci pour vos réponses.</p>
              <button
                onClick={handleComplete}
                disabled={completing}
                className="inline-flex items-center gap-2 rounded-full bg-coral px-8 py-3 text-sm font-semibold text-white shadow-sm hover:bg-coral-dark disabled:opacity-50"
              >
                {completing && <Loader2 className="h-4 w-4 animate-spin" />}
                Terminer
              </button>
            </div>
          ) : (
            <div className="flex items-end gap-2">
              <div className="relative flex-1">
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  onFocus={scrollToBottom}
                  placeholder="Votre réponse..."
                  disabled={streaming}
                  rows={1}
                  className="w-full resize-none rounded-xl border border-gray-200 px-4 py-3 text-sm leading-relaxed focus:border-coral focus:outline-none focus:ring-1 focus:ring-coral disabled:opacity-50"
                />
              </div>
              <button
                onClick={handleSend}
                disabled={!input.trim() || streaming}
                className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-coral text-white hover:bg-coral-dark disabled:opacity-40"
              >
                {streaming ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
