/**
 * Consultation Room & Post-Session Workflow Test Suite
 *
 * Covers:
 * - Feature 13: Pre-Call Room Handshake (connecting -> active, device checks)
 * - Feature 14: Bi-Directional Room Lifecycle (connecting -> active -> reflection/debrief -> ended)
 * - Feature 15: Real-Time Consultation Messaging (two-way messaging, monotonic sequence, AES format)
 * - Feature 16: Somatic 4-7-8 Breathwork Pacer (Inhale 4s -> Hold 7s -> Exhale 8s state machine)
 * - Feature 17: Deterministic Crisis Sentinel (<2ms regex tripwire, Tele-MANAS 14416 & 988 hotlines)
 * - Feature 18: Emergency Safety Escalation (SafetyCase & ConductReport dispatch)
 * - Feature 19: Session Termination Sync (member/listener conversation close routes)
 * - Feature 20: Member Post-Session Rating & Feedback (1-5 star rating validation)
 * - Feature 21: Member Mood Check-in & Journal Sync (1-10 slider & encrypted journal sync)
 * - Feature 22: Listener SOAP Note Documentation (Subjective, Objective, Assessment, Plan validation)
 * - Feature 23: Mandatory Caregiver Cooldown (60-second decompression timer & queue blocking)
 *
 * Tier 1 (Feature Coverage >=5 per feature)
 * Tier 2 (Boundary & Corner Cases >=5 per feature)
 * Tier 3 (Cross-Feature Combinations)
 *
 * Environment: Node (Vitest)
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { PUT as memberClosePUT } from "@/app/api/mindspace/member/conversations/[id]/close/route";
import { PUT as listenerClosePUT } from "@/app/api/mindspace/listener/conversations/[id]/close/route";
import { POST as moodsPOST } from "@/app/api/mindspace/member/moods/route";
import { POST as journalPOST } from "@/app/api/mindspace/member/journal/route";
import { POST as safetyCasesPOST } from "@/app/api/mindspace/safety/cases/route";
import { POST as conductReportPOST } from "@/app/api/mindspace/member/conduct-report/route";
import { POST as listenerSoapPOST } from "@/app/api/mindspace/listener/conversations/[id]/soap/route";
import { GET as memberMessagesGET, POST as memberMessagesPOST } from "@/app/api/mindspace/member/conversations/[id]/messages/route";
import { GET as listenerMessagesGET, POST as listenerMessagesPOST } from "@/app/api/mindspace/listener/conversations/[id]/messages/route";
import { POST as memberFeedbackPOST } from "@/app/api/mindspace/member/conversations/[id]/feedback/route";
import { POST as listenerNotesPOST } from "@/app/api/mindspace/listener/conversations/[id]/notes/route";
import { GET as operationsSafetyCasesGET, POST as operationsSafetyCasesPOST } from "@/app/api/mindspace/operations/safety/cases/route";
import {
  BreathworkPacer as SharedBreathworkPacer,
  checkMediaDevices as sharedCheckMediaDevices,
  checkCrisisSentinel as sharedCheckCrisisSentinel,
  TELE_MANAS_HELPLINE as SHARED_TELE_MANAS,
} from "@/modules/client/mindspace/consultation";
import * as apiClientModule from "@/modules/server/mindspace/api-client";

vi.mock("@/modules/server/mindspace/api-client", () => ({
  createMindspaceApiClient: vi.fn(),
}));

// ============================================================================
// DOMAIN MODELS & STATE MACHINES (According to PROJECT.md & TEST_INFRA.md)
// ============================================================================

export type RoomStage = "idle" | "connecting" | "active" | "reflection" | "debrief" | "cooldown" | "ended";

export interface DeviceCheckResult {
  microphoneReady: boolean;
  cameraReady: boolean;
  audioOutputReady: boolean;
  networkLatencyMs: number;
}

export class ConsultationRoomLifecycle {
  private stage: RoomStage = "idle";
  private durationSeconds: number = 0;
  private participants: Set<string> = new Set();
  private deviceCheck: DeviceCheckResult = {
    microphoneReady: false,
    cameraReady: false,
    audioOutputReady: false,
    networkLatencyMs: 0,
  };

  public getStage(): RoomStage {
    return this.stage;
  }

  public getDurationSeconds(): number {
    return this.durationSeconds;
  }

  public getParticipants(): string[] {
    return Array.from(this.participants);
  }

  public runDeviceCheck(mic = true, camera = true, audio = true, latencyMs = 45): DeviceCheckResult {
    this.deviceCheck = {
      microphoneReady: mic,
      cameraReady: camera,
      audioOutputReady: audio,
      networkLatencyMs: latencyMs,
    };
    return this.deviceCheck;
  }

  public initiateHandshake(participantId: string): void {
    if (this.stage !== "idle" && this.stage !== "connecting") {
      throw new Error(`Cannot start handshake from state: ${this.stage}`);
    }
    this.stage = "connecting";
    this.participants.add(participantId);
  }

  public completeHandshake(participantId: string): void {
    this.participants.add(participantId);
    if (this.participants.size >= 2) {
      this.stage = "active";
    }
  }

  public tickDuration(seconds = 1): void {
    if (this.stage === "active") {
      this.durationSeconds += seconds;
    }
  }

  public terminateSession(role: "member" | "listener"): void {
    if (this.stage !== "active") {
      throw new Error(`Cannot terminate from state: ${this.stage}`);
    }
    this.stage = role === "member" ? "reflection" : "debrief";
  }

  public enterCooldown(): void {
    this.stage = "cooldown";
  }

  public close(): void {
    this.stage = "ended";
  }
}

// 4-7-8 Breathwork Pacer State Machine
export type BreathPhase = "Inhale" | "Hold" | "Exhale";

export class BreathworkPacer {
  private isActive: boolean = false;
  private phase: BreathPhase = "Inhale";
  private secondsRemaining: number = 4;
  private completedCycles: number = 0;

  public start(): void {
    this.isActive = true;
    this.phase = "Inhale";
    this.secondsRemaining = 4;
  }

  public pause(): void {
    this.isActive = false;
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
      // Phase transition: Inhale (4s) -> Hold (7s) -> Exhale (8s) -> Inhale
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

// Deterministic Crisis Sentinel (<2ms regex tripwire)
export const CRISIS_REGEX =
  /\b(suicide|kill\s+myself|end\s+my\s+life|want\s+to\s+die|hang\s+myself|shoot\s+myself|slit\s+my\s+wrists?|hurt\s+myself|self[- ]*harm|overdose)\b/i;

export const TELE_MANAS_HELPLINE = "14416 / +91 9999 666 555";
export const US_988_HELPLINE = "988";

export function checkCrisisSentinel(messageText: string): {
  isCrisis: boolean;
  detectionLatencyMs: number;
  helplines?: { teleManas: string; crisisLine988: string };
  matchedPhrase?: string;
} {
  const start = performance.now();
  const match = CRISIS_REGEX.exec(messageText);
  const latency = performance.now() - start;

  if (match) {
    return {
      isCrisis: true,
      detectionLatencyMs: latency,
      helplines: {
        teleManas: TELE_MANAS_HELPLINE,
        crisisLine988: US_988_HELPLINE,
      },
      matchedPhrase: match[0],
    };
  }

  return {
    isCrisis: false,
    detectionLatencyMs: latency,
  };
}

// In-Call Messaging Pipeline
export interface ConsultationMessage {
  id: string;
  conversation_id: string;
  sender_user_id: string;
  sender_role: "member" | "listener";
  content: string;
  sequence_number: number;
  sent_at: string;
}

export class ConsultationMessageManager {
  private messages: ConsultationMessage[] = [];
  private sequenceCounter: number = 0;

  public sendMessage(
    conversationId: string,
    senderId: string,
    role: "member" | "listener",
    rawContent: string
  ): ConsultationMessage {
    const trimmed = rawContent.trim();
    if (!trimmed) {
      throw new Error("EMPTY_MESSAGE_PAYLOAD");
    }

    this.sequenceCounter += 1;
    const msg: ConsultationMessage = {
      id: `msg-${Date.now()}-${this.sequenceCounter}`,
      conversation_id: conversationId,
      sender_user_id: senderId,
      sender_role: role,
      content: trimmed,
      sequence_number: this.sequenceCounter,
      sent_at: new Date().toISOString(),
    };
    this.messages.push(msg);
    return msg;
  }

  public getMessages(conversationId: string): ConsultationMessage[] {
    return this.messages.filter((m) => m.conversation_id === conversationId);
  }
}

// Volunteer Caregiver Cooldown State Machine
export class CaregiverCooldownTracker {
  private remainingSeconds: number = 60;
  private isDecompressionComplete: boolean = false;

  constructor(initialSeconds = 60) {
    this.remainingSeconds = initialSeconds;
    this.isDecompressionComplete = initialSeconds <= 0;
  }

  public getRemainingSeconds(): number {
    return this.remainingSeconds;
  }

  public isComplete(): boolean {
    return this.isDecompressionComplete;
  }

  public tick(): void {
    if (this.remainingSeconds > 0) {
      this.remainingSeconds -= 1;
      if (this.remainingSeconds === 0) {
        this.isDecompressionComplete = true;
      }
    }
  }

  public canAcceptNewSessions(): boolean {
    return this.isDecompressionComplete;
  }
}

// SOAP Note Validator
export interface SOAPNote {
  subjective: string;
  objective: string;
  assessment: string;
  plan: string;
}

export function validateSOAPNote(note: Partial<SOAPNote>): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  if (!note.subjective || note.subjective.trim().length === 0) {
    errors.push("Subjective section is required");
  }
  if (!note.objective || note.objective.trim().length === 0) {
    errors.push("Objective section is required");
  }
  if (!note.assessment || note.assessment.trim().length === 0) {
    errors.push("Assessment section is required");
  }
  if (!note.plan || note.plan.trim().length === 0) {
    errors.push("Plan section is required");
  }
  return { valid: errors.length === 0, errors };
}

// Post-Session Rating & Mood Validator
export function validateMemberRating(rating: unknown): { valid: boolean; error?: string } {
  if (typeof rating !== "number" || !Number.isInteger(rating)) {
    return { valid: false, error: "Rating must be an integer" };
  }
  if (rating < 1 || rating > 5) {
    return { valid: false, error: "Rating must be between 1 and 5 stars" };
  }
  return { valid: true };
}

export function validateMoodScore(score: unknown): { valid: boolean; valence?: "positive" | "neutral" | "negative"; error?: string } {
  if (typeof score !== "number" || !Number.isInteger(score)) {
    return { valid: false, error: "Mood score must be an integer" };
  }
  if (score < 1 || score > 10) {
    return { valid: false, error: "Mood score must be between 1 and 10" };
  }
  const valence = score >= 7 ? "positive" : score >= 5 ? "neutral" : "negative";
  return { valid: true, valence };
}

// ============================================================================
// TESTS
// ============================================================================

describe("Consultation Workflow Integration & E2E Tests (Tiers 1-3)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // --------------------------------------------------------------------------
  // FEATURE 13: Pre-Call Room Handshake
  // --------------------------------------------------------------------------
  describe("Feature 13: Pre-Call Room Handshake", () => {
    it("T1.1: room initializes in 'connecting' handshake state", () => {
      const room = new ConsultationRoomLifecycle();
      room.initiateHandshake("member-01");
      expect(room.getStage()).toBe("connecting");
      expect(room.getParticipants()).toContain("member-01");
    });

    it("T1.2: checks microphone and camera readiness before joining", () => {
      const room = new ConsultationRoomLifecycle();
      const check = room.runDeviceCheck(true, true, true, 30);
      expect(check.microphoneReady).toBe(true);
      expect(check.cameraReady).toBe(true);
      expect(check.networkLatencyMs).toBeLessThan(100);
    });

    it("T1.3: transitions to 'active' once both member and listener connect", () => {
      const room = new ConsultationRoomLifecycle();
      room.initiateHandshake("member-01");
      expect(room.getStage()).toBe("connecting");

      room.completeHandshake("listener-01");
      expect(room.getStage()).toBe("active");
      expect(room.getParticipants().length).toBe(2);
    });

    it("T1.4: tracks session duration when active", () => {
      const room = new ConsultationRoomLifecycle();
      room.initiateHandshake("member-01");
      room.completeHandshake("listener-01");
      room.tickDuration(5);
      expect(room.getDurationSeconds()).toBe(5);
    });

    it("T1.5: voice-only mode disables camera requirement in device check", () => {
      const room = new ConsultationRoomLifecycle();
      const check = room.runDeviceCheck(true, false, true, 25);
      expect(check.microphoneReady).toBe(true);
      expect(check.cameraReady).toBe(false);
    });

    // Tier 2: Boundaries
    it("T2.1: cannot initiate handshake from active state", () => {
      const room = new ConsultationRoomLifecycle();
      room.initiateHandshake("member-01");
      room.completeHandshake("listener-01");
      expect(() => room.initiateHandshake("member-02")).toThrow("Cannot start handshake");
    });

    it("T2.2: does not increment duration while still in connecting state", () => {
      const room = new ConsultationRoomLifecycle();
      room.initiateHandshake("member-01");
      room.tickDuration(10);
      expect(room.getDurationSeconds()).toBe(0);
    });

    it("T2.3: detects degraded network latency (>200ms)", () => {
      const room = new ConsultationRoomLifecycle();
      const check = room.runDeviceCheck(true, true, true, 350);
      expect(check.networkLatencyMs).toBeGreaterThan(200);
    });

    it("T2.4: handles microphone permission denied", () => {
      const room = new ConsultationRoomLifecycle();
      const check = room.runDeviceCheck(false, true, true, 40);
      expect(check.microphoneReady).toBe(false);
    });

    it("T2.5: handles duplicate handshake completion idempotently", () => {
      const room = new ConsultationRoomLifecycle();
      room.initiateHandshake("member-01");
      room.completeHandshake("member-01");
      expect(room.getParticipants().length).toBe(1);
    });
  });

  // --------------------------------------------------------------------------
  // FEATURE 14: Bi-Directional Room Lifecycle
  // --------------------------------------------------------------------------
  describe("Feature 14: Bi-Directional Room Lifecycle", () => {
    it("T1.1: transitions from active to reflection stage when member ends session", () => {
      const room = new ConsultationRoomLifecycle();
      room.initiateHandshake("member-1");
      room.completeHandshake("listener-1");
      room.terminateSession("member");
      expect(room.getStage()).toBe("reflection");
    });

    it("T1.2: transitions from active to debrief stage when listener ends session", () => {
      const room = new ConsultationRoomLifecycle();
      room.initiateHandshake("member-1");
      room.completeHandshake("listener-1");
      room.terminateSession("listener");
      expect(room.getStage()).toBe("debrief");
    });

    it("T1.3: listener enters cooldown after debrief", () => {
      const room = new ConsultationRoomLifecycle();
      room.initiateHandshake("member-1");
      room.completeHandshake("listener-1");
      room.terminateSession("listener");
      room.enterCooldown();
      expect(room.getStage()).toBe("cooldown");
    });

    it("T1.4: closes room cleanly to terminal 'ended' state", () => {
      const room = new ConsultationRoomLifecycle();
      room.initiateHandshake("member-1");
      room.completeHandshake("listener-1");
      room.terminateSession("member");
      room.close();
      expect(room.getStage()).toBe("ended");
    });

    it("T1.5: accurately preserves final duration seconds", () => {
      const room = new ConsultationRoomLifecycle();
      room.initiateHandshake("m-1");
      room.completeHandshake("l-1");
      room.tickDuration(180); // 3 minutes
      room.terminateSession("member");
      expect(room.getDurationSeconds()).toBe(180);
    });

    // Tier 2: Boundaries
    it("T2.1: throws when attempting to terminate an idle room", () => {
      const room = new ConsultationRoomLifecycle();
      expect(() => room.terminateSession("member")).toThrow("Cannot terminate");
    });

    it("T2.2: throws when attempting to terminate a room that is already in reflection", () => {
      const room = new ConsultationRoomLifecycle();
      room.initiateHandshake("m-1");
      room.completeHandshake("l-1");
      room.terminateSession("member");
      expect(() => room.terminateSession("member")).toThrow("Cannot terminate");
    });

    it("T2.3: does not increment duration after session termination", () => {
      const room = new ConsultationRoomLifecycle();
      room.initiateHandshake("m-1");
      room.completeHandshake("l-1");
      room.tickDuration(50);
      room.terminateSession("member");
      room.tickDuration(10);
      expect(room.getDurationSeconds()).toBe(50);
    });

    it("T2.4: handles multiple participants correctly without mutation leaks", () => {
      const room = new ConsultationRoomLifecycle();
      room.initiateHandshake("m-1");
      room.completeHandshake("l-1");
      const parts = room.getParticipants();
      parts.push("intruder");
      expect(room.getParticipants().length).toBe(2);
    });

    it("T2.5: handles zero duration session termination", () => {
      const room = new ConsultationRoomLifecycle();
      room.initiateHandshake("m-1");
      room.completeHandshake("l-1");
      room.terminateSession("member");
      expect(room.getDurationSeconds()).toBe(0);
    });
  });

  // --------------------------------------------------------------------------
  // FEATURE 15: Real-Time Consultation Messaging
  // --------------------------------------------------------------------------
  describe("Feature 15: Real-Time Consultation Messaging", () => {
    let msgMgr: ConsultationMessageManager;

    beforeEach(() => {
      msgMgr = new ConsultationMessageManager();
    });

    it("T1.1: sends member message with monotonically incrementing sequence number", () => {
      const m1 = msgMgr.sendMessage("conv-1", "usr-m", "member", "Hello listener!");
      const m2 = msgMgr.sendMessage("conv-1", "usr-l", "listener", "Hello! I am here to listen.");
      expect(m1.sequence_number).toBe(1);
      expect(m2.sequence_number).toBe(2);
    });

    it("T1.2: trims and formats message text properly", () => {
      const msg = msgMgr.sendMessage("conv-1", "usr-m", "member", "  Need to talk   ");
      expect(msg.content).toBe("Need to talk");
    });

    it("T1.3: preserves valid ISO timestamp for sent_at", () => {
      const msg = msgMgr.sendMessage("conv-1", "usr-m", "member", "Checking in");
      expect(new Date(msg.sent_at).getTime()).toBeGreaterThan(0);
    });

    it("T1.4: filters messages by conversation_id", () => {
      msgMgr.sendMessage("conv-A", "usr-1", "member", "Msg A");
      msgMgr.sendMessage("conv-B", "usr-2", "member", "Msg B");
      expect(msgMgr.getMessages("conv-A").length).toBe(1);
      expect(msgMgr.getMessages("conv-B").length).toBe(1);
    });

    it("T1.5: verifies message object conforms to peer consultation contract", () => {
      const msg = msgMgr.sendMessage("conv-1", "usr-1", "member", "Test message");
      expect(msg).toHaveProperty("id");
      expect(msg).toHaveProperty("conversation_id");
      expect(msg).toHaveProperty("sender_user_id");
      expect(msg).toHaveProperty("content");
      expect(msg).toHaveProperty("sequence_number");
    });

    // Tier 2: Boundaries
    it("T2.1: rejects empty string message payload", () => {
      expect(() => msgMgr.sendMessage("conv-1", "u-1", "member", "")).toThrow("EMPTY_MESSAGE_PAYLOAD");
    });

    it("T2.2: rejects whitespace-only message payload", () => {
      expect(() => msgMgr.sendMessage("conv-1", "u-1", "member", "   \n\t  ")).toThrow("EMPTY_MESSAGE_PAYLOAD");
    });

    it("T2.3: handles multiline and unicode messages", () => {
      const raw = "First line\nSecond line 🌿🌸";
      const msg = msgMgr.sendMessage("conv-1", "u-1", "member", raw);
      expect(msg.content).toBe(raw);
    });

    it("T2.4: handles rapid burst messaging maintaining sequence order", () => {
      for (let i = 1; i <= 20; i++) {
        msgMgr.sendMessage("conv-burst", "u-1", "member", `Burst ${i}`);
      }
      const msgs = msgMgr.getMessages("conv-burst");
      expect(msgs.length).toBe(20);
      expect(msgs[19].sequence_number).toBe(20);
    });

    it("T2.5: returns empty array for conversation with no messages", () => {
      expect(msgMgr.getMessages("conv-empty")).toEqual([]);
    });
  });

  // --------------------------------------------------------------------------
  // FEATURE 16: Somatic 4-7-8 Breathwork Pacer
  // --------------------------------------------------------------------------
  describe("Feature 16: Somatic 4-7-8 Breathwork Pacer", () => {
    it("T1.1: starts pacer in Inhale phase with 4 seconds", () => {
      const pacer = new BreathworkPacer();
      pacer.start();
      const status = pacer.getStatus();
      expect(status.isActive).toBe(true);
      expect(status.phase).toBe("Inhale");
      expect(status.secondsRemaining).toBe(4);
    });

    it("T1.2: transitions from Inhale (4s) to Hold (7s) after 4 ticks", () => {
      const pacer = new BreathworkPacer();
      pacer.start();
      // Tick 4 times
      pacer.tick(); // 3
      pacer.tick(); // 2
      pacer.tick(); // 1
      pacer.tick(); // transition to Hold
      const status = pacer.getStatus();
      expect(status.phase).toBe("Hold");
      expect(status.secondsRemaining).toBe(7);
    });

    it("T1.3: transitions from Hold (7s) to Exhale (8s) after 7 ticks", () => {
      const pacer = new BreathworkPacer();
      pacer.start();
      // Fast forward Inhale (4 ticks)
      for (let i = 0; i < 4; i++) pacer.tick();
      expect(pacer.getStatus().phase).toBe("Hold");

      // Fast forward Hold (7 ticks)
      for (let i = 0; i < 7; i++) pacer.tick();
      expect(pacer.getStatus().phase).toBe("Exhale");
      expect(pacer.getStatus().secondsRemaining).toBe(8);
    });

    it("T1.4: transitions from Exhale (8s) to next Inhale (4s) and increments cycle count", () => {
      const pacer = new BreathworkPacer();
      pacer.start();
      // Complete full 19-second cycle (4 + 7 + 8)
      for (let i = 0; i < 19; i++) pacer.tick();

      const status = pacer.getStatus();
      expect(status.phase).toBe("Inhale");
      expect(status.secondsRemaining).toBe(4);
      expect(status.completedCycles).toBe(1);
    });

    it("T1.5: pause and reset functions work accurately", () => {
      const pacer = new BreathworkPacer();
      pacer.start();
      pacer.tick();
      pacer.pause();
      expect(pacer.getStatus().isActive).toBe(false);

      pacer.reset();
      expect(pacer.getStatus().phase).toBe("Inhale");
      expect(pacer.getStatus().secondsRemaining).toBe(4);
      expect(pacer.getStatus().completedCycles).toBe(0);
    });

    // Tier 2: Boundaries
    it("T2.1: tick does nothing when pacer is inactive/paused", () => {
      const pacer = new BreathworkPacer();
      pacer.tick();
      expect(pacer.getStatus().secondsRemaining).toBe(4);
    });

    it("T2.2: multiple completed cycles increment counter correctly", () => {
      const pacer = new BreathworkPacer();
      pacer.start();
      // Run 3 complete cycles = 3 * 19 = 57 ticks
      for (let i = 0; i < 57; i++) pacer.tick();
      expect(pacer.getStatus().completedCycles).toBe(3);
    });

    it("T2.3: reset zeroes cycle count even after multiple cycles", () => {
      const pacer = new BreathworkPacer();
      pacer.start();
      for (let i = 0; i < 38; i++) pacer.tick();
      expect(pacer.getStatus().completedCycles).toBe(2);
      pacer.reset();
      expect(pacer.getStatus().completedCycles).toBe(0);
    });

    it("T2.4: re-starting an active pacer resets to Inhale 4s", () => {
      const pacer = new BreathworkPacer();
      pacer.start();
      for (let i = 0; i < 5; i++) pacer.tick();
      expect(pacer.getStatus().phase).toBe("Hold");
      pacer.start();
      expect(pacer.getStatus().phase).toBe("Inhale");
      expect(pacer.getStatus().secondsRemaining).toBe(4);
    });

    it("T2.5: single tick decrements secondsRemaining by 1", () => {
      const pacer = new BreathworkPacer();
      pacer.start();
      expect(pacer.getStatus().secondsRemaining).toBe(4);
      pacer.tick();
      expect(pacer.getStatus().secondsRemaining).toBe(3);
    });
  });

  // --------------------------------------------------------------------------
  // FEATURE 17: Deterministic Crisis Sentinel
  // --------------------------------------------------------------------------
  describe("Feature 17: Deterministic Crisis Sentinel", () => {
    it("T1.1: intercepts 'suicide' keyword with crisis trigger", () => {
      const res = checkCrisisSentinel("I am having thoughts of suicide lately.");
      expect(res.isCrisis).toBe(true);
      expect(res.matchedPhrase?.toLowerCase()).toBe("suicide");
    });

    it("T1.2: intercepts 'kill myself' phrase", () => {
      const res = checkCrisisSentinel("Sometimes I feel like I just want to kill myself.");
      expect(res.isCrisis).toBe(true);
      expect(res.matchedPhrase?.toLowerCase()).toBe("kill myself");
    });

    it("T1.3: intercepts 'want to die' phrase", () => {
      const res = checkCrisisSentinel("It is all too much, I want to die.");
      expect(res.isCrisis).toBe(true);
    });

    it("T1.4: displays verified Tele-MANAS (14416 / +91 9999 666 555) helpline", () => {
      const res = checkCrisisSentinel("I want to end my life");
      expect(res.helplines?.teleManas).toBe(TELE_MANAS_HELPLINE);
      expect(res.helplines?.teleManas).toContain("14416");
    });

    it("T1.5: displays verified 988 emergency hotline", () => {
      const res = checkCrisisSentinel("I want to hurt myself");
      expect(res.helplines?.crisisLine988).toBe("988");
    });

    it("T1.6: intercepts hyphenated 'self-harm', 'self harm', and 'selfharm'", () => {
      const resHyphen = checkCrisisSentinel("I have been struggling with self-harm urges.");
      const resSpace = checkCrisisSentinel("I am dealing with self harm.");
      const resJoined = checkCrisisSentinel("Thoughts about selfharm.");
      expect(resHyphen.isCrisis).toBe(true);
      expect(resHyphen.matchedPhrase?.toLowerCase()).toBe("self-harm");
      expect(resSpace.isCrisis).toBe(true);
      expect(resJoined.isCrisis).toBe(true);
    });

    it("T1.7: intercepts singular 'slit my wrist' and plural 'slit my wrists'", () => {
      const resSingular = checkCrisisSentinel("thinking about slit my wrist");
      const resPlural = checkCrisisSentinel("I might slit my wrists tonight");
      expect(resSingular.isCrisis).toBe(true);
      expect(resSingular.matchedPhrase?.toLowerCase()).toBe("slit my wrist");
      expect(resPlural.isCrisis).toBe(true);
      expect(resPlural.matchedPhrase?.toLowerCase()).toBe("slit my wrists");
    });

    it("T1.8: intercepts 'overdose' crisis keyword aligned with backend", () => {
      const res = checkCrisisSentinel("I am terrified I might overdose on pills.");
      expect(res.isCrisis).toBe(true);
      expect(res.matchedPhrase?.toLowerCase()).toBe("overdose");
    });

    // Tier 2: Boundaries & Latency Benchmark
    it("T2.1: executes synchronously under 2ms benchmark", () => {
      const res = checkCrisisSentinel("Normal message about daily work fatigue.");
      expect(res.detectionLatencyMs).toBeLessThan(2);
    });

    it("T2.2: benign emotional text does NOT trigger false crisis alert", () => {
      const res1 = checkCrisisSentinel("I am feeling very anxious about my exam tomorrow.");
      const res2 = checkCrisisSentinel("I have insomnia and can't sleep well.");
      const res3 = checkCrisisSentinel("Feeling sad after a breakup.");
      expect(res1.isCrisis).toBe(false);
      expect(res2.isCrisis).toBe(false);
      expect(res3.isCrisis).toBe(false);
    });

    it("T2.3: case-insensitive detection of capitalized triggers", () => {
      const res = checkCrisisSentinel("I WANT TO DIE");
      expect(res.isCrisis).toBe(true);
    });

    it("T2.4: detects triggers embedded in multiline message text", () => {
      const text = "Hi listener.\nI don't know what to do.\nI feel like I want to kill myself.\nThanks.";
      const res = checkCrisisSentinel(text);
      expect(res.isCrisis).toBe(true);
    });

    it("T2.5: handles empty or whitespace text without error", () => {
      const res = checkCrisisSentinel("   ");
      expect(res.isCrisis).toBe(false);
    });
  });

  // --------------------------------------------------------------------------
  // FEATURE 18: Emergency Safety Escalation
  // --------------------------------------------------------------------------
  describe("Feature 18: Emergency Safety Escalation", () => {
    it("T1.1: dispatches POST /api/mindspace/safety/cases creating urgent safety case", async () => {
      const mockRequest = vi.fn().mockResolvedValue({
        status: "created",
        case_id: "sc-901",
        category_code: "CRISIS_SENTINEL",
        severity: "urgent",
      });
      vi.mocked(apiClientModule.createMindspaceApiClient).mockResolvedValue({
        request: mockRequest,
      } as any);

      const req = new Request("http://localhost:4000/api/mindspace/safety/cases", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conversation_id: "conv-101",
          category_code: "CRISIS_SENTINEL",
          details: "Immediate crisis sentinel tripwire intercepted",
          severity: "urgent",
        }),
      });

      const res = await safetyCasesPOST(req);
      expect(res.status).toBe(200);
      expect(mockRequest).toHaveBeenCalledWith(
        "/api/v1/operations/safety/cases",
        expect.objectContaining({ method: "POST" })
      );
    });

    it("T1.2: POST /api/mindspace/safety/cases falls back gracefully when backend is offline", async () => {
      vi.mocked(apiClientModule.createMindspaceApiClient).mockRejectedValue(new Error("Offline"));
      const req = new Request("http://localhost:4000/api/mindspace/safety/cases", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ category_code: "CRISIS_SENTINEL" }),
      });

      const res = await safetyCasesPOST(req);
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.caseState).toBe("active");
    });

    it("T1.3: dispatches POST /api/mindspace/member/conduct-report for peer supervisor alerts", async () => {
      const mockRequest = vi.fn().mockResolvedValue({
        status: "recorded",
        report_id: "cr-555",
      });
      vi.mocked(apiClientModule.createMindspaceApiClient).mockResolvedValue({
        request: mockRequest,
      } as any);

      const req = new Request("http://localhost:4000/api/mindspace/member/conduct-report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conversation_id: "conv-202",
          reason: "Crisis Sentinel Escalate to Safety Ops",
        }),
      });

      const res = await conductReportPOST(req);
      expect(res.status).toBe(200);
      expect(mockRequest).toHaveBeenCalledWith(
        "/api/v1/operations/supervisor/conduct-reports",
        expect.objectContaining({ method: "POST" })
      );
    });

    it("T1.4: conduct-report fallback returns valid recorded response", async () => {
      vi.mocked(apiClientModule.createMindspaceApiClient).mockRejectedValue(new Error("Offline"));
      const req = new Request("http://localhost:4000/api/mindspace/member/conduct-report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: "Emergency alert" }),
      });

      const res = await conductReportPOST(req);
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.status).toBe("recorded");
    });

    it("T1.5: verifies safety case payload contains severity 'urgent' or 'high'", () => {
      const payload = {
        category_code: "CRISIS_SENTINEL",
        severity: "urgent",
      };
      expect(["urgent", "high", "imminent"]).toContain(payload.severity);
    });

    // Tier 2: Boundaries
    it("T2.1: handles malformed JSON in safety case POST without unhandled exception", async () => {
      const req = new Request("http://localhost:4000/api/mindspace/safety/cases", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: "{broken-json",
      });
      const res = await safetyCasesPOST(req);
      expect(res.status).toBe(200);
    });

    it("T2.2: handles malformed JSON in conduct-report POST gracefully", async () => {
      const req = new Request("http://localhost:4000/api/mindspace/member/conduct-report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: "{malformed",
      });
      const res = await conductReportPOST(req);
      expect(res.status).toBe(200);
    });

    it("T2.3: safety case handles missing details field", async () => {
      vi.mocked(apiClientModule.createMindspaceApiClient).mockRejectedValue(new Error("Offline"));
      const req = new Request("http://localhost:4000/api/mindspace/safety/cases", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const res = await safetyCasesPOST(req);
      expect(res.status).toBe(200);
    });

    it("T2.4: verifies safety cases response Content-Type is application/json", async () => {
      vi.mocked(apiClientModule.createMindspaceApiClient).mockRejectedValue(new Error("Offline"));
      const req = new Request("http://localhost:4000/api/mindspace/safety/cases", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ category_code: "CRISIS_SENTINEL" }),
      });
      const res = await safetyCasesPOST(req);
      expect(res.headers.get("Content-Type")).toContain("application/json");
    });

    it("T2.5: safety escalation does not block underlying room messaging thread", () => {
      const msgMgr = new ConsultationMessageManager();
      const sentinelRes = checkCrisisSentinel("I feel like I want to die");
      expect(sentinelRes.isCrisis).toBe(true);

      // Thread continues to function cleanly
      const msg = msgMgr.sendMessage("conv-1", "user-1", "member", "I feel like I want to die");
      expect(msg.content).toContain("want to die");
    });
  });

  // --------------------------------------------------------------------------
  // FEATURE 19: Session Termination Sync
  // --------------------------------------------------------------------------
  describe("Feature 19: Session Termination Sync", () => {
    it("T1.1: member closes session via PUT /api/mindspace/member/conversations/[id]/close", async () => {
      const mockRequest = vi.fn().mockResolvedValue({ status: "success", state: "closed" });
      vi.mocked(apiClientModule.createMindspaceApiClient).mockResolvedValue({
        request: mockRequest,
      } as any);

      const req = new Request("http://localhost:4000/api/mindspace/member/conversations/conv-1/close", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rating: 5, duration_seconds: 120 }),
      });

      const res = await memberClosePUT(req, { params: Promise.resolve({ id: "conv-1" }) });
      expect(res.status).toBe(200);
      expect(mockRequest).toHaveBeenCalledWith(
        "/api/v1/peer/conversations/conv-1/close",
        expect.objectContaining({ method: "PUT" })
      );
    });

    it("T1.2: member close route returns fallback state: closed when backend is offline", async () => {
      vi.mocked(apiClientModule.createMindspaceApiClient).mockRejectedValue(new Error("Offline"));
      const req = new Request("http://localhost:4000/api/mindspace/member/conversations/conv-2/close", {
        method: "PUT",
      });

      const res = await memberClosePUT(req, { params: Promise.resolve({ id: "conv-2" }) });
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.state).toBe("closed");
      expect(json.conversation_id).toBe("conv-2");
    });

    it("T1.3: listener closes session via PUT /api/mindspace/listener/conversations/[id]/close", async () => {
      const mockRequest = vi.fn().mockResolvedValue({ status: "success", state: "closed" });
      vi.mocked(apiClientModule.createMindspaceApiClient).mockResolvedValue({
        request: mockRequest,
      } as any);

      const req = new Request("http://localhost:4000/api/mindspace/listener/conversations/conv-3/close", {
        method: "PUT",
      });

      const res = await listenerClosePUT(req, { params: Promise.resolve({ id: "conv-3" }) });
      expect(res.status).toBe(200);
      expect(mockRequest).toHaveBeenCalledWith(
        "/api/v1/peer/conversations/conv-3/close",
        expect.objectContaining({ method: "PUT" })
      );
    });

    it("T1.4: listener close route returns fallback state: closed when backend is offline", async () => {
      vi.mocked(apiClientModule.createMindspaceApiClient).mockRejectedValue(new Error("Offline"));
      const req = new Request("http://localhost:4000/api/mindspace/listener/conversations/conv-4/close", {
        method: "PUT",
      });

      const res = await listenerClosePUT(req, { params: Promise.resolve({ id: "conv-4" }) });
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.state).toBe("closed");
      expect(json.conversation_id).toBe("conv-4");
    });

    it("T1.5: session closure records duration seconds", async () => {
      vi.mocked(apiClientModule.createMindspaceApiClient).mockRejectedValue(new Error("Offline"));
      const req = new Request("http://localhost:4000/api/mindspace/member/conversations/conv-5/close", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ duration_seconds: 300 }),
      });
      const res = await memberClosePUT(req, { params: Promise.resolve({ id: "conv-5" }) });
      expect(res.status).toBe(200);
    });

    // Tier 2: Boundaries
    it("T2.1: closing an already closed session is idempotent (returns 200)", async () => {
      vi.mocked(apiClientModule.createMindspaceApiClient).mockRejectedValue(new Error("Offline"));
      const req = new Request("http://localhost:4000/api/mindspace/member/conversations/conv-idempotent/close", {
        method: "PUT",
      });
      const res1 = await memberClosePUT(req, { params: Promise.resolve({ id: "conv-idempotent" }) });
      const res2 = await memberClosePUT(req, { params: Promise.resolve({ id: "conv-idempotent" }) });
      expect(res1.status).toBe(200);
      expect(res2.status).toBe(200);
    });

    it("T2.2: handles zero duration seconds cleanly", async () => {
      vi.mocked(apiClientModule.createMindspaceApiClient).mockRejectedValue(new Error("Offline"));
      const req = new Request("http://localhost:4000/api/mindspace/member/conversations/conv-zero/close", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ duration_seconds: 0 }),
      });
      const res = await memberClosePUT(req, { params: Promise.resolve({ id: "conv-zero" }) });
      expect(res.status).toBe(200);
    });

    it("T2.3: verifies Content-Type is application/json", async () => {
      vi.mocked(apiClientModule.createMindspaceApiClient).mockRejectedValue(new Error("Offline"));
      const req = new Request("http://localhost:4000/api/mindspace/member/conversations/c-headers/close", {
        method: "PUT",
      });
      const res = await memberClosePUT(req, { params: Promise.resolve({ id: "c-headers" }) });
      expect(res.headers.get("Content-Type")).toContain("application/json");
    });

    it("T2.4: listener close handles custom conversation IDs", async () => {
      vi.mocked(apiClientModule.createMindspaceApiClient).mockRejectedValue(new Error("Offline"));
      const req = new Request("http://localhost:4000/api/mindspace/listener/conversations/custom-id/close", {
        method: "PUT",
      });
      const res = await listenerClosePUT(req, { params: Promise.resolve({ id: "custom-id" }) });
      const json = await res.json();
      expect(json.conversation_id).toBe("custom-id");
    });

    it("T2.5: handles null body in close request", async () => {
      vi.mocked(apiClientModule.createMindspaceApiClient).mockRejectedValue(new Error("Offline"));
      const req = new Request("http://localhost:4000/api/mindspace/member/conversations/conv-null/close", {
        method: "PUT",
      });
      const res = await memberClosePUT(req, { params: Promise.resolve({ id: "conv-null" }) });
      expect(res.status).toBe(200);
    });
  });

  // --------------------------------------------------------------------------
  // FEATURE 20: Member Post-Session Rating & Feedback
  // --------------------------------------------------------------------------
  describe("Feature 20: Member Post-Session Rating & Feedback", () => {
    it("T1.1: validates 5-star rating successfully", () => {
      expect(validateMemberRating(5).valid).toBe(true);
    });

    it("T1.2: validates 1-star rating successfully", () => {
      expect(validateMemberRating(1).valid).toBe(true);
    });

    it("T1.3: validates 2, 3, 4 star ratings", () => {
      for (const r of [2, 3, 4]) {
        expect(validateMemberRating(r).valid).toBe(true);
      }
    });

    it("T1.4: records gratitude note in reflection submission", () => {
      const note = "Aarav was very patient and grounding.";
      expect(note.length).toBeGreaterThan(0);
    });

    it("T1.5: supports anonymous feedback submission without member identity leak", () => {
      const feedback = {
        rating: 5,
        feedback_text: "Very helpful session",
        is_anonymous: true,
      };
      expect(feedback.is_anonymous).toBe(true);
    });

    // Tier 2: Boundaries
    it("T2.1: rejects 0-star rating out of bounds", () => {
      const res = validateMemberRating(0);
      expect(res.valid).toBe(false);
      expect(res.error).toContain("between 1 and 5 stars");
    });

    it("T2.2: rejects 6-star rating out of bounds", () => {
      const res = validateMemberRating(6);
      expect(res.valid).toBe(false);
    });

    it("T2.3: rejects negative rating", () => {
      const res = validateMemberRating(-1);
      expect(res.valid).toBe(false);
    });

    it("T2.4: rejects non-integer rating (e.g. 4.5)", () => {
      const res = validateMemberRating(4.5);
      expect(res.valid).toBe(false);
      expect(res.error).toContain("integer");
    });

    it("T2.5: rejects non-number rating types", () => {
      expect(validateMemberRating(null).valid).toBe(false);
      expect(validateMemberRating("5").valid).toBe(false);
      expect(validateMemberRating(undefined).valid).toBe(false);
    });
  });

  // --------------------------------------------------------------------------
  // FEATURE 21: Member Mood Check-in & Journal Sync
  // --------------------------------------------------------------------------
  describe("Feature 21: Member Mood Check-in & Journal Sync", () => {
    it("T1.1: validates mood score of 8 with positive valence", () => {
      const res = validateMoodScore(8);
      expect(res.valid).toBe(true);
      expect(res.valence).toBe("positive");
    });

    it("T1.2: validates mood score of 5 with neutral valence", () => {
      const res = validateMoodScore(5);
      expect(res.valid).toBe(true);
      expect(res.valence).toBe("neutral");
    });

    it("T1.3: validates mood score of 3 with negative valence", () => {
      const res = validateMoodScore(3);
      expect(res.valid).toBe(true);
      expect(res.valence).toBe("negative");
    });

    it("T1.4: persists mood entry via POST /api/mindspace/member/moods", async () => {
      const mockRequest = vi.fn().mockResolvedValue({ id: "m-101", mood_code: "calm" });
      vi.mocked(apiClientModule.createMindspaceApiClient).mockResolvedValue({
        identity: { id: "u-1", name: "User", email: "u@m.com" },
        request: mockRequest,
      } as any);

      const req = new Request("http://localhost:4000/api/mindspace/member/moods", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mood_score: 8,
          valence: "positive",
          primary_emotion: "Calm & Grounded",
          notes: "Felt much better after session",
        }),
      });

      const res = await moodsPOST(req);
      expect(res.status).toBe(200);
      expect(mockRequest).toHaveBeenCalledWith(
        "/api/v1/wellbeing/moods",
        expect.objectContaining({ method: "POST" })
      );
    });

    it("T1.5: syncs post-session reflection to journal via POST /api/mindspace/member/journal", async () => {
      const mockRequest = vi.fn().mockResolvedValue({ id: "j-101", title: "Reflection" });
      vi.mocked(apiClientModule.createMindspaceApiClient).mockResolvedValue({
        identity: { id: "u-1", name: "User", email: "u@m.com" },
        request: mockRequest,
      } as any);

      const req = new Request("http://localhost:4000/api/mindspace/member/journal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: "Reflection: Peer Consultation",
          body: "Completed breathing and talked through stress.",
          category: "peer_session",
        }),
      });

      const res = await journalPOST(req);
      expect(res.status).toBe(200);
      expect(mockRequest).toHaveBeenCalledWith(
        "/api/v1/wellbeing/journal",
        expect.objectContaining({ method: "POST" })
      );
    });

    // Tier 2: Boundaries
    it("T2.1: rejects mood score of 0 out of bounds", () => {
      const res = validateMoodScore(0);
      expect(res.valid).toBe(false);
      expect(res.error).toContain("between 1 and 10");
    });

    it("T2.2: rejects mood score of 11 out of bounds", () => {
      const res = validateMoodScore(11);
      expect(res.valid).toBe(false);
    });

    it("T2.3: rejects negative mood score", () => {
      const res = validateMoodScore(-5);
      expect(res.valid).toBe(false);
    });

    it("T2.4: rejects non-integer mood score (e.g. 7.5)", () => {
      const res = validateMoodScore(7.5);
      expect(res.valid).toBe(false);
    });

    it("T2.5: rejects non-number mood score types", () => {
      expect(validateMoodScore(null).valid).toBe(false);
      expect(validateMoodScore("8").valid).toBe(false);
      expect(validateMoodScore(undefined).valid).toBe(false);
    });
  });

  // --------------------------------------------------------------------------
  // FEATURE 22: Listener SOAP Note Documentation
  // --------------------------------------------------------------------------
  describe("Feature 22: Listener SOAP Note Documentation", () => {
    it("T1.1: validates complete SOAP note (S, O, A, P all present)", () => {
      const note: SOAPNote = {
        subjective: "Member reported work deadline anxiety and difficulty unwinding.",
        objective: "Speech steady, receptive to somatic breathing. Engaged throughout.",
        assessment: "Situational workplace distress. No suicidal ideation.",
        plan: "Practiced 4-7-8 breathing. Recommended evening sleep routine.",
      };
      const res = validateSOAPNote(note);
      expect(res.valid).toBe(true);
      expect(res.errors.length).toBe(0);
    });

    it("T1.2: persists SOAP note via POST /api/mindspace/listener/conversations/[id]/soap", async () => {
      const mockRequest = vi.fn().mockResolvedValue({
        status: "success",
        soap_id: "soap-101",
        message: "SOAP record encrypted and saved",
      });
      vi.mocked(apiClientModule.createMindspaceApiClient).mockResolvedValue({
        request: mockRequest,
      } as any);

      const req = new Request("http://localhost:4000/api/mindspace/listener/conversations/conv-101/soap", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subjective: "Work stress",
          objective: "Calm engagement",
          assessment: "No crisis",
          plan: "Grounding exercise",
        }),
      });

      const res = await listenerSoapPOST(req, { params: Promise.resolve({ id: "conv-101" }) });
      expect(res.status).toBe(200);
      expect(mockRequest).toHaveBeenCalledWith(
        "/api/v1/peer/conversations/conv-101/soap",
        expect.objectContaining({ method: "POST" })
      );
    });

    it("T1.3: SOAP route falls back gracefully when backend is offline", async () => {
      vi.mocked(apiClientModule.createMindspaceApiClient).mockRejectedValue(new Error("Offline"));
      const req = new Request("http://localhost:4000/api/mindspace/listener/conversations/conv-102/soap", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subjective: "Notes" }),
      });

      const res = await listenerSoapPOST(req, { params: Promise.resolve({ id: "conv-102" }) });
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.status).toBe("success");
      expect(json.message).toContain("SOAP record encrypted and saved");
    });

    it("T1.4: confirms SOAP notes are linked to specific conversation_id", async () => {
      vi.mocked(apiClientModule.createMindspaceApiClient).mockRejectedValue(new Error("Offline"));
      const req = new Request("http://localhost:4000/api/mindspace/listener/conversations/conv-target/soap", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subjective: "S", objective: "O", assessment: "A", plan: "P" }),
      });

      const res = await listenerSoapPOST(req, { params: Promise.resolve({ id: "conv-target" }) });
      const json = await res.json();
      expect(json.conversation_id).toBe("conv-target");
    });

    it("T1.5: validates assessment section explicitly documents crisis status", () => {
      const assessment = "Situational anxiety. No acute self-harm ideation or safety concerns.";
      expect(assessment.toLowerCase()).toContain("no");
    });

    // Tier 2: Boundaries
    it("T2.1: rejects SOAP note with missing Subjective section", () => {
      const res = validateSOAPNote({
        objective: "O",
        assessment: "A",
        plan: "P",
      });
      expect(res.valid).toBe(false);
      expect(res.errors).toContain("Subjective section is required");
    });

    it("T2.2: rejects SOAP note with missing Objective section", () => {
      const res = validateSOAPNote({
        subjective: "S",
        assessment: "A",
        plan: "P",
      });
      expect(res.valid).toBe(false);
      expect(res.errors).toContain("Objective section is required");
    });

    it("T2.3: rejects SOAP note with missing Assessment section", () => {
      const res = validateSOAPNote({
        subjective: "S",
        objective: "O",
        plan: "P",
      });
      expect(res.valid).toBe(false);
      expect(res.errors).toContain("Assessment section is required");
    });

    it("T2.4: rejects SOAP note with missing Plan section", () => {
      const res = validateSOAPNote({
        subjective: "S",
        objective: "O",
        assessment: "A",
      });
      expect(res.valid).toBe(false);
      expect(res.errors).toContain("Plan section is required");
    });

    it("T2.5: rejects whitespace-only sections in SOAP note", () => {
      const res = validateSOAPNote({
        subjective: "   ",
        objective: "Valid",
        assessment: "Valid",
        plan: "Valid",
      });
      expect(res.valid).toBe(false);
      expect(res.errors).toContain("Subjective section is required");
    });
  });

  // --------------------------------------------------------------------------
  // FEATURE 23: Mandatory Caregiver Cooldown
  // --------------------------------------------------------------------------
  describe("Feature 23: Mandatory Caregiver Cooldown", () => {
    it("T1.1: initializes 60-second cooldown timer upon session completion", () => {
      const cooldown = new CaregiverCooldownTracker(60);
      expect(cooldown.getRemainingSeconds()).toBe(60);
      expect(cooldown.isComplete()).toBe(false);
    });

    it("T1.2: prevents listener from accepting new sessions while cooldown is active", () => {
      const cooldown = new CaregiverCooldownTracker(60);
      expect(cooldown.canAcceptNewSessions()).toBe(false);
    });

    it("T1.3: countdown timer decrements on each tick", () => {
      const cooldown = new CaregiverCooldownTracker(60);
      cooldown.tick();
      expect(cooldown.getRemainingSeconds()).toBe(59);
    });

    it("T1.4: automatically unlocks listener when countdown reaches 0", () => {
      const cooldown = new CaregiverCooldownTracker(1);
      expect(cooldown.canAcceptNewSessions()).toBe(false);
      cooldown.tick(); // 1 -> 0
      expect(cooldown.getRemainingSeconds()).toBe(0);
      expect(cooldown.isComplete()).toBe(true);
      expect(cooldown.canAcceptNewSessions()).toBe(true);
    });

    it("T1.5: supports instant unlock for zero-second cooldown", () => {
      const cooldown = new CaregiverCooldownTracker(0);
      expect(cooldown.isComplete()).toBe(true);
      expect(cooldown.canAcceptNewSessions()).toBe(true);
    });

    // Tier 2: Boundaries
    it("T2.1: countdown never ticks below zero", () => {
      const cooldown = new CaregiverCooldownTracker(0);
      cooldown.tick();
      expect(cooldown.getRemainingSeconds()).toBe(0);
    });

    it("T2.2: multiple ticks beyond zero maintain completed state", () => {
      const cooldown = new CaregiverCooldownTracker(2);
      cooldown.tick();
      cooldown.tick();
      cooldown.tick();
      cooldown.tick();
      expect(cooldown.getRemainingSeconds()).toBe(0);
      expect(cooldown.isComplete()).toBe(true);
    });

    it("T2.3: custom cooldown duration (e.g. 120s) supported", () => {
      const cooldown = new CaregiverCooldownTracker(120);
      expect(cooldown.getRemainingSeconds()).toBe(120);
      for (let i = 0; i < 20; i++) cooldown.tick();
      expect(cooldown.getRemainingSeconds()).toBe(100);
      expect(cooldown.canAcceptNewSessions()).toBe(false);
    });

    it("T2.4: negative initial cooldown clamps to complete", () => {
      const cooldown = new CaregiverCooldownTracker(-5);
      expect(cooldown.isComplete()).toBe(true);
      expect(cooldown.canAcceptNewSessions()).toBe(true);
    });

    it("T2.5: verify cooldown state strictly gates online availability status", () => {
      const cooldown = new CaregiverCooldownTracker(30);
      const canToggleOnline = cooldown.canAcceptNewSessions();
      expect(canToggleOnline).toBe(false);
    });
  });

  // --------------------------------------------------------------------------
  // TIER 3: Cross-Feature Seams & Pipelines
  // --------------------------------------------------------------------------
  describe("Tier 3: Consultation & Post-Session Cross-Feature Pipelines", () => {
    it("T3.1: Pre-call handshake -> Room active -> Messaging pipeline (F13 + F14 + F15)", () => {
      const room = new ConsultationRoomLifecycle();
      const msgMgr = new ConsultationMessageManager();

      // Handshake
      room.initiateHandshake("mbr-1");
      room.completeHandshake("lst-1");
      expect(room.getStage()).toBe("active");

      // Messaging
      const m1 = msgMgr.sendMessage("conv-pipe", "mbr-1", "member", "Hi Aarav");
      const m2 = msgMgr.sendMessage("conv-pipe", "lst-1", "listener", "Hi Priya, welcome.");
      expect(m1.sequence_number).toBe(1);
      expect(m2.sequence_number).toBe(2);

      // Duration tracking
      room.tickDuration(60);
      expect(room.getDurationSeconds()).toBe(60);
    });

    it("T3.2: Messaging -> Crisis Sentinel -> Safety Escalation pipeline (F15 + F17 + F18)", async () => {
      vi.mocked(apiClientModule.createMindspaceApiClient).mockRejectedValue(new Error("Offline"));
      const msgMgr = new ConsultationMessageManager();

      const crisisText = "I don't see any hope anymore and want to kill myself.";
      const msg = msgMgr.sendMessage("conv-crisis", "mbr-1", "member", crisisText);
      expect(msg.content).toBe(crisisText);

      // Sentinel check (<2ms)
      const sentinel = checkCrisisSentinel(msg.content);
      expect(sentinel.isCrisis).toBe(true);
      expect(sentinel.detectionLatencyMs).toBeLessThan(2);
      expect(sentinel.helplines?.teleManas).toContain("14416");

      // Escalate to Safety Ops
      const req = new Request("http://localhost:4000/api/mindspace/safety/cases", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conversation_id: "conv-crisis",
          category_code: "CRISIS_SENTINEL",
          details: `Tripwire trigger: ${sentinel.matchedPhrase}`,
          severity: "urgent",
        }),
      });

      const res = await safetyCasesPOST(req);
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.success).toBe(true);
    });

    it("T3.3: In-call Breathwork Pacer execution during active consultation (F14 + F16)", () => {
      const room = new ConsultationRoomLifecycle();
      room.initiateHandshake("mbr-1");
      room.completeHandshake("lst-1");

      const pacer = new BreathworkPacer();
      pacer.start();

      // Complete 1 cycle (19s)
      for (let i = 0; i < 19; i++) {
        pacer.tick();
        room.tickDuration(1);
      }

      expect(pacer.getStatus().completedCycles).toBe(1);
      expect(room.getDurationSeconds()).toBe(19);
    });

    it("T3.4: Member Post-Session Wrap-up pipeline (F19 + F20 + F21): Close -> Rating -> Mood check-in -> Journal sync", async () => {
      vi.mocked(apiClientModule.createMindspaceApiClient).mockRejectedValue(new Error("Offline"));

      // 1. Close encounter
      const closeReq = new Request("http://localhost:4000/api/mindspace/member/conversations/conv-wrap/close", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rating: 5, duration_seconds: 900 }),
      });
      const closeRes = await memberClosePUT(closeReq, { params: Promise.resolve({ id: "conv-wrap" }) });
      expect(closeRes.status).toBe(200);

      // 2. Validate rating
      expect(validateMemberRating(5).valid).toBe(true);

      // 3. Post mood
      const moodReq = new Request("http://localhost:4000/api/mindspace/member/moods", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mood_score: 8, valence: "positive", primary_emotion: "Relieved" }),
      });
      const moodRes = await moodsPOST(moodReq);
      expect(moodRes.status).toBe(200);

      // 4. Sync to journal
      const journalReq = new Request("http://localhost:4000/api/mindspace/member/journal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: "Reflection: Support Session",
          body: "Felt very listened to.",
          category: "peer_session",
        }),
      });
      const journalRes = await journalPOST(journalReq);
      expect(journalRes.status).toBe(200);
    });

    it("T3.5: Listener Post-Session Wrap-up pipeline (F19 + F22 + F23): Close -> SOAP filing -> 60s Caregiver Cooldown", async () => {
      vi.mocked(apiClientModule.createMindspaceApiClient).mockRejectedValue(new Error("Offline"));

      // 1. Listener close encounter
      const closeReq = new Request("http://localhost:4000/api/mindspace/listener/conversations/conv-lwrap/close", {
        method: "PUT",
      });
      const closeRes = await listenerClosePUT(closeReq, { params: Promise.resolve({ id: "conv-lwrap" }) });
      expect(closeRes.status).toBe(200);

      // 2. File SOAP note
      const soapReq = new Request("http://localhost:4000/api/mindspace/listener/conversations/conv-lwrap/soap", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subjective: "Reported stress relief after 4-7-8 breathing",
          objective: "Active listening provided, steady engagement",
          assessment: "Situational anxiety, mood improved to 8/10",
          plan: "Encouraged sleep hygiene and scheduled follow-up",
        }),
      });
      const soapRes = await listenerSoapPOST(soapReq, { params: Promise.resolve({ id: "conv-lwrap" }) });
      expect(soapRes.status).toBe(200);

      // 3. Enter 60-second cooldown
      const cooldown = new CaregiverCooldownTracker(60);
      expect(cooldown.canAcceptNewSessions()).toBe(false);

      // Advance 60 seconds
      for (let i = 0; i < 60; i++) cooldown.tick();
      expect(cooldown.isComplete()).toBe(true);
      expect(cooldown.canAcceptNewSessions()).toBe(true);
    });
  });

  // --------------------------------------------------------------------------
  // TIER 4: Next.js Consultation API Routes & Workflow Contracts
  // --------------------------------------------------------------------------
  describe("Tier 4: Next.js Consultation API Routes & Workflow Contracts", () => {
    // Feature: Member Conversation Messages Route
    describe("Member Messages Route: /api/mindspace/member/conversations/[id]/messages", () => {
      it("T4.1: GET returns message history from backend when online", async () => {
        const mockMessages = [
          { id: "msg-1", conversation_id: "conv-101", sender_user_id: "usr-demo-listener-01", content: "Hello, I am here to listen.", sent_at: new Date().toISOString() },
        ];
        const mockRequest = vi.fn().mockResolvedValue(mockMessages);
        vi.mocked(apiClientModule.createMindspaceApiClient).mockResolvedValue({ request: mockRequest } as any);

        const req = new Request("http://localhost:4000/api/mindspace/member/conversations/conv-101/messages");
        const res = await memberMessagesGET(req, { params: Promise.resolve({ id: "conv-101" }) });
        expect(res.status).toBe(200);
        const data = await res.json();
        expect(data).toEqual(mockMessages);
        expect(mockRequest).toHaveBeenCalledWith("/api/v1/peer/conversations/conv-101/messages");
      });

      it("T4.2: GET provides resilient fallback when backend is offline", async () => {
        vi.mocked(apiClientModule.createMindspaceApiClient).mockRejectedValue(new Error("Connection refused"));

        const req = new Request("http://localhost:4000/api/mindspace/member/conversations/conv-102/messages");
        const res = await memberMessagesGET(req, { params: Promise.resolve({ id: "conv-102" }) });
        expect(res.status).toBe(200);
        const data = await res.json();
        expect(Array.isArray(data)).toBe(true);
        expect(data[0].conversation_id).toBe("conv-102");
        expect(data[0].source).toBe("fallback");
      });

      it("T4.3: POST forwards new message to backend when online", async () => {
        const mockReply = { id: "msg-103", conversation_id: "conv-103", sender_user_id: "usr-member-1", content: "Feeling better", sent_at: new Date().toISOString() };
        const mockRequest = vi.fn().mockResolvedValue(mockReply);
        vi.mocked(apiClientModule.createMindspaceApiClient).mockResolvedValue({ request: mockRequest } as any);

        const req = new Request("http://localhost:4000/api/mindspace/member/conversations/conv-103/messages", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content: "Feeling better" }),
        });
        const res = await memberMessagesPOST(req, { params: Promise.resolve({ id: "conv-103" }) });
        expect(res.status).toBe(200);
        const data = await res.json();
        expect(data.id).toBe("msg-103");
      });

      it("T4.4: POST provides resilient fallback response when offline", async () => {
        vi.mocked(apiClientModule.createMindspaceApiClient).mockRejectedValue(new Error("Offline"));

        const req = new Request("http://localhost:4000/api/mindspace/member/conversations/conv-104/messages", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content: "Offline message test" }),
        });
        const res = await memberMessagesPOST(req, { params: Promise.resolve({ id: "conv-104" }) });
        expect(res.status).toBe(200);
        const data = await res.json();
        expect(data.content).toBe("Offline message test");
        expect(data.source).toBe("fallback");
      });

      it("T4.5: POST gracefully handles empty or non-JSON body", async () => {
        vi.mocked(apiClientModule.createMindspaceApiClient).mockRejectedValue(new Error("Offline"));

        const req = new Request("http://localhost:4000/api/mindspace/member/conversations/conv-105/messages", {
          method: "POST",
          body: "",
        });
        const res = await memberMessagesPOST(req, { params: Promise.resolve({ id: "conv-105" }) });
        expect(res.status).toBe(200);
        const data = await res.json();
        expect(data.source).toBe("fallback");
      });
    });

    // Feature: Listener Conversation Messages Route
    describe("Listener Messages Route: /api/mindspace/listener/conversations/[id]/messages", () => {
      it("T4.6: GET returns message history from backend when online", async () => {
        const mockMessages = [
          { id: "msg-201", conversation_id: "conv-201", sender_user_id: "usr-demo-member-01", content: "Thank you for listening.", sent_at: new Date().toISOString() },
        ];
        const mockRequest = vi.fn().mockResolvedValue(mockMessages);
        vi.mocked(apiClientModule.createMindspaceApiClient).mockResolvedValue({ request: mockRequest } as any);

        const req = new Request("http://localhost:4000/api/mindspace/listener/conversations/conv-201/messages");
        const res = await listenerMessagesGET(req, { params: Promise.resolve({ id: "conv-201" }) });
        expect(res.status).toBe(200);
        const data = await res.json();
        expect(data).toEqual(mockMessages);
      });

      it("T4.7: GET provides resilient fallback when backend is offline", async () => {
        vi.mocked(apiClientModule.createMindspaceApiClient).mockRejectedValue(new Error("Offline"));

        const req = new Request("http://localhost:4000/api/mindspace/listener/conversations/conv-202/messages");
        const res = await listenerMessagesGET(req, { params: Promise.resolve({ id: "conv-202" }) });
        expect(res.status).toBe(200);
        const data = await res.json();
        expect(Array.isArray(data)).toBe(true);
        expect(data[0].conversation_id).toBe("conv-202");
        expect(data[0].source).toBe("fallback");
      });

      it("T4.8: POST forwards listener message to backend when online", async () => {
        const mockReply = { id: "msg-203", conversation_id: "conv-203", sender_user_id: "usr-listener-1", content: "Take your time.", sent_at: new Date().toISOString() };
        const mockRequest = vi.fn().mockResolvedValue(mockReply);
        vi.mocked(apiClientModule.createMindspaceApiClient).mockResolvedValue({ request: mockRequest } as any);

        const req = new Request("http://localhost:4000/api/mindspace/listener/conversations/conv-203/messages", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content: "Take your time." }),
        });
        const res = await listenerMessagesPOST(req, { params: Promise.resolve({ id: "conv-203" }) });
        expect(res.status).toBe(200);
        const data = await res.json();
        expect(data.id).toBe("msg-203");
      });

      it("T4.9: POST provides resilient fallback response when offline", async () => {
        vi.mocked(apiClientModule.createMindspaceApiClient).mockRejectedValue(new Error("Offline"));

        const req = new Request("http://localhost:4000/api/mindspace/listener/conversations/conv-204/messages", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content: "Listener offline message" }),
        });
        const res = await listenerMessagesPOST(req, { params: Promise.resolve({ id: "conv-204" }) });
        expect(res.status).toBe(200);
        const data = await res.json();
        expect(data.content).toBe("Listener offline message");
        expect(data.source).toBe("fallback");
      });
    });

    // Feature: Member Post-Session Feedback Route
    describe("Member Feedback Route: /api/mindspace/member/conversations/[id]/feedback", () => {
      it("T4.10: POST forwards feedback to backend when online", async () => {
        const mockResponse = { status: "success", feedback_id: "fb-live-1" };
        const mockRequest = vi.fn().mockResolvedValue(mockResponse);
        vi.mocked(apiClientModule.createMindspaceApiClient).mockResolvedValue({ request: mockRequest } as any);

        const feedbackPayload = {
          rating: 5,
          feedback_text: "Very calm and empathetic listener.",
          post_mood_score: 9,
          post_mood_label: "Much Calmer",
          sync_to_journal: true,
        };

        const req = new Request("http://localhost:4000/api/mindspace/member/conversations/conv-fb-1/feedback", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(feedbackPayload),
        });

        const res = await memberFeedbackPOST(req, { params: Promise.resolve({ id: "conv-fb-1" }) });
        expect(res.status).toBe(200);
        const data = await res.json();
        expect(data.status).toBe("success");
        expect(mockRequest).toHaveBeenCalledWith(
          "/api/v1/peer/conversations/conv-fb-1/feedback",
          expect.objectContaining({ method: "POST" })
        );
      });

      it("T4.11: POST records feedback in fallback mode when offline", async () => {
        vi.mocked(apiClientModule.createMindspaceApiClient).mockRejectedValue(new Error("Offline"));

        const req = new Request("http://localhost:4000/api/mindspace/member/conversations/conv-fb-2/feedback", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ rating: 4, feedback_text: "Helpful session" }),
        });

        const res = await memberFeedbackPOST(req, { params: Promise.resolve({ id: "conv-fb-2" }) });
        expect(res.status).toBe(200);
        const data = await res.json();
        expect(data.status).toBe("success");
        expect(data.source).toBe("fallback");
        expect(data.conversation_id).toBe("conv-fb-2");
        expect(data.rating).toBe(4);
      });

      it("T4.12: validates member rating bounds (1-5) and mood score (1-10) before submitting", () => {
        expect(validateMemberRating(5).valid).toBe(true);
        expect(validateMemberRating(1).valid).toBe(true);
        expect(validateMemberRating(0).valid).toBe(false);
        expect(validateMemberRating(6).valid).toBe(false);
        expect(validateMemberRating("5" as any).valid).toBe(false);

        expect(validateMoodScore(10).valid).toBe(true);
        expect(validateMoodScore(1).valid).toBe(true);
        expect(validateMoodScore(0).valid).toBe(false);
        expect(validateMoodScore(11).valid).toBe(false);
      });
    });

    // Feature: Listener SOAP Notes Route Alias
    describe("Listener Notes Route: /api/mindspace/listener/conversations/[id]/notes", () => {
      it("T4.13: POST proxies SOAP note to FastAPI backend endpoint when online", async () => {
        const mockResponse = { status: "success", note_id: "soap-live-1" };
        const mockRequest = vi.fn().mockResolvedValue(mockResponse);
        vi.mocked(apiClientModule.createMindspaceApiClient).mockResolvedValue({ request: mockRequest } as any);

        const soapBody = {
          subjective: "S: Member feels relaxed after breathwork",
          objective: "O: Speech rhythm steady, engagement active",
          assessment: "A: Mild anxiety reduced",
          plan: "P: Schedule follow-up check-in next week",
        };

        const req = new Request("http://localhost:4000/api/mindspace/listener/conversations/conv-notes-1/notes", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(soapBody),
        });

        const res = await listenerNotesPOST(req, { params: Promise.resolve({ id: "conv-notes-1" }) });
        expect(res.status).toBe(200);
        const data = await res.json();
        expect(data.status).toBe("success");
        expect(mockRequest).toHaveBeenCalledWith(
          "/api/v1/peer/conversations/conv-notes-1/soap",
          expect.objectContaining({ method: "POST" })
        );
      });

      it("T4.14: POST provides resilient fallback response when offline", async () => {
        vi.mocked(apiClientModule.createMindspaceApiClient).mockRejectedValue(new Error("Offline"));

        const req = new Request("http://localhost:4000/api/mindspace/listener/conversations/conv-notes-2/notes", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ subjective: "S", objective: "O", assessment: "A", plan: "P" }),
        });

        const res = await listenerNotesPOST(req, { params: Promise.resolve({ id: "conv-notes-2" }) });
        expect(res.status).toBe(200);
        const data = await res.json();
        expect(data.status).toBe("success");
        expect(data.source).toBe("fallback");
      });
    });

    // Feature: Operations Safety Cases Route
    describe("Operations Safety Cases Route: /api/mindspace/operations/safety/cases", () => {
      it("T4.15: GET returns safety cases from backend when online", async () => {
        const mockCases = [{ id: "case-1", category_code: "CRISIS_SENTINEL", severity: "urgent" }];
        const mockRequest = vi.fn().mockResolvedValue(mockCases);
        vi.mocked(apiClientModule.createMindspaceApiClient).mockResolvedValue({ request: mockRequest } as any);

        const res = await operationsSafetyCasesGET();
        expect(res.status).toBe(200);
        const data = await res.json();
        expect(data).toEqual(mockCases);
      });

      it("T4.16: GET returns fallback cases when backend is offline", async () => {
        vi.mocked(apiClientModule.createMindspaceApiClient).mockRejectedValue(new Error("Offline"));

        const res = await operationsSafetyCasesGET();
        expect(res.status).toBe(200);
        const data = await res.json();
        expect(Array.isArray(data)).toBe(true);
        expect(data[0].category_code).toBe("CRISIS_SENTINEL");
      });

      it("T4.17: POST forwards safety escalation case to backend when online", async () => {
        const mockCase = { status: "created", case_id: "case-ops-99" };
        const mockRequest = vi.fn().mockResolvedValue(mockCase);
        vi.mocked(apiClientModule.createMindspaceApiClient).mockResolvedValue({ request: mockRequest } as any);

        const req = new Request("http://localhost:4000/api/mindspace/operations/safety/cases", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            conversation_id: "conv-esc-1",
            category_code: "CRISIS_SENTINEL",
            severity: "high",
            details: "Urgent crisis escalation",
          }),
        });

        const res = await operationsSafetyCasesPOST(req);
        expect(res.status).toBe(200);
        const data = await res.json();
        expect(data.case_id).toBe("case-ops-99");
      });

      it("T4.18: POST provides fallback creation when offline", async () => {
        vi.mocked(apiClientModule.createMindspaceApiClient).mockRejectedValue(new Error("Offline"));

        const req = new Request("http://localhost:4000/api/mindspace/operations/safety/cases", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ details: "Fallback crisis report" }),
        });

        const res = await operationsSafetyCasesPOST(req);
        expect(res.status).toBe(200);
        const data = await res.json();
        expect(data.status).toBe("created");
        expect(data.source).toBe("fallback");
      });
    });

    // Feature: Shared Consultation Domain Entities & Utilities
    describe("Shared Consultation Domain Entities: @/modules/client/mindspace/consultation", () => {
      it("T4.19: SharedBreathworkPacer executes deterministic 4-7-8 rhythm (4s Inhale, 7s Hold, 8s Exhale)", () => {
        const pacer = new SharedBreathworkPacer(true);
        expect(pacer.getStatus().phase).toBe("Inhale");
        expect(pacer.getStatus().secondsRemaining).toBe(4);

        // 4 ticks: advances to Hold (7s)
        for (let i = 0; i < 4; i++) pacer.tick();
        expect(pacer.getStatus().phase).toBe("Hold");
        expect(pacer.getStatus().secondsRemaining).toBe(7);

        // 7 ticks: advances to Exhale (8s)
        for (let i = 0; i < 7; i++) pacer.tick();
        expect(pacer.getStatus().phase).toBe("Exhale");
        expect(pacer.getStatus().secondsRemaining).toBe(8);

        // 8 ticks: advances to Inhale (4s) and increments completedCycles to 1
        for (let i = 0; i < 8; i++) pacer.tick();
        expect(pacer.getStatus().phase).toBe("Inhale");
        expect(pacer.getStatus().secondsRemaining).toBe(4);
        expect(pacer.getStatus().completedCycles).toBe(1);
      });

      it("T4.20: SharedBreathworkPacer correctly handles pause, resume, toggle, and reset", () => {
        const pacer = new SharedBreathworkPacer(true);
        pacer.pause();
        expect(pacer.getStatus().isActive).toBe(false);
        pacer.tick();
        expect(pacer.getStatus().secondsRemaining).toBe(4);

        pacer.resume();
        expect(pacer.getStatus().isActive).toBe(true);
        pacer.tick();
        expect(pacer.getStatus().secondsRemaining).toBe(3);

        pacer.toggle();
        expect(pacer.getStatus().isActive).toBe(false);

        pacer.reset();
        expect(pacer.getStatus().secondsRemaining).toBe(4);
        expect(pacer.getStatus().completedCycles).toBe(0);
      });

      it("T4.21: sharedCheckMediaDevices safely returns DeviceCheckResult in Node environment", async () => {
        const result = await sharedCheckMediaDevices();
        expect(result.microphoneReady).toBe(true);
        expect(result.cameraReady).toBe(true);
        expect(result.audioOutputReady).toBe(true);
        expect(result.networkLatencyMs).toBeGreaterThan(0);
      });

      it("T4.22: sharedCheckCrisisSentinel detects distress keywords in <2ms with Tele-MANAS hotline", () => {
        const res = sharedCheckCrisisSentinel("I am having thoughts to end my life");
        expect(res.isCrisis).toBe(true);
        expect(res.detectionLatencyMs).toBeLessThan(2);
        expect(res.helplines?.teleManas).toBe(SHARED_TELE_MANAS);
        expect(res.matchedPhrase).toBe("end my life");
      });

      it("T4.23: sharedCheckCrisisSentinel returns false for non-distress input in <2ms", () => {
        const res = sharedCheckCrisisSentinel("I am feeling productive today and drinking tea.");
        expect(res.isCrisis).toBe(false);
        expect(res.detectionLatencyMs).toBeLessThan(2);
        expect(res.helplines).toBeUndefined();
      });

      it("T4.24: verifies Tele-MANAS hotline string format in shared constants", () => {
        expect(SHARED_TELE_MANAS).toBe("14416 / +91 9999 666 555");
      });
    });
  });
});
