/**
 * TextIntake — patient-facing text chat intake component.
 *
 * Layer: client / telemedicine / patient / intake
 *
 * Flow:
 *  1. After explicit consent, the MindSpace intake record is created.
 *  2. Messages stream from /api/intake-agent token by token.
 *     The AI agent session id is obtained lazily from the first response
 *     (X-Session-Id header or agent_end chunk) and reused for subsequent turns.
 *  3. "End Chat" saves encrypted conversation turns to MindSpace and completes
 *     the intake before showing IntakeCompleteModal.
 *
 * UI mirrors mindspace TextIntake exactly: Bot-icon header with live
 * Online/Thinking status, ConversationChat thread, Input + Stop/Send + End Chat.
 */

"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { toast } from "sonner";
import { nanoid } from "nanoid";
import { Bot, Loader2, Send, Square } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { completeMindspaceIntakeAction } from "@/modules/server/presentation/actions/mindspace-intake.actions";
import { ConversationChat, type ChatMessage } from "./ConversationChat";
import { IntakeCompleteModal } from "./IntakeCompleteModal";

/** Props for TextIntake. */
interface TextIntakeProps {
  /** MindSpace UUID created after the member grants intake consent. */
  intakeId: string;
  /** Locale-prefixed base path for post-intake navigation. */
  basePath: string;
  /** Patient's display name — shown as avatar initial in the chat thread. */
  userName: string;
}

/**
 * Text-based patient intake chat.
 *
 * Streams AI responses from /api/intake-agent and persists the transcript in
 * MindSpace when the member completes the session.
 *
 * @param intakeId - MindSpace intake UUID created after consent.
 * @param basePath - Locale-prefixed base path (e.g. "/en/bezs/telemedicine/patient").
 * @param userName - Patient display name, used as avatar initial.
 */
