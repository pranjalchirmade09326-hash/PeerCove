/**
 * Shared Consultation Room & Post-Session Flow Types
 */

export type RoomStage =
  | "idle"
  | "connecting"
  | "active"
  | "reflection"
  | "debrief"
  | "cooldown"
  | "ended";

export interface DeviceCheckResult {
  microphoneReady: boolean;
  cameraReady: boolean;
  audioOutputReady: boolean;
  networkLatencyMs: number;
  error?: string;
}

export type BreathPhase = "Inhale" | "Hold" | "Exhale";

export interface BreathworkStatus {
  isActive: boolean;
  phase: BreathPhase;
  secondsRemaining: number;
  completedCycles: number;
}

export interface ConsultationMessage {
  id: string;
  conversation_id: string;
  sender_user_id: string;
  sender_role?: "member" | "listener";
  content: string;
  sequence_number?: number;
  sent_at: string;
  source?: string;
}

export interface SOAPNote {
  subjective: string;
  objective: string;
  assessment: string;
  plan: string;
}

export interface MemberFeedbackPayload {
  rating: number;
  feedback_text?: string;
  post_mood_score?: number;
  post_mood_label?: string;
  sync_to_journal?: boolean;
}

export interface CrisisSentinelResult {
  isCrisis: boolean;
  detectionLatencyMs: number;
  helplines?: {
    teleManas: string;
    crisisLine988: string;
    emergency112?: string;
  };
  matchedPhrase?: string;
}
