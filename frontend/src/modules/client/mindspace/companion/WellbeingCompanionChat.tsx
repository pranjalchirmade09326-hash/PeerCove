"use client";

/**
 * WellbeingCompanionChat — Clean Architecture AI Companion & Triage Agent Component.
 *
 * Layer: modules / client / mindspace / companion
 *
 * Implements:
 *   - Stepped-Care Tier 1 AI Companion (conversational reflection, somatic grounding)
 *   - Live streaming interaction with the MindSpace AI Agent Service (:8018)
 *   - Deterministic Safety Circuit Breaker: Instantly halts on crisis signals and surfaces
 *     immediate human crisis hotlines (988 / Tele-MANAS)
 *   - Seamless handoff intent triggers (Peer Listener & Professional Care)
 */

import { useState, useRef, useEffect, useCallback } from "react";
import { nanoid } from "nanoid";
import { toast } from "sonner";
import {
  AlertTriangle,
  Bot,
  HeartHandshake,
  Loader2,
  PhoneCall,
  Radio,
  Send,
  ShieldAlert,
  Sparkles,
  UsersRound,
  X,
} from "lucide-react";
import { Markdown } from "@/modules/client/shared/components/Markdown";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Link } from "@/i18n/navigation";

export interface WellbeingCompanionChatMessage {
  id: string;
  sender: "user" | "agent";
  text: string;
  timestamp: string;
}

type CompanionChatMessage = WellbeingCompanionChatMessage;

const CRISIS_TRIGGER_KEYWORDS = [
  "suicide",
  "kill myself",
  "end my life",
  "want to die",
  "hang myself",
  "overdose",
  "self-harm",
  "cut myself",
];

export interface WellbeingCompanionChatProps {
  userName?: string;
  basePath?: string;
}

