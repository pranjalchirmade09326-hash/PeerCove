/**
 * MemberQueue — Domain Entity & State Machine for Peer Support Matching Queue.
 *
 * Layer: modules / client / mindspace / member / domain / entities
 */

export const VALID_TOPICS = [
  "anxiety",
  "stress",
  "sleep",
  "relationships",
  "grief",
  "general",
] as const;

export type SupportTopic = (typeof VALID_TOPICS)[number];
export type SupportChannel = "chat" | "voice" | "video";

export interface MemberMatchRequestPayload {
  support_topic: string;
  preferred_channel?: string;
  channel?: string;
  preferred_languages?: string[];
  languages?: string[];
  consent_share_intake?: boolean;
  intake_summary?: string;
  notes?: string;
}

export interface MemberMatchRequestResponse {
  id: string;
  member_id?: string;
  request_state: QueueState;
  status?: string;
  support_topic?: string;
  preferred_channel?: string;
  preferred_languages?: string[];
  notes?: string;
  created_at?: string;
  conversation_id?: string | null;
  listener?: {
    id: string;
    display_name?: string;
    name?: string;
    rating?: number;
    avatar?: string;
    specialty?: string;
  } | null;
  source?: string;
}

export function validateTopic(topic: unknown): {
  valid: boolean;
  normalized?: SupportTopic;
  error?: string;
} {
  if (typeof topic !== "string") {
    return { valid: false, error: "Topic must be a string" };
  }
  const normalized = topic.trim().toLowerCase();
  if (!normalized) {
    return { valid: false, error: "Topic cannot be empty" };
  }
  if (normalized.length > 50) {
    return { valid: false, error: "Topic exceeds maximum length of 50 characters" };
  }
  if (!VALID_TOPICS.includes(normalized as SupportTopic)) {
    return {
      valid: false,
      error: `Invalid topic '${topic}'. Allowed: ${VALID_TOPICS.join(", ")}`,
    };
  }
  return { valid: true, normalized: normalized as SupportTopic };
}

export function validateChannel(channel: unknown): {
  valid: boolean;
  normalized: SupportChannel;
  error?: string;
} {
  if (!channel || channel === "") {
    return { valid: true, normalized: "chat" }; // Default fallback
  }
  if (typeof channel !== "string") {
    return { valid: false, normalized: "chat", error: "Channel must be a string" };
  }
  const normalized = channel.trim().toLowerCase();
  if (["chat", "voice", "video"].includes(normalized)) {
    return { valid: true, normalized: normalized as SupportChannel };
  }
  return {
    valid: false,
    normalized: "chat",
    error: `Unsupported channel '${channel}'. Allowed: chat, voice, video`,
  };
}

export function validateLanguages(languages: unknown): string[] {
  if (!Array.isArray(languages) || languages.length === 0) {
    return ["en"];
  }
  const cleaned = languages
    .filter((l): l is string => typeof l === "string" && l.trim().length > 0)
    .map((l) => l.trim().toLowerCase());
  const unique = Array.from(new Set(cleaned));
  return unique.length > 0 ? unique : ["en"];
}

export function sanitizeNotes(notes?: string, maxLength = 2000): string {
  if (!notes) return "";
  const sanitized = notes.replace(/<[^>]*>?/gm, "").trim();
  return sanitized.slice(0, maxLength);
}

// Queue State Machine Implementation
export type QueueState =
  | "idle"
  | "queued"
  | "matching"
  | "matched"
  | "cancelled"
  | "timeout";

export class MemberQueueStateMachine {
  private state: QueueState = "idle";
  private queuedAt: number = 0;
  private matchedListener: { id: string; name: string; rating: number } | null = null;
  private conversationId: string | null = null;

  constructor(initialState: QueueState = "idle") {
    this.state = initialState;
    if (initialState === "queued") {
      this.queuedAt = Date.now();
    }
  }

  public getState(): QueueState {
    return this.state;
  }