export function TextIntake({
  intakeId,
  basePath,
  userName,
}: TextIntakeProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [liveTranscript, setLiveTranscript] = useState("");
  const [endingPhase, setEndingPhase] = useState<"idle" | "saving">("idle");
  const [showModal, setShowModal] = useState(false);

  // AI agent session id — null until the first response sets it
  const [sessionId, setSessionId] = useState<string | null>(null);

  const abortRef = useRef<AbortController | null>(null);
  const liveTextRef = useRef("");
  const inputRef = useRef<HTMLInputElement>(null);
  // Mirrors `messages` synchronously (updated every render, below) so
  // sendMessage can call endChat() directly the instant a status_end chunk
  // arrives — endChat reads this ref rather than `messages` so it always
  // sees the latest list, including a message committed moments earlier in
  // the same tick, without waiting on React's async state-update/re-render.
  const messagesRef = useRef<ChatMessage[]>([]);
  messagesRef.current = messages;

  // Re-focus the input whenever the AI finishes streaming so the patient
  // can type their next message without clicking the field manually.
  useEffect(() => {
    if (!isStreaming) inputRef.current?.focus();
  }, [isStreaming]);

  // ── Parse a single SSE/NDJSON chunk line — mirrors MVP parseChunkLine ─────
  const parseChunkLine = useCallback(
    (
      raw: string,
    ): {
      token: string | null;
      done: boolean;
      sessionId?: string;
      isCrisis?: boolean;
      activeTier?: number;
      errorMessage?: string;
      conversationEnded?: boolean;
    } => {
      const trimmed = raw.trim();
      if (!trimmed || trimmed.startsWith(":")) return { token: null, done: false };

      // Strip SSE "data:" prefix safely
      let line = trimmed;
      if (/^data:\s*/i.test(line)) {
        line = line.replace(/^data:\s*/i, "").trim();
      }

      if (!line || line === "[DONE]")
        return { token: null, done: line === "[DONE]" };
      if (
        trimmed.startsWith("event:") ||
        trimmed.startsWith("id:") ||
        trimmed.startsWith("retry:")
      )
        return { token: null, done: false };

      try {
        const parsed = JSON.parse(line);
        const { type, data } = parsed;
        if (type === "text_delta")
          return { token: data?.content ?? "", done: false };
        if (type === "agent_end")
          return {
            token: null,
            done: true,
            sessionId: parsed.session_id,
            isCrisis: Boolean(parsed.is_crisis),
            activeTier: typeof parsed.active_tier === "number" ? parsed.active_tier : undefined,
          };
        if (type === "error")
          return {
            token: null,
            done: true,
            errorMessage: parsed.error || parsed.message || "An unexpected error occurred.",
          };
        if (type === "text_complete") return { token: null, done: false };
        /*
         * status_end — the agent itself has decided the intake is over
         * (distinct from agent_end/done/finish below, which only close out
         * the current streaming turn). Matched on `type` alone — data.status/
         * data.agent vary by agent and aren't part of the contract, so they're
         * deliberately ignored. Tells sendMessage to auto-run the same "End
         * Chat" flow the patient would otherwise trigger manually.
         */
        if (type === "status_end")
          return { token: null, done: true, conversationEnded: true };
        if (["token", "message", "chunk", "stream", "text"].includes(type)) {
          const text =
            data?.content ??
            parsed.content ??
            parsed.text ??
            parsed.delta ??
            "";
          return { token: String(text), done: false };
        }
        if (["done", "end", "finish"].includes(type))
          return { token: null, done: true };
        if (Array.isArray(parsed.choices)) {
          const content = parsed.choices[0]?.delta?.content;
          if (content !== undefined)
            return { token: String(content), done: false };
          if (parsed.choices[0]?.finish_reason)
            return { token: null, done: true };
        }
        const flat = parsed.content ?? parsed.text ?? parsed.delta;
        if (typeof flat === "string") return { token: flat, done: false };
        if (typeof parsed === "string") return { token: parsed, done: false };
        return { token: null, done: false };
      } catch {
        // If line looks like JSON or SSE protocol metadata, never leak it into the chat bubble
        if (
          line.startsWith("{") ||
          line.startsWith("[") ||
          line.startsWith("data:") ||
          line.includes('"type"') ||
          line.includes('"text_delta"')
        ) {
          return { token: null, done: false };
        }
        return { token: line, done: false };
      }
    },
    [],
  );

  // ── Send a message and stream the response ────────────────────────────────
  // Plain function, not useCallback — it reads messagesRef (mutated during
  // render, see above) and calls endChat, neither of which React Compiler
  // can preserve manual memoization around; every other handler in this
  // file (endChat, cancelStream) is already a plain function for the same
  // reason, and sendMessage is only ever called locally, never passed to a
  // memoized child, so there's nothing to gain from wrapping it.
  const sendMessage = async (text: string) => {
    if (!text.trim() || isStreaming) return;

    const userMsg: ChatMessage = {
      key: nanoid(),
      from: "user",
      content: text,
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsStreaming(true);
    liveTextRef.current = "";
    setLiveTranscript("");
    // Set when parseChunkLine reports a status_end chunk anywhere in this
    // turn's stream — read in the finally block below to auto-run endChat.
    let conversationEndedThisTurn = false;

    const controller = new AbortController();
    abortRef.current = controller;

    // sessionId is null only before the very first response of a brand-new
    // session — that's the one turn we silently prepend the patient context
    // to, so the agent has name/age/contact up front instead of asking.
    const apiMessage = text;

    console.log(
      "[TextIntake] outgoing session_id (frontend):",
      sessionId ?? "null — no session yet, agent will create one",
    );

    try {
      const res = await fetch("/api/intake-agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // sessionId is null on the first message; the agent creates a new session
        body: JSON.stringify({ message: apiMessage, session_id: sessionId }),
        signal: controller.signal,
      });

      if (!res.ok) throw new Error(`Agent responded ${res.status}`);

      // Capture the session id from the response header on the first turn
      const headerSessionId = res.headers.get("X-Session-Id");
      if (headerSessionId) {
        console.log(
          "[TextIntake] session_id from agent (X-Session-Id header):",
          headerSessionId,
          "— frontend was holding:",
          sessionId,
        );
        setSessionId(headerSessionId);
      }

      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      let leftover = "";

      const appendToken = (token: string) => {
        liveTextRef.current += token;
        setLiveTranscript(liveTextRef.current);
      };

      outer: while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        const lines = (leftover + chunk).split("\n");
        leftover = lines.pop() ?? "";
        for (const line of lines) {
          if (!line.trim()) continue;
          const result = parseChunkLine(line);
          // Also capture session id and metadata from the agent_end chunk
          if (result.sessionId) {
            console.log(
              "[TextIntake] session_id from agent (agent_end chunk):",
              result.sessionId,
              "— frontend was holding:",
              sessionId,
            );
            setSessionId(result.sessionId);
          }
          if (result.isCrisis) {
            console.warn("[TextIntake] Crisis response received from agent.");
          }
          if (result.errorMessage) {
            toast.error(result.errorMessage);
          }
          if (result.token !== null) appendToken(result.token);
          if (result.conversationEnded) conversationEndedThisTurn = true;
          if (result.done) break outer;
        }
      }
      if (leftover.trim()) {
        const result = parseChunkLine(leftover);
        if (result.sessionId) {
          console.log(
            "[TextIntake] session_id from agent (trailing agent_end chunk):",
            result.sessionId,
            "— frontend was holding:",
            sessionId,
          );
          setSessionId(result.sessionId);
        }
        if (result.isCrisis) {
          console.warn("[TextIntake] Crisis response received from agent.");
        }
        if (result.errorMessage) {
          toast.error(result.errorMessage);
        }
        if (result.token !== null) appendToken(result.token);
        if (result.conversationEnded) conversationEndedThisTurn = true;
      }
    } catch (err: unknown) {
      if ((err as Error).name === "AbortError") {
        toast.info("Streaming cancelled.");
      } else {
        toast.error("Failed to get response. Please try again.");
      }
    } finally {
      // Commit live text to messages
      const finalText = liveTextRef.current;
      liveTextRef.current = "";
      setLiveTranscript("");
      if (finalText.trim()) {
        const assistantMsg: ChatMessage = {
          key: nanoid(),
          from: "assistant",
          content: finalText,
        };
        // Sync messagesRef synchronously, in the same tick — setMessages
        // alone wouldn't be visible to endChat (below) until the next
        // render, and endChat reads messagesRef.current specifically so
        // the real reply is always included in the report/save payloads,
        // whether endChat runs automatically right here or a moment
        // later from the doctor's own "End Chat" click.
        messagesRef.current = [...messagesRef.current, assistantMsg];
        setMessages((prev) => [...prev, assistantMsg]);
      }
      if (conversationEndedThisTurn) {
        // UI-only — deliberately NOT added to messagesRef, so this notice
        // never ends up in the report-generation or saved-conversation
        // payloads endChat builds from messagesRef.current. The manual
        // "End Chat" button is untouched by any of this — the patient can
        // still cut the conversation short at any point regardless of
        // whether the agent ever sends status_end.
        setMessages((prev) => [
          ...prev,
          {
            key: nanoid(),
            from: "assistant",
            content: "The conversation has ended.",
          },
        ]);
        endChat();
      }
      setIsStreaming(false);
      abortRef.current = null;
    }
  };
  const cancelStream = () => abortRef.current?.abort();

  // ── End chat: save transcript to MindSpace → show modal ───────────────────
  //
  // Reads messagesRef rather than `messages` — this can be triggered
  // automatically from within sendMessage's finally block the instant a
  // status_end chunk arrives (see there), in the same tick that the last
  // assistant reply is committed. messagesRef is updated synchronously
  // alongside that commit, so it's always current when this reads it,
  // whether triggered automatically or a moment later by the doctor's own
  // "End Chat" click.
  const endChat = async () => {
    if (isStreaming) cancelStream();
    if (messagesRef.current.length === 0) {
      toast.info("No conversation to save yet.");
      return;
    }

    try {
      setEndingPhase("saving");
      await completeMindspaceIntakeAction({
        intakeId,
        messages: messagesRef.current.map((message) => ({
          role: message.from === "user" ? "user" : "assistant",
          content: message.content,
        })),
      });
      setShowModal(true);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to save conversation.");
    } finally {
      setEndingPhase("idle");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <>
      <div className="flex flex-col gap-3 w-full overflow-hidden h-[calc(100dvh-132px)]">
        {/* ── Header ── */}
        <div className="flex items-center gap-3 px-4 py-3 rounded-2xl border bg-card shadow-sm">
          <div
            className={`bg-primary/10 rounded-full p-2 shrink-0 ${isStreaming ? "animate-pulse" : ""}`}
          >
            <Bot className="size-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm">Pre-Visit Intake Bot</p>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <span
              className={`size-2 rounded-full ${isStreaming ? "bg-amber-400 animate-pulse" : "bg-emerald-500"}`}
            />
            <span className="text-xs text-muted-foreground">
              {isStreaming ? "Thinking..." : "Online"}
            </span>
          </div>
        </div>

        {/* ── Conversation thread ── */}
        <ConversationChat
          messages={messages}
          liveTranscript={liveTranscript}
          liveRole={isStreaming ? "assistant" : null}
          isLoading={isStreaming && !liveTranscript}
          userName={userName}
        />

        {/* ── Input row ── */}
        <div className="flex gap-2 items-center">
          <Input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type your message..."
            disabled={isStreaming || endingPhase !== "idle"}
            className="flex-1"
          />

          {/* Stop / Send */}
          {isStreaming ? (
            <Button
              size="icon"
              variant="outline"
              onClick={cancelStream}
              title="Stop"
            >
              <Square className="size-4" />
            </Button>
          ) : (
            <Button
              size="icon"
              onClick={() => sendMessage(input)}
              disabled={!input.trim() || endingPhase !== "idle"}
            >
              <Send className="size-4" />
            </Button>
          )}

          {/* End Chat */}
          <Button
            size="sm"
            variant="destructive"
            onClick={endChat}
            disabled={
              endingPhase !== "idle" || (messages.length === 0 && !isStreaming)
            }
            className="px-4 rounded-2xl h-9"
          >
            {endingPhase === "saving" ? (
              <>
                <Loader2 className="animate-spin mr-1 size-3" />
                Saving...
              </>
            ) : (
              "End Chat"
            )}
          </Button>
        </div>
      </div>

      {/* Post-intake modal */}
      {showModal && (
        <IntakeCompleteModal
          open={showModal}
          intakeId={intakeId}
          basePath={basePath}
        />
      )}
    </>
  );
}
