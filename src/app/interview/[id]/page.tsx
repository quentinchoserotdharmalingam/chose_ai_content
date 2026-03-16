"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useParams } from "next/navigation";
import { Send, Loader2, LogOut, Bot, ShieldCheck, Info } from "lucide-react";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface InterviewData {
  id: string;
  title: string;
  theme: string;
  tone: string;
  maxQuestions: number;
  status: string;
}

export default function InterviewChatPage() {
  const params = useParams();
  const interviewId = params.id as string;

  const [interview, setInterview] = useState<InterviewData | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [streaming, setStreaming] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [participantName, setParticipantName] = useState("");
  const [showNamePrompt, setShowNamePrompt] = useState(true);
  const [completing, setCompleting] = useState(false);
  const [readyToComplete, setReadyToComplete] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = useCallback(() => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // Scroll to bottom when mobile keyboard opens (visual viewport resize)
  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;
    const handleResize = () => scrollToBottom();
    vv.addEventListener("resize", handleResize);
    return () => vv.removeEventListener("resize", handleResize);
  }, [scrollToBottom]);

  // Load interview data
  useEffect(() => {
    fetch(`/api/interviews/${interviewId}`)
      .then((res) => res.json())
      .then((data) => {
        setInterview(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [interviewId]);

  const startSession = async () => {
    if (!participantName.trim()) return;
    setShowNamePrompt(false);
    setStreaming(true);

    try {
      // Create or resume session
      const res = await fetch(`/api/interviews/${interviewId}/sessions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ participantName }),
      });
      const session = await res.json();
      setSessionId(session.id);

      // If session has existing messages, restore them
      if (session.messages && session.messages.length > 0) {
        const restored: Message[] = session.messages.map((m: { role: string; content: string }) => ({
          role: m.role as "user" | "assistant",
          content: m.content,
        }));
        setMessages(restored);
        setStreaming(false);
        return;
      }

      // Generate first message from assistant
      await streamMessage(session.id, []);
    } catch {
      setStreaming(false);
    }
  };

  const streamMessage = useCallback(async (sid: string, msgs: Message[]) => {
    setStreaming(true);

    try {
      const res = await fetch(`/api/interviews/${interviewId}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId: sid, messages: msgs }),
      });

      if (!res.ok) {
        console.error("Chat API error:", res.status, await res.text());
        return;
      }

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
            if (parsed.meta === "max_questions_reached") {
              maxReached = true;
            }
          } catch {
            // Ignore parse errors
          }
        }
      }

      if (maxReached) {
        setReadyToComplete(true);
      }
    } catch {
      // Silent for POC
    } finally {
      setStreaming(false);
    }
  }, [interviewId]);

  const handleSend = async () => {
    if (!input.trim() || streaming || !sessionId || completed) return;

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
      await fetch(`/api/interviews/${interviewId}/sessions/${sessionId}/complete`, {
        method: "POST",
      });
      setCompleted(true);
    } catch {
      // Silent
    } finally {
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
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-coral" />
      </div>
    );
  }

  if (!interview || interview.status !== "published") {
    return (
      <div className="flex h-screen items-center justify-center">
        <p className="text-gray-500">Cette interview n&apos;est pas disponible.</p>
      </div>
    );
  }

  // Name prompt
  if (showNamePrompt) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-gray-50 to-white p-4">
        <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
          <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-xl bg-coral/10">
            <Bot className="h-6 w-6 text-coral" />
          </div>
          <h1 className="mb-2 text-xl font-semibold">{interview.title}</h1>

          <p className="mb-4 text-sm text-gray-600">
            Vous allez échanger avec un <strong>assistant IA</strong> qui vous posera des questions de manière conversationnelle, comme dans un échange naturel.
          </p>

          <div className="mb-6 space-y-2.5">
            <div className="flex items-start gap-2.5 rounded-lg bg-blue-50 p-3">
              <ShieldCheck className="mt-0.5 h-4 w-4 flex-shrink-0 text-blue-500" />
              <p className="text-xs text-blue-700">
                <strong>Confidentialité</strong> — Vos réponses sont traitées de manière confidentielle et servent uniquement à améliorer votre expérience.
              </p>
            </div>
            <div className="flex items-start gap-2.5 rounded-lg bg-amber-50 p-3">
              <Bot className="mt-0.5 h-4 w-4 flex-shrink-0 text-amber-600" />
              <p className="text-xs text-amber-800">
                <strong>Intelligence artificielle</strong> — Cet échange est mené par une IA. Il n&apos;y a pas de bonne ou de mauvaise réponse : exprimez-vous librement.
              </p>
            </div>
            <div className="flex items-start gap-2.5 rounded-lg bg-gray-50 p-3">
              <Info className="mt-0.5 h-4 w-4 flex-shrink-0 text-gray-500" />
              <p className="text-xs text-gray-600">
                Vous pouvez <strong>interrompre et reprendre</strong> à tout moment. Comptez environ {interview.maxQuestions > 15 ? "15–20" : "5–10"} minutes.
              </p>
            </div>
          </div>

          <div className="mb-4">
            <label className="mb-1.5 block text-sm font-medium">Votre prénom</label>
            <input
              type="text"
              value={participantName}
              onChange={(e) => setParticipantName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && startSession()}
              placeholder="Prénom"
              className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm focus:border-coral focus:outline-none focus:ring-1 focus:ring-coral"
              autoFocus
            />
          </div>
          <button
            onClick={startSession}
            disabled={!participantName.trim()}
            className="w-full rounded-full bg-coral py-2.5 text-sm font-semibold text-white hover:bg-coral-dark disabled:opacity-50"
          >
            Commencer l&apos;interview
          </button>
        </div>
      </div>
    );
  }

  // Completed state
  if (completed && !streaming) {
    return (
      <div className="flex min-h-screen flex-col bg-gray-50">
        <div className="border-b border-gray-200 bg-white px-4 py-3">
          <h1 className="text-center text-sm font-medium">{interview.title}</h1>
        </div>
        <div className="flex flex-1 flex-col items-center justify-center p-4">
          <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-8 text-center shadow-sm">
            <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
              <span className="text-xl">✓</span>
            </div>
            <h2 className="mb-2 text-lg font-semibold">Merci pour vos réponses !</h2>
            <p className="mb-4 text-sm text-gray-600">
              Votre interview a bien été enregistrée. Une analyse sera générée automatiquement par l&apos;IA à partir de vos réponses.
            </p>
            <div className="mb-6 rounded-lg bg-blue-50 p-3">
              <p className="text-xs text-blue-700">
                <ShieldCheck className="mb-0.5 mr-1 inline h-3.5 w-3.5" />
                Vos réponses sont traitées de manière confidentielle et ne sont accessibles qu&apos;aux personnes habilitées.
              </p>
            </div>
            <button
              onClick={() => window.close()}
              className="w-full rounded-full bg-coral py-2.5 text-sm font-semibold text-white hover:bg-coral-dark"
            >
              Fermer cette page
            </button>
            <p className="mt-3 text-[11px] text-gray-400">Vous pouvez fermer cet onglet en toute sécurité.</p>
          </div>
        </div>
      </div>
    );
  }

  // Chat interface
  return (
    <div className="flex h-dvh flex-col bg-gray-50">
      {/* Header */}
      <div className="border-b border-gray-200 bg-white">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-coral/10">
              <Bot className="h-3.5 w-3.5 text-coral" />
            </div>
            <div>
              <h1 className="text-sm font-medium leading-tight">{interview.title}</h1>
              <p className="text-[10px] text-gray-400">Interview menée par IA</p>
            </div>
          </div>
          <button
            onClick={handleComplete}
            disabled={completing || messages.length < 4}
            className="flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-40"
          >
            {completing ? <Loader2 className="h-3 w-3 animate-spin" /> : <LogOut className="h-3 w-3" />}
            Terminer
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-6">
        <div className="mx-auto max-w-2xl space-y-4">
          {messages.map((msg, i) => (
            <div
              key={i}
              className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              {msg.role === "assistant" && (
                <div className="mr-2 mt-1 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-coral/10">
                  <Bot className="h-3.5 w-3.5 text-coral" />
                </div>
              )}
              <div className="max-w-[75%]">
                {msg.role === "assistant" && i === 0 && (
                  <span className="mb-1 block text-[10px] font-medium text-gray-400">Assistant IA</span>
                )}
                <div
                  className={`rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                    msg.role === "user"
                      ? "bg-coral text-white"
                      : "bg-white border border-gray-200 text-gray-800"
                  }`}
                >
                  {msg.content || (
                    <span className="flex items-center gap-1.5 text-gray-400">
                      <Loader2 className="h-3 w-3 animate-spin" />
                      <span className="text-xs">L&apos;IA rédige sa réponse...</span>
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input / Complete CTA */}
      <div className="border-t border-gray-200 bg-white px-4 pb-[calc(0.75rem+env(safe-area-inset-bottom,0px))] pt-3">
        <div className="mx-auto max-w-2xl">
          {readyToComplete ? (
            <div className="py-2 text-center">
              <p className="mb-3 text-xs text-gray-500">L&apos;interview est terminée. Merci pour vos réponses.</p>
              <button
                onClick={handleComplete}
                disabled={completing}
                className="inline-flex items-center gap-2 rounded-full bg-coral px-8 py-3 text-sm font-semibold text-white shadow-sm hover:bg-coral-dark disabled:opacity-50"
              >
                {completing ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogOut className="h-4 w-4" />}
                Terminer l&apos;interview
              </button>
            </div>
          ) : (
            <>
              <p className="mb-2 text-center text-[10px] text-gray-400">
                Cet échange est mené par une intelligence artificielle. Vos réponses sont confidentielles.
              </p>
              <div className="flex items-end gap-2">
                <div className="relative flex-1">
                  <div
                    aria-hidden="true"
                    className="invisible min-h-[44px] max-h-[40dvh] whitespace-pre-wrap break-words rounded-xl border border-gray-200 px-4 py-3 text-sm leading-relaxed"
                  >{input || "X"}&nbsp;</div>
                  <textarea
                    ref={inputRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    onFocus={scrollToBottom}
                    placeholder="Votre réponse..."
                    disabled={streaming}
                    className="absolute inset-0 resize-none overflow-hidden rounded-xl border border-gray-200 px-4 py-3 text-sm leading-relaxed focus:border-coral focus:outline-none focus:ring-1 focus:ring-coral disabled:opacity-50"
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
            </>
          )}
        </div>
      </div>
    </div>
  );
}