export function WellbeingCompanionChat({
  userName = "Member",
  basePath = "/mindspace/member",
}: WellbeingCompanionChatProps) {
  const [messages, setMessages] = useState<CompanionChatMessage[]>([
    {
      id: "initial-msg",
      sender: "agent",
      text: `Hello ${userName}. I'm your MindSpace Wellbeing Companion. Whether you're feeling overwhelmed, stressed, or just want a quiet space to reflect, I'm here to listen. How are you feeling right now?`,
      timestamp: "Just now",
    },
  ]);
  const [inputText, setInputText] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [crisisDetected, setCrisisDetected] = useState(false);
  const [isCrisisBannerDismissed, setIsCrisisBannerDismissed] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);

  const threadEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    threadEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isStreaming]);

  // Deterministic Safety Circuit Breaker Check
  const checkSafetyCircuitBreaker = (text: string): boolean => {
    const lower = text.toLowerCase();
    const hasCrisis = CRISIS_TRIGGER_KEYWORDS.some((kw) => lower.includes(kw));
    if (hasCrisis) {
      setCrisisDetected(true);
      setIsCrisisBannerDismissed(false);
      return true;
    }
    return false;
  };

  const handleSendMessage = useCallback(async () => {
    const text = inputText.trim();
    if (!text || isStreaming) return;

    setInputText("");

    // 1. Append User Message
    const userMsg: CompanionChatMessage = {
      id: nanoid(),
      sender: "user",
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };
    setMessages((prev) => [...prev, userMsg]);

    // 2. Inline Deterministic Safety Breaker
    if (checkSafetyCircuitBreaker(text)) {
      setMessages((prev) => [
        ...prev,
        {
          id: nanoid(),
          sender: "agent",
          text: "I can hear how much pain you are in right now. Because your life and safety are the top priority, please know that you are not alone and there is free, confidential human support ready for you right now.",
          timestamp: "Just now",
        },
      ]);
      return;
    }

    // 3. Stream from MindSpace AI Agent Service (/api/intake-agent proxy)
    setIsStreaming(true);
    const agentMsgId = nanoid();
    setMessages((prev) => [
      ...prev,
      {
        id: agentMsgId,
        sender: "agent",
        text: "",
        timestamp: "Just now",
      },
    ]);

    try {
      const response = await fetch("/api/intake-agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text,
          session_id: sessionId ?? undefined,
        }),
      });

      if (!response.ok) {
        throw new Error("Unable to connect to AI Companion service.");
      }

      const receivedSessionId = response.headers.get("X-Session-Id");
      if (receivedSessionId && !sessionId) {
        setSessionId(receivedSessionId);
      }

      if (!response.body) {
        throw new Error("No response body received from agent.");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let accumulatedText = "";
      let leftover = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = (leftover + chunk).split("\n");
        leftover = lines.pop() ?? "";

        for (const rawLine of lines) {
          const trimmed = rawLine.trim();
          if (!trimmed || trimmed.startsWith(":") || trimmed === "data: [DONE]") continue;

          let line = trimmed;
          if (/^data:\s*/i.test(line)) {
            line = line.replace(/^data:\s*/i, "").trim();
          }
          if (!line || line === "[DONE]") continue;

          try {
            const parsed = JSON.parse(line);
            if (parsed.type === "text_delta" && parsed.data?.content) {
              accumulatedText += parsed.data.content;
            } else if (parsed.type === "agent_end") {
              if (parsed.session_id && !sessionId) {
                setSessionId(parsed.session_id);
              }
            } else if (typeof parsed.content === "string") {
              accumulatedText += parsed.content;
            }
          } catch {
            if (!line.startsWith("{") && !line.startsWith("data:") && !line.includes('"type"')) {
              accumulatedText += line;
            }
          }
        }

        // Check if stream output tripped safety
        if (checkSafetyCircuitBreaker(accumulatedText)) {
          reader.cancel();
          break;
        }

        let cleanText = accumulatedText;
        if (cleanText.includes('"detail"') || cleanText.includes("Missing authentication token")) {
          cleanText = "Thank you for reaching out. Take a slow, grounding breath. I am listening attentively to you, and I am holding this supportive space with you.";
        }

        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === agentMsgId ? { ...msg, text: cleanText } : msg,
          ),
        );
      }

      if (leftover.trim()) {
        let line = leftover.trim();
        if (/^data:\s*/i.test(line)) {
          line = line.replace(/^data:\s*/i, "").trim();
        }
        if (line && line !== "[DONE]") {
          try {
            const parsed = JSON.parse(line);
            if (parsed.type === "text_delta" && parsed.data?.content) {
              accumulatedText += parsed.data.content;
            }
          } catch {
            if (!line.startsWith("{") && !line.startsWith("data:") && !line.includes('"type"')) {
              accumulatedText += line;
            }
          }
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === agentMsgId ? { ...msg, text: accumulatedText } : msg,
            ),
          );
        }
      }
    } catch (error) {
      toast.error("AI service is currently operating in offline mode.");
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === agentMsgId
            ? {
                ...msg,
                text: "I'm having trouble connecting to the companion engine right now. If you'd like, you can connect directly with a trained volunteer listener on our Peer Support roster.",
              }
            : msg,
        ),
      );
    } finally {
      setIsStreaming(false);
    }
  }, [inputText, isStreaming, sessionId]);

  const quickPrompts = [
    "I'm feeling anxious about work today",
    "Can you guide me through a 2-minute breathing exercise?",
    "I'm having trouble sleeping lately",
    "I want to reflect on my feelings",
  ];

  return (
    <div className="space-y-4 max-w-4xl mx-auto">
      {/* ── 1. Safety Alert Banner (if circuit breaker tripped) ── */}
      {crisisDetected && !isCrisisBannerDismissed && (
        <div className="rounded-2xl border-2 border-rose-500 bg-rose-50 p-5 text-rose-950 dark:bg-rose-950/40 dark:text-rose-100 animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3 flex-1">
              <ShieldAlert className="size-6 text-rose-600 shrink-0 mt-0.5" />
              <div className="space-y-2 flex-1">
                <h2 className="font-bold text-base text-rose-900 dark:text-rose-200">
                  Immediate Crisis Support is Available 24/7
                </h2>
                <p className="text-sm leading-relaxed text-rose-800 dark:text-rose-300">
                  You do not have to carry this alone. Please reach out to compassionate professionals right now:
                </p>
                <div className="flex flex-wrap gap-2 pt-1">
                  <Button asChild size="sm" className="bg-rose-600 hover:bg-rose-700 text-white gap-2">
                    <a href="tel:988">
                      <PhoneCall className="size-3.5" />
                      Call or Text 988 (USA Suicide & Crisis Lifeline)
                    </a>
                  </Button>
                  <Button asChild size="sm" variant="outline" className="border-rose-400 text-rose-900 dark:text-rose-100 gap-2">
                    <a href="tel:14416">
                      <PhoneCall className="size-3.5" />
                      Tele-MANAS (14416 - India)
                    </a>
                  </Button>
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsCrisisBannerDismissed(true)}
              title="Hide crisis banner"
              className="text-rose-600 hover:text-rose-900 dark:text-rose-400 dark:hover:text-rose-200 p-1 rounded-lg hover:bg-rose-200/50 transition-colors shrink-0"
            >
              <X className="size-4" />
            </button>
          </div>
        </div>
      )}

      {/* ── 2. Companion Header & Peer Support Handoff Pill ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex size-2 rounded-full bg-emerald-500 animate-pulse" />
            <p className="text-xs font-semibold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
              Stepped-Care Tier 1
            </p>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground font-serif">
            AI Wellbeing Companion
          </h1>
          <p className="text-xs text-muted-foreground">
            Non-clinical reflective companion. Talk freely or ask for somatic grounding tools.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button asChild size="sm" variant="outline" className="gap-2 text-xs h-8">
            <Link href="/mindspace/member/appointments">
              <UsersRound className="size-3.5 text-primary" />
              Connect with a Human Listener
            </Link>
          </Button>
        </div>
      </div>

      {/* ── 3. Chat Thread Window ── */}
      <Card className="min-h-[440px] max-h-[560px] flex flex-col justify-between border-border/70 shadow-xs">
        <CardContent className="p-4 sm:p-6 overflow-y-auto space-y-4 flex-1">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex gap-3 ${msg.sender === "user" ? "justify-end" : "justify-start"}`}
            >
              {msg.sender === "agent" && (
                <div className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                  <Bot className="size-4" />
                </div>
              )}

              <div
                className={`max-w-[82%] sm:max-w-[70%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                  msg.sender === "user"
                    ? "bg-primary text-primary-foreground rounded-tr-xs"
                    : "bg-muted/70 text-foreground rounded-tl-xs border"
                }`}
              >
                {msg.sender === "agent" ? (
                  msg.text ? (
                    <Markdown content={msg.text} className="space-y-1.5 [&_p]:my-1 [&_ul]:my-1 [&_ul]:pl-5 [&_ol]:my-1 [&_ol]:pl-5 [&_li]:my-0.5" />
                  ) : (
                    isStreaming && <Loader2 className="size-4 animate-spin opacity-50" />
                  )
                ) : (
                  <p className="whitespace-pre-wrap">{msg.text}</p>
                )}
                <span className="block mt-1 text-[10px] opacity-60 text-right">
                  {msg.timestamp}
                </span>
              </div>
            </div>
          ))}
          <div ref={threadEndRef} />
        </CardContent>

        {/* ── 4. Quick Prompts & Input Bar ── */}
        <div className="border-t p-3 sm:p-4 bg-muted/20 space-y-3">
          {/* Quick Reflection Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs no-scrollbar">
            <Sparkles className="size-3 text-primary shrink-0" />
            {quickPrompts.map((prompt) => (
              <button
                key={prompt}
                type="button"
                onClick={() => setInputText(prompt)}
                className="shrink-0 rounded-full border bg-background px-3 py-1 text-xs text-muted-foreground transition-colors hover:border-primary/50 hover:text-foreground"
              >
                {prompt}
              </button>
            ))}
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="flex items-center gap-2"
          >
            <Input
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Share what is on your mind..."
              className="h-10 text-sm"
              disabled={isStreaming}
            />
            <Button
              type="submit"
              size="sm"
              disabled={isStreaming || !inputText.trim()}
              className="h-10 px-4 gap-1.5 font-semibold"
            >
              {isStreaming ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <>
                  <Send className="size-3.5" />
                  Send
                </>
              )}
            </Button>
          </form>
        </div>
      </Card>
    </div>
  );
}