  public getElapsedMinutes(currentTime = Date.now()): number {
    if (this.state === "idle" || this.queuedAt === 0) return 0;
    const diffMs = Math.max(0, currentTime - this.queuedAt);
    return Math.floor(diffMs / 60000);
  }

  public getElapsedSeconds(currentTime = Date.now()): number {
    if (this.state === "idle" || this.queuedAt === 0) return 0;
    const diffMs = Math.max(0, currentTime - this.queuedAt);
    return Math.floor(diffMs / 1000);
  }

  public queue(now = Date.now()): void {
    if (
      this.state !== "idle" &&
      this.state !== "cancelled" &&
      this.state !== "timeout"
    ) {
      throw new Error(`Cannot queue from active state: ${this.state}`);
    }
    this.state = "queued";
    this.queuedAt = now;
    this.matchedListener = null;
    this.conversationId = null;
  }

  public advanceToMatching(): void {
    if (this.state !== "queued") {
      throw new Error(`Cannot transition to matching from ${this.state}`);
    }
    this.state = "matching";
  }

  public match(
    listener: { id: string; name: string; rating: number },
    convId: string
  ): void {
    if (this.state !== "queued" && this.state !== "matching") {
      throw new Error(`Cannot match from state: ${this.state}`);
    }
    this.state = "matched";
    this.matchedListener = listener;
    this.conversationId = convId;
  }

  public cancel(reason = "member_withdrew"): {
    success: boolean;
    state: QueueState;
    reason: string;
  } {
    if (this.state === "matched") {
      throw new Error("Cannot cancel an already matched request");
    }
    if (this.state === "cancelled") {
      return { success: true, state: "cancelled", reason: "already_cancelled" };
    }
    this.state = "cancelled";
    return { success: true, state: "cancelled", reason };
  }

  public checkTimeout(maxWaitMinutes = 15, currentTime = Date.now()): boolean {
    if (this.state === "queued" || this.state === "matching") {
      if (this.getElapsedMinutes(currentTime) >= maxWaitMinutes) {
        this.state = "timeout";
        return true;
      }
    }
    return false;
  }

  public getMatchedInfo() {
    return {
      listener: this.matchedListener,
      conversationId: this.conversationId,
    };
  }
}

// ── Somatic 4-7-8 Breathwork Pacer ──
export type BreathPhase = "Inhale" | "Hold" | "Exhale";

export class BreathworkPacer {
  private isActive: boolean = false;
  private phase: BreathPhase = "Inhale";
  private secondsRemaining: number = 4;
  private completedCycles: number = 0;

  constructor(startActive = false) {
    if (startActive) {
      this.start();
    }
  }

  public start(): void {
    this.isActive = true;
    this.phase = "Inhale";
    this.secondsRemaining = 4;
  }

  public pause(): void {
    this.isActive = false;
  }

  public resume(): void {
    this.isActive = true;
  }

  public toggle(): boolean {
    this.isActive = !this.isActive;
    return this.isActive;
  }

  public reset(): void {
    this.isActive = false;
    this.phase = "Inhale";
    this.secondsRemaining = 4;
    this.completedCycles = 0;
  }

  public getStatus() {
    return {
      isActive: this.isActive,
      phase: this.phase,
      secondsRemaining: this.secondsRemaining,
      completedCycles: this.completedCycles,
    };
  }

  public tick(): void {
    if (!this.isActive) return;

    if (this.secondsRemaining > 1) {
      this.secondsRemaining -= 1;
    } else {
      if (this.phase === "Inhale") {
        this.phase = "Hold";
        this.secondsRemaining = 7;
      } else if (this.phase === "Hold") {
        this.phase = "Exhale";
        this.secondsRemaining = 8;
      } else if (this.phase === "Exhale") {
        this.phase = "Inhale";
        this.secondsRemaining = 4;
        this.completedCycles += 1;
      }
    }
  }
}
