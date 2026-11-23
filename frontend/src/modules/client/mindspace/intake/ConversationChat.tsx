/**
 * ConversationChat — shared message thread UI for text and voice intake.
 *
 * Layer: client / mindspace / intake
 *
 * Renders committed messages plus an optional live-streaming transcript bubble
 * below them. Auto-scrolls to the bottom as new content arrives. Self-contained
 * (no external chat-primitive dependencies) so the intake flow stays portable.
 *
 * Used by: TextIntake (streaming text), VoiceIntakeTest (voice transcript events).
 */

"use client";

import { useEffect, useRef } from "react";
import { Bot, MessageSquareIcon } from "lucide-react";
import { Markdown } from "@/modules/client/shared/components/Markdown";

// ── Types ─────────────────────────────────────────────────────────────────────

/** A committed message in the conversation. */
export type ChatMessage = {
  /** Stable unique key for React reconciliation. */
  key: string;
  /** Speaker identity. */
  from: "user" | "assistant";
  /** Full text content of the committed message. */
  content: string;
};

// ── Sub-components ────────────────────────────────────────────────────────────

/** Animated typing-dot indicator shown while waiting for the first token. */
const TypingIndicator = () => (
  <div className="flex gap-2 items-center">
    <div className="bg-secondary w-fit rounded-full p-2">
      <Bot className="size-6" />
    </div>
    <div className="flex items-center gap-1 px-3 py-2 rounded-2xl bg-secondary">
      <span className="size-2 rounded-full bg-muted-foreground/60 animate-bounce [animation-delay:0ms]" />
      <span className="size-2 rounded-full bg-muted-foreground/60 animate-bounce [animation-delay:150ms]" />
      <span className="size-2 rounded-full bg-muted-foreground/60 animate-bounce [animation-delay:300ms]" />
    </div>
  </div>
);

/** One bubble row — avatar + content, aligned left (assistant) or right (user). */
function Bubble({
  from,
  userName,
  children,
}: {
  from: "user" | "assistant";
  userName: string;
  children: React.ReactNode;
}) {
  const isUser = from === "user";
  return (
    <div className={`flex gap-2 items-start ${isUser ? "flex-row-reverse" : ""}`}>
      {isUser ? (
        <div className="bg-primary/50 flex size-9 shrink-0 items-center justify-center rounded-full text-sm font-bold text-primary-foreground">
          {userName?.[0] ?? "Y"}
        </div>
      ) : (
        <div className="bg-secondary w-fit shrink-0 rounded-full p-2">
          <Bot className="size-6" />
        </div>
      )}
      <div
        className={`max-w-[80%] rounded-2xl px-4 py-2 text-sm ${
          isUser
            ? "bg-primary text-primary-foreground whitespace-pre-wrap"
            : "bg-secondary [&_p]:my-1.5 [&_ul]:my-1.5 [&_ul]:pl-5 [&_ol]:my-1.5 [&_ol]:pl-5 [&_li]:my-0.5"
        }`}
      >
        {children}
      </div>
    </div>
  );
}

// ── Component ─────────────────────────────────────────────────────────────────

interface ConversationChatProps {
  /** Committed messages — appended after each exchange is complete. */
  messages: ChatMessage[];
  /** Partial text being streamed right now (empty string = nothing live). */
  liveTranscript: string;
  /** Which role is currently speaking (determines bubble side for live text). */
  liveRole: "user" | "assistant" | null;
  /** First letter of the member's name — shown in the user avatar. */
  userName: string;
  /** Shows the typing-indicator dots while waiting for the first token. */
  isLoading?: boolean;
}

/**
 * Auto-scrolling conversation thread for intake sessions.
 *
 * @param messages - Settled exchange turns.
 * @param liveTranscript - Text currently being streamed; shown as a transient bubble.
 * @param liveRole - Speaker of the live transcript ("assistant" for AI).
 * @param userName - Member's display name (first letter used as avatar initial).
 * @param isLoading - Show typing dots while waiting for the first token.
 */
export function ConversationChat({
  messages,
  liveTranscript,
  liveRole,
  userName,
  isLoading,
}: ConversationChatProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const showTyping = isLoading && !liveTranscript;
  const isEmpty = messages.length === 0 && !liveTranscript && !showTyping;

  // Keep the newest content in view as messages stream in.
  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, liveTranscript, showTyping]);

  return (
    <div className="relative flex-1 overflow-hidden rounded-2xl border">
      <div ref={scrollRef} className="h-full overflow-y-auto p-4 space-y-4">
        {isEmpty ? (
          <div className="flex h-full flex-col items-center justify-center gap-2 text-muted-foreground">
            <MessageSquareIcon className="size-8" />
            <p className="text-sm font-medium">Start the conversation</p>
            <p className="text-xs">Messages will appear here as the conversation progresses.</p>
          </div>
        ) : (
          <>
            {messages.map((message) => (
              <Bubble key={message.key} from={message.from} userName={userName}>
                {message.from === "assistant" ? (
                  <Markdown content={message.content} />
                ) : (
                  message.content
                )}
              </Bubble>
            ))}

            {showTyping && (
              <div className="flex gap-2 items-center">
                <div className="bg-secondary w-fit rounded-full p-2">
                  <Bot className="size-6" />
                </div>
                <TypingIndicator />
              </div>
            )}

            {liveTranscript && liveRole && (
              <Bubble from={liveRole} userName={userName}>
                {liveRole === "assistant" ? (
                  <Markdown content={liveTranscript} />
                ) : (
                  liveTranscript
                )}
              </Bubble>
            )}
          </>
        )}
      </div>
    </div>
  );
}
