/**
 * VoiceIntakeTest — patient-facing voice intake powered by a custom WebSocket
 * voice agent (INTAKE_VOICE_AGENT_URL).
 *
 * Layer: client / telemedicine / patient / intake
 *
 * Flow:
 *  1. Patient clicks "Start Call":
 *     a. GET /api/intake-voice-agent → { token, wsUrl }
 *     b. WebSocket opened at wsUrl?token=...
 *     c. Microphone captured via AudioWorklet (inline Blob — avoids the
 *        deprecated ScriptProcessor API).
 *     d. Float32 mic samples → Int16 PCM @ 16 kHz → sent as raw ArrayBuffer.
 *
 *  2. Incoming WS messages build the conversation:
 *     - transcript     → live user speech bubble; committed as a settled user
 *                        message the moment the AI starts replying (text_delta
 *                        or assistant_text), mirroring turn-based chat.
 *     - text_delta     → appends to the live assistant transcript bubble.
 *     - assistant_text → commits the settled AI response, clears live state.
 *     - audio          → strips optional WAV header, decodes PCM @ 24 kHz,
 *                        schedules gapless playback via a linear scheduler.
 *     - status         → agent-reported phase (greeting/ready/thinking),
 *                        independent of the connection lifecycle — drives the
 *                        header status label/dot and the mic-pulse indicator
 *                        while the call is otherwise just "connected". A
 *                        status of "status_end" is the agent's own signal
 *                        that the conversation is over — auto-runs the same
 *                        End Call flow described in step 3, matched purely on
 *                        data.status (mirrors TextIntake's status_end).
 *     - error          → toast.
 *
 *  3. Patient clicks "End Call" (or the agent sends status_end above):
 *     a. Stops mic and WS cleanly.
 *     b. Saves encrypted transcript turns to the pre-created MindSpace intake.
 *     c. Opens IntakeCompleteModal after the save succeeds.
 *
 *  While connected, two extra controls sit next to "End Call":
 *     - Mic toggle: disables the captured MediaStreamTrack (sends silence)
 *       rather than tearing down the capture pipeline.
 *     - Restart: discards the in-progress call/transcript and immediately
 *       reconnects — nothing from the aborted attempt is saved.
 *
 * UI mirrors TextIntake: Bot-icon header with live status dot, ConversationChat
 * thread, Start Call / End Call button.
 *
 * Optimisations over the plain HTML reference:
 *  - AudioWorklet (inline Blob URL) replaces the deprecated ScriptProcessor.
 *  - All Audio/WebSocket resources tracked in refs; cleaned up on unmount.
 *  - Linear playback scheduler from the reference is preserved as-is.
 */

"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { toast } from "sonner";
import { nanoid } from "nanoid";
import { Bot, Loader2, Mic, MicOff, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { completeMindspaceIntakeAction } from "@/modules/server/presentation/actions/mindspace-intake.actions";
import { ConversationChat, type ChatMessage } from "./ConversationChat";
import { IntakeCompleteModal } from "./IntakeCompleteModal";

// ── AudioWorklet processor source (inline — no public/ file required) ─────────

/**
 * AudioWorklet processor that forwards each captured input frame to the main
 * thread. Runs in an isolated AudioWorkletGlobalScope.
 */
const PCM_WORKLET_CODE = `
class PcmCaptureProcessor extends AudioWorkletProcessor {
  process(inputs) {
    const channel = inputs[0]?.[0];
    if (!channel || channel.length === 0) return true;

    // Direct 16kHz pass-through if browser natively supports 16kHz AudioContext
    if (sampleRate === 16000) {
      const copy = new Float32Array(channel);
      this.port.postMessage(copy, [copy.buffer]);
      return true;
    }

    // High-quality linear resampling from browser hardware rate (e.g. 48kHz, 44.1kHz) to 16kHz
    const ratio = sampleRate / 16000;
    const outLength = Math.floor(channel.length / ratio);
    if (outLength > 0) {
      const output = new Float32Array(outLength);
      for (let i = 0; i < outLength; i++) {
        const inIndex = i * ratio;
        const i0 = Math.floor(inIndex);
        const i1 = Math.min(i0 + 1, channel.length - 1);
        const frac = inIndex - i0;
        output[i] = channel[i0] * (1 - frac) + channel[i1] * frac;
      }
      this.port.postMessage(output, [output.buffer]);
    }
    return true;
  }
}
registerProcessor("pcm-capture-processor", PcmCaptureProcessor);
`;

// ── Types ─────────────────────────────────────────────────────────────────────

/** Props for VoiceIntakeTest. */
interface VoiceIntakeTestProps {
  /** MindSpace UUID created after intake and voice transcript consent. */
  intakeId: string;
  /** Locale-prefixed base path for post-intake navigation. */
  basePath: string;
  /** Patient's display name — shown in the header and as avatar initial. */
  userName: string;
  /** Optional pre-formatted context forwarded to the voice agent. */
  patientContext?: string;
}

/** Call lifecycle status — drives Start/End Call button and mic pipeline. */
type ConnectionStatus = "disconnected" | "connecting" | "connected";

/**
 * Agent-reported phase within an active call — drives the header status
 * label/dot and mic-pulse indicator. Independent of ConnectionStatus: the
 * call stays "connected" throughout, while this cycles through the agent's
 * actual turn-taking state.
 *   idle      — connected, no status message received yet
 *   greeting  — agent is speaking its opening line
 *   ready     — greeting done, agent is listening
 *   thinking  — agent is processing what the patient just said
 *   speaking  — agent is streaming a spoken response (text/text_delta arriving)
 */
type AgentPhase = "idle" | "greeting" | "ready" | "thinking" | "speaking";

/** Ending-phase steps (mirrors TextIntake endingPhase). */
type EndingPhase = "idle" | "report" | "saving";

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Converts a Float32 audio frame to an Int16 PCM ArrayBuffer.
 *
 * @param float32 - Raw microphone samples from AudioWorklet.
 * @returns PCM-16 LE ArrayBuffer ready to send over WebSocket.
 */
function float32ToPcm16(float32: Float32Array): ArrayBuffer {
  const pcm = new Int16Array(float32.length);
  for (let i = 0; i < float32.length; i++) {
    const clamped = Math.max(-1, Math.min(1, float32[i]));
    pcm[i] = clamped < 0 ? clamped * 0x8000 : clamped * 0x7fff;
  }
  return pcm.buffer;
}

/**
 * Strips a WAV RIFF header (first 44 bytes) when present in a base64 chunk.
 * Middle-stream audio chunks may arrive with the header repeated.
 *
 * @param base64 - Incoming base64 audio payload.
 * @returns Clean base64 containing only raw PCM samples.
 */
function stripWavHeader(base64: string): string {
  // RIFF header starts with "RIFF" → base64 prefix is "UklGR"
  if (!base64.startsWith("UklGR")) return base64;
  const binary = atob(base64);
  if (binary.length <= 44) return base64;
  return btoa(binary.substring(44));
}

/**
 * Speaks text using the browser's built-in SpeechSynthesis API as a 100% reliable
 * zero-latency fallback when backend audio stream is unavailable or AudioContext is muted.
 */
function speakBrowserFallback(
  text: string,
  onEnded?: () => void,
): void {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) {
    onEnded?.();
    return;
  }
  try {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    // Detect Devanagari Hindi characters
    const hasHindi = /[\u0900-\u097F]/.test(text);
    const voices = window.speechSynthesis.getVoices();
    if (hasHindi) {
      utterance.lang = "hi-IN";
      const hiVoice = voices.find((v) => v.lang.toLowerCase().includes("hi"));
      if (hiVoice) utterance.voice = hiVoice;
    } else {
      utterance.lang = "en-IN";
      const enVoice = voices.find((v) => v.lang.toLowerCase().includes("en-in") || v.lang.toLowerCase().includes("en-us"));
      if (enVoice) utterance.voice = enVoice;
    }
    utterance.rate = 0.95;
    utterance.pitch = 1.0;
    utterance.onend = () => onEnded?.();
    utterance.onerror = () => onEnded?.();
    window.speechSynthesis.speak(utterance);
  } catch (e) {
    console.warn("[VoiceIntakeTest] speechSynthesis fallback error:", e);
    onEnded?.();
  }
}

/**
 * Decodes a base64 PCM-16 mono payload and schedules it for gapless playback.
 *
 * @param base64      - PCM-16 LE audio encoded as base64.
 * @param ctx         - Playback AudioContext (24 kHz).
 * @param nextTimeRef - Mutable ref holding the next available start time.
 */
function scheduleAudioChunk(
  base64: string,
  ctx: AudioContext,
  nextTimeRef: { current: number },
  onEnded?: () => void,
): void {
  try {
    if (ctx.state === "suspended") {
      void ctx.resume();
    }
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);

    // 1. Native Web Audio API decoding (handles Sarvam WAV & standard audio formats)
    ctx.decodeAudioData(
      bytes.buffer.slice(0),
      (audioBuffer) => {
        const source = ctx.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(ctx.destination);
        const now = ctx.currentTime;
        if (nextTimeRef.current < now) nextTimeRef.current = now;
        source.start(nextTimeRef.current);
        nextTimeRef.current += audioBuffer.duration;
        source.onended = () => {
          if (ctx.currentTime >= nextTimeRef.current - 0.08) {
            onEnded?.();
          }
        };
      },
      () => {
        // 2. Fallback: Raw PCM-16 extraction if raw frame without header
        try {
          const clean = stripWavHeader(base64);
          const bin = atob(clean);
          const len = Math.floor(bin.length / 2) * 2;
          const pcmBytes = new Uint8Array(len);
          for (let i = 0; i < len; i++) pcmBytes[i] = bin.charCodeAt(i);
          const pcm = new Int16Array(pcmBytes.buffer);
          if (pcm.length === 0) {
            onEnded?.();
            return;
          }

          const audioBuffer = ctx.createBuffer(1, pcm.length, ctx.sampleRate);
          const channel = audioBuffer.getChannelData(0);
          for (let i = 0; i < pcm.length; i++) channel[i] = pcm[i] / 32768;

          const source = ctx.createBufferSource();
          source.buffer = audioBuffer;
          source.connect(ctx.destination);

          const now = ctx.currentTime;
          if (nextTimeRef.current < now) nextTimeRef.current = now;
          source.start(nextTimeRef.current);
          nextTimeRef.current += audioBuffer.duration;
          source.onended = () => {
            if (ctx.currentTime >= nextTimeRef.current - 0.08) {
              onEnded?.();
            }
          };
        } catch (pcmErr) {
          console.warn("[VoiceIntakeTest] PCM fallback error:", pcmErr);
          onEnded?.();
        }
      }
    );
  } catch (e) {
    console.error("[VoiceIntakeTest] Base64 audio decode error:", e);
    onEnded?.();
  }
}

// ── Component ─────────────────────────────────────────────────────────────────

/**
 * WebSocket-based voice intake component.
 *
 * @param intakeId      - MindSpace intake UUID created after consent.
 * @param basePath      - Locale-prefixed base path.
 * @param userName      - Patient display name used for the avatar initial.
 * @param patientContext - Optional context forwarded to the voice agent.
 */
export function VoiceIntakeTest({
  intakeId,
  basePath,
  userName,
  patientContext,
}: VoiceIntakeTestProps) {
  const [status, setStatus] = useState<ConnectionStatus>("disconnected");
  const [agentPhase, setAgentPhaseState] = useState<AgentPhase>("idle");
  const agentPhaseRef = useRef<AgentPhase>("idle");

  const setAgentPhase = useCallback((phase: AgentPhase) => {
    agentPhaseRef.current = phase;
    setAgentPhaseState(phase);
  }, []);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [liveTranscript, setLiveTranscript] = useState("");
  const [liveRole, setLiveRole] = useState<"user" | "assistant" | null>(null);
  const [endingPhase, setEndingPhase] = useState<EndingPhase>("idle");
  const [showModal, setShowModal] = useState(false);
  const [isMuted, setIsMuted] = useState(false);

  // WebSocket
  const wsRef = useRef<WebSocket | null>(null);

  /** Lets restartCall bypass startCall's "already disconnected?" guard —
   *  set right before calling it, consumed (reset) on the very next call. */
  const skipStartGuardRef = useRef(false);

  // Capture-side audio resources
  const captureCtxRef = useRef<AudioContext | null>(null);
  const workletNodeRef = useRef<AudioWorkletNode | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);

  // Playback-side audio resources
  const playbackCtxRef = useRef<AudioContext | null>(null);
  const nextPlayTimeRef = useRef<number>(0);

  // Browser SpeechRecognition ref for crystal-clear real-time speech capture
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const speechRecRef = useRef<any>(null);
  const speakingSafetyTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Unlock audio contexts on any user interaction with the page
  useEffect(() => {
    const unlockContexts = () => {
      if (playbackCtxRef.current && playbackCtxRef.current.state === "suspended") {
        void playbackCtxRef.current.resume();
      }
      if (captureCtxRef.current && captureCtxRef.current.state === "suspended") {
        void captureCtxRef.current.resume();
      }
    };
    window.addEventListener("click", unlockContexts);
    window.addEventListener("touchstart", unlockContexts);
    window.addEventListener("keydown", unlockContexts);
    return () => {
      window.removeEventListener("click", unlockContexts);
      window.removeEventListener("touchstart", unlockContexts);
      window.removeEventListener("keydown", unlockContexts);
    };
  }, []);

  /**
   * Holds the current (possibly still-growing) user speech transcript.
   * The backend sends `transcript` continuously while the user speaks.
   * It is committed as a settled chat message the moment the AI starts replying,
   * then reset so the next user turn starts fresh.
   */
  const pendingUserTranscriptRef = useRef<string>("");

  /**
   * Accumulates streaming agent text from incremental `type: "text"` events.
   * Committed as a settled assistant message when the next `transcript` event
   * arrives (user starts speaking again) or when the call ends.
   */
  const pendingAssistantTextRef = useRef<string>("");

  /**
   * Mirror of messages state in a ref so endCall can read the latest list
   * without being re-created on every render.
   */
  const messagesRef = useRef<ChatMessage[]>([]);
  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  // ── Helpers ─────────────────────────────────────────────────────────────────

  /** Appends a committed message to both state and the mirror ref. */
  const addMessage = useCallback((msg: ChatMessage) => {
    setMessages((prev) => {
      const next = [...prev, msg];
      messagesRef.current = next;
      return next;
    });
  }, []);

  /**
   * Commits the pending user transcript as a settled message (if any), then
   * resets the pending state. Called just before the AI starts replying so
   * the user's turn appears in the thread before the AI response.
   */
  const flushPendingUserTranscript = useCallback(() => {
    const text = pendingUserTranscriptRef.current.trim();
    if (!text) return;
    pendingUserTranscriptRef.current = "";
    setLiveTranscript("");
    setLiveRole(null);
    addMessage({ key: nanoid(), from: "user", content: text });
  }, [addMessage]);

  /**
   * Commits any accumulated streaming agent text as a settled assistant message,
   * then resets live state. Called when a new user `transcript` event arrives
   * (implicit AI-turn-complete signal) or when the call ends.
   */
  const flushPendingAssistantText = useCallback(() => {
    const text = pendingAssistantTextRef.current.trim();
    if (!text) return;
    pendingAssistantTextRef.current = "";
    setLiveTranscript("");
    setLiveRole(null);
    setAgentPhase("ready");
    addMessage({ key: nanoid(), from: "assistant", content: text });
  }, [addMessage]);

  // ── Teardown all audio + WS resources ────────────────────────────────────────

  const teardown = useCallback(() => {
    if (speechRecRef.current) {
      try {
        speechRecRef.current.stop();
      } catch {}
      speechRecRef.current = null;
    }
    if (speakingSafetyTimerRef.current) {
      clearTimeout(speakingSafetyTimerRef.current);
      speakingSafetyTimerRef.current = null;
    }
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    if (workletNodeRef.current) {
      workletNodeRef.current.port.onmessage = null;
      workletNodeRef.current.disconnect();
      workletNodeRef.current = null;
    }
    mediaStreamRef.current?.getTracks().forEach((t) => t.stop());
    mediaStreamRef.current = null;
    if (captureCtxRef.current && captureCtxRef.current.state !== "closed") {
      captureCtxRef.current.close();
    }
    captureCtxRef.current = null;
    if (playbackCtxRef.current && playbackCtxRef.current.state !== "closed") {
      playbackCtxRef.current.close();
    }
    playbackCtxRef.current = null;
    nextPlayTimeRef.current = 0;
    if (wsRef.current && wsRef.current.readyState < WebSocket.CLOSING) {
      wsRef.current.close();
    }
    wsRef.current = null;
  }, []);

  // Ensure cleanup on unmount
  useEffect(() => () => teardown(), [teardown]);

  // ── End call: generate report → create DB record → save → modal ──────────────

  /**
   * Stops the call, generates a clinical report, persists the intake, and
   * opens the completion modal — mirrors TextIntake.endChat exactly.
   */
  const endCall = useCallback(async () => {
    // Commit any final user speech and in-flight agent text before saving
    flushPendingUserTranscript();
    flushPendingAssistantText();
    teardown();
    setStatus("disconnected");
    setAgentPhase("idle");
    setLiveTranscript("");
    setLiveRole(null);
    setIsMuted(false);

    const finalMessages = messagesRef.current;
    if (finalMessages.length === 0) {
      toast.info("No conversation to save yet.");
      return;
    }

    try {
      setEndingPhase("saving");
      await completeMindspaceIntakeAction({
        intakeId,
        messages: finalMessages.map((message) => ({
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
  }, [
    flushPendingUserTranscript,
    flushPendingAssistantText,
    teardown,
    intakeId,
  ]);

  // ── Start call ────────────────────────────────────────────────────────────────

  const startCall = useCallback(async () => {
    if (status !== "disconnected" && !skipStartGuardRef.current) return;
    skipStartGuardRef.current = false;

    setMessages([]);
    messagesRef.current = [];
    pendingUserTranscriptRef.current = "";
    pendingAssistantTextRef.current = "";
    setLiveTranscript("");
    setLiveRole(null);
    setIsMuted(false);
    setStatus("connecting");
    setAgentPhase("idle");

    try {
      // 1. Get auth token + WS URL from the server-side proxy endpoint.
      // Forward the patient context so the resolved wsUrl carries it as a
      // query param the voice agent can read at connection time.
      const tokenUrl = patientContext
        ? `/api/intake-voice-agent?patient_context=${encodeURIComponent(patientContext)}`
        : "/api/intake-voice-agent";
      const tokenRes = await fetch(tokenUrl);
      if (!tokenRes.ok) {
        toast.error("Could not authenticate with voice agent");
        setStatus("disconnected");
        return;
      }
      const { token, wsUrl } = (await tokenRes.json()) as {
        token: string;
        wsUrl: string;
      };

      // 2. Open WebSocket — wsUrl may already carry ?patient_context=..., so
      // add the token via the URL API rather than string-concatenating a
      // second "?".
      const wsUrlObj = new URL(wsUrl);
      wsUrlObj.searchParams.set("token", token);
      // console.log("[VoiceIntakeTest] connecting to WS:", wsUrlObj.toString());
      const ws = new WebSocket(wsUrlObj.toString());
      wsRef.current = ws;
      ws.binaryType = "arraybuffer";

      // 3. Playback context — 24 kHz matches the backend TTS output rate
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const playCtx = new AudioCtx({ sampleRate: 24000 });
      if (playCtx.state === "suspended") {
        void playCtx.resume();
      }
      playbackCtxRef.current = playCtx;
      nextPlayTimeRef.current = 0;

      ws.onopen = async () => {
        console.log("[VoiceIntakeTest] WS connected");
        setStatus("connected");

        try {
          // 4. Request microphone access with browser echo cancellation & noise suppression
          const stream = await navigator.mediaDevices.getUserMedia({
            audio: {
              echoCancellation: true,
              noiseSuppression: true,
              autoGainControl: true,
              channelCount: 1,
            },
          });
          mediaStreamRef.current = stream;
          console.log("[VoiceIntakeTest] mic access granted with echo cancellation");

          // 4b. Optional browser SpeechRecognition for instant, real-time speech capture
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
          if (SpeechRecognition) {
            try {
              const rec = new SpeechRecognition();
              rec.continuous = true;
              rec.interimResults = true;
              rec.lang = "hi-IN"; // Supports Hindi, Hinglish, and English
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              rec.onresult = (event: any) => {
                let interim = "";
                let final = "";
                for (let i = event.resultIndex; i < event.results.length; i++) {
                  const res = event.results[i];
                  if (res.isFinal) {
                    final += res[0].transcript;
                  } else {
                    interim += res[0].transcript;
                  }
                }
                if (interim.trim()) {
                  pendingUserTranscriptRef.current = interim.trim();
                  setLiveTranscript(interim.trim());
                  setLiveRole("user");
                }
                if (final.trim()) {
                  console.log("[VoiceIntakeTest] Browser STT final transcript:", final.trim());
                  pendingUserTranscriptRef.current = final.trim();
                  setLiveTranscript(final.trim());
                  setLiveRole("user");
                  if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
                    wsRef.current.send(JSON.stringify({ type: "user_speech", text: final.trim() }));
                  }
                }
              };
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              rec.onerror = (e: any) => {
                console.warn("[VoiceIntakeTest] SpeechRecognition notice:", e.error);
              };
              rec.start();
              speechRecRef.current = rec;
            } catch (recErr) {
              console.warn("[VoiceIntakeTest] SpeechRecognition init:", recErr);
            }
          }

          // 5. Build AudioWorklet capture pipeline (16 kHz — matches agent input)
          const captureCtx = new AudioCtx({ sampleRate: 16000 });
          if (captureCtx.state === "suspended") {
            void captureCtx.resume();
          }
          captureCtxRef.current = captureCtx;

          // Register the worklet from an inline Blob URL (no public/ file needed)
          const blob = new Blob([PCM_WORKLET_CODE], {
            type: "application/javascript",
          });
          const workletUrl = URL.createObjectURL(blob);
          await captureCtx.audioWorklet.addModule(workletUrl);
          URL.revokeObjectURL(workletUrl);
          console.log(
            "[VoiceIntakeTest] AudioWorklet loaded, sending PCM frames",
          );

          const micSource = captureCtx.createMediaStreamSource(stream);
          const workletNode = new AudioWorkletNode(
            captureCtx,
            "pcm-capture-processor",
          );
          workletNodeRef.current = workletNode;

          // Stream PCM mic frames directly to agent backend
          workletNode.port.onmessage = (e: MessageEvent<Float32Array>) => {
            if (wsRef.current?.readyState === WebSocket.OPEN) {
              wsRef.current.send(float32ToPcm16(e.data));
            }
          };

          // Connect: mic → worklet (NOT to destination — prevents mic feedback)
          micSource.connect(workletNode);
        } catch (micErr) {
          toast.error("Microphone access denied");
          console.error("[VoiceIntakeTest] mic error:", micErr);
          teardown();
          setStatus("disconnected");
        }
      };

      // 6. Handle incoming messages from the voice agent
      ws.onmessage = (event: MessageEvent) => {
        try {
          const data = JSON.parse(event.data as string) as {
            type: string;
            text?: string;
            audio?: string;
            message?: string;
            is_crisis?: boolean;
            /** "status" — agent-reported phase: "greeting" | "ready" | "thinking". */
            status?: string;
          };

          // Helper to play agent voice with guaranteed fallback
          const playAssistantVoice = (spokenText: string, audioBase64?: string) => {
            setAgentPhase("speaking");
            if (speakingSafetyTimerRef.current) {
              clearTimeout(speakingSafetyTimerRef.current);
            }
            // Guarantee mic is unblocked within 5 seconds max if onEnded fails
            speakingSafetyTimerRef.current = setTimeout(() => {
              setAgentPhase("ready");
            }, 5000);

            let playedViaWebAudio = false;
            const ctx = playbackCtxRef.current;
            if (audioBase64 && audioBase64.trim() && ctx) {
              if (ctx.state === "suspended") void ctx.resume();
              try {
                scheduleAudioChunk(audioBase64, ctx, nextPlayTimeRef, () => {
                  if (speakingSafetyTimerRef.current) clearTimeout(speakingSafetyTimerRef.current);
                  setAgentPhase("ready");
                });
                playedViaWebAudio = true;
              } catch (playErr) {
                console.warn("[VoiceIntakeTest] WebAudio playback failed, trying speech synthesis:", playErr);
              }
            }

            if (!playedViaWebAudio && spokenText) {
              speakBrowserFallback(spokenText, () => {
                if (speakingSafetyTimerRef.current) clearTimeout(speakingSafetyTimerRef.current);
                setAgentPhase("ready");
              });
            }
          };

          if (data.type === "status" && data.status) {
            console.log("[VoiceIntakeTest] status:", data.status);
            if (data.status === "greeting") {
              setAgentPhase("greeting");
            } else if (data.status === "ready") {
              const ctx = playbackCtxRef.current;
              if (!ctx || ctx.currentTime >= nextPlayTimeRef.current - 0.08) {
                setAgentPhase("ready");
              }
            } else if (data.status === "thinking") {
              setAgentPhase("thinking");
            } else if (data.status === "end") {
              flushPendingUserTranscript();
              flushPendingAssistantText();
              setMessages((prev) => [
                ...prev,
                {
                  key: nanoid(),
                  from: "assistant",
                  content: "The conversation has ended.",
                },
              ]);
              void endCall();
            }
          }

          if (data.type === "status_end") {
            flushPendingUserTranscript();
            flushPendingAssistantText();
            setMessages((prev) => [
              ...prev,
              {
                key: nanoid(),
                from: "assistant",
                content: "The conversation has ended.",
              },
            ]);
            void endCall();
          }

          if (data.type === "transcript" && data.text !== undefined) {
            flushPendingAssistantText();
            console.log("[VoiceIntakeTest] transcript:", data.text);
            pendingUserTranscriptRef.current = data.text;
            setLiveTranscript(data.text);
            setLiveRole("user");
          }

          if (data.type === "text" && data.text) {
            console.log("[VoiceIntakeTest] text (agent):", data.text.slice(0, 100));
            if (data.is_crisis) {
              console.warn("[VoiceIntakeTest] Crisis assistance active for voice turn");
            }
            flushPendingUserTranscript();
            pendingAssistantTextRef.current = "";
            addMessage({
              key: nanoid(),
              from: "assistant",
              content: data.text,
            });
            setLiveTranscript("");
            setLiveRole(null);
            playAssistantVoice(data.text, data.audio);
          }

          if (data.type === "text_delta" && data.text) {
            flushPendingUserTranscript();
            pendingAssistantTextRef.current += data.text;
            setLiveTranscript(pendingAssistantTextRef.current);
            setLiveRole("assistant");
            setAgentPhase("speaking");
          }

          if (data.type === "assistant_text" && data.text) {
            console.log("[VoiceIntakeTest] assistant_text:", data.text);
            flushPendingUserTranscript();
            pendingAssistantTextRef.current = "";
            addMessage({
              key: nanoid(),
              from: "assistant",
              content: data.text,
            });
            setLiveTranscript("");
            setLiveRole(null);
            playAssistantVoice(data.text, data.audio);
          }

          if (data.type === "audio" && data.audio) {
            playAssistantVoice("", data.audio);
          }

          if (data.type === "error") {
            console.error("[VoiceIntakeTest] agent error:", data.message);
            toast.error("Voice agent error", {
              description: data.message ?? "Unknown error from agent.",
            });
          }
        } catch (parseErr) {
          console.warn(
            "[VoiceIntakeTest] unparseable raw message:",
            event.data,
            parseErr,
          );
        }
      };

      ws.onerror = (err) => {
        console.error("[VoiceIntakeTest] WS error:", err);
        toast.error("Connection error with voice agent");
      };

      ws.onclose = (event) => {
        console.log(
          "[VoiceIntakeTest] WS closed — code:",
          event.code,
          "reason:",
          event.reason,
        );
        setStatus((prev) => (prev === "connected" ? "disconnected" : prev));
        setAgentPhase("idle");
        setLiveTranscript("");
        setLiveRole(null);
      };
    } catch (err) {
      console.error("[VoiceIntakeTest] startCall error:", err);
      toast.error("Could not start voice call");
      teardown();
      setStatus("disconnected");
    }
  }, [
    status,
    addMessage,
    flushPendingUserTranscript,
    flushPendingAssistantText,
    teardown,
    patientContext,
    endCall,
  ]);

  // ── Mic mute toggle ───────────────────────────────────────────────────────────

  /**
   * Mutes/unmutes the mic by disabling the captured MediaStreamTrack — the
   * AudioWorklet keeps running and sending frames (now silent) rather than
   * tearing down and rebuilding the whole capture pipeline for a mute.
   */
  const toggleMic = useCallback(() => {
    const stream = mediaStreamRef.current;
    if (!stream) return;
    const nextMuted = !isMuted;
    stream.getAudioTracks().forEach((track) => {
      track.enabled = !nextMuted;
    });
    setIsMuted(nextMuted);
  }, [isMuted]);

  // ── Restart call ──────────────────────────────────────────────────────────────

  /**
   * Discards the in-progress call/transcript and immediately reconnects —
   * nothing from the aborted attempt is saved (unlike End Call).
   */
  const restartCall = useCallback(() => {
    teardown();
    setStatus("disconnected");
    setAgentPhase("idle");
    setLiveTranscript("");
    setLiveRole(null);
    setIsMuted(false);
    skipStartGuardRef.current = true;
    startCall();
  }, [teardown, startCall]);

  // ── Derived UI values ─────────────────────────────────────────────────────────

  const isConnected = status === "connected";
  const isConnecting = status === "connecting";
  const isBusy = isConnecting || endingPhase !== "idle";

  const statusLabel =
    status === "disconnected"
      ? "Offline"
      : status === "connecting"
        ? "Connecting..."
        : agentPhase === "greeting"
          ? "Speaking greeting..."
          : agentPhase === "thinking"
            ? "Thinking..."
            : agentPhase === "speaking"
              ? "Speaking..."
              : agentPhase === "ready"
                ? "Ready — you can speak"
                : "Online";

  const statusDotClass =
    status === "disconnected"
      ? "bg-muted-foreground"
      : status === "connecting" ||
          agentPhase === "greeting" ||
          agentPhase === "thinking" ||
          agentPhase === "speaking"
        ? "bg-amber-400 animate-pulse"
        : "bg-emerald-500";

  // ── Render ────────────────────────────────────────────────────────────────────

  return (
    <>
      <div className="flex flex-col gap-3 w-full overflow-hidden h-[calc(100dvh-132px)]">
        {/* ── Header ── */}
        <div className="flex items-center gap-3 px-4 py-3 rounded-2xl border bg-card shadow-sm">
          <div
            className={`bg-primary/10 rounded-full p-2 shrink-0 ${isConnected ? "animate-pulse" : ""}`}
          >
            <Bot className="size-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm">Pre-Visit Intake Bot</p>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <span className={`size-2 rounded-full ${statusDotClass}`} />
            <span className="text-xs text-muted-foreground">{statusLabel}</span>
          </div>
        </div>

        {/* ── Conversation thread ── */}
        <ConversationChat
          messages={messages}
          liveTranscript={liveTranscript}
          liveRole={liveRole}
          userName={userName}
        />

        {/* ── Call controls ── */}
        <div className="flex gap-2 items-center justify-center">
          {isConnected || endingPhase !== "idle" ? (
            <>
              <Button
                size="sm"
                variant="outline"
                onClick={toggleMic}
                disabled={endingPhase !== "idle"}
                className="rounded-2xl h-9 px-3 gap-1.5"
                aria-label={isMuted ? "Unmute microphone" : "Mute microphone"}
              >
                {isMuted ? (
                  <MicOff className="size-4" />
                ) : (
                  <Mic className="size-4" />
                )}
                <span className="hidden sm:inline">
                  {isMuted ? "Unmute" : "Mute"}
                </span>
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={restartCall}
                disabled={endingPhase !== "idle"}
                className="rounded-2xl h-9 px-3 gap-1.5"
                aria-label="Restart call"
              >
                <RotateCcw className="size-4" />
                <span className="hidden sm:inline">Restart</span>
              </Button>
              <Button
                size="sm"
                variant="destructive"
                onClick={endCall}
                disabled={endingPhase !== "idle"}
                className="px-6 rounded-2xl h-9"
              >
                {endingPhase === "report" ? (
                  <>
                    <Loader2 className="animate-spin mr-1 size-3" />
                    Generating...
                  </>
                ) : endingPhase === "saving" ? (
                  <>
                    <Loader2 className="animate-spin mr-1 size-3" />
                    Saving...
                  </>
                ) : (
                  "End Call"
                )}
              </Button>
            </>
          ) : (
            <Button
              size="sm"
              onClick={startCall}
              disabled={isBusy}
              className="px-6 rounded-2xl h-9"
            >
              {isConnecting ? (
                <>
                  <Loader2 className="animate-spin mr-1 size-3" />
                  Connecting...
                </>
              ) : (
                "Start Call"
              )}
            </Button>
          )}
        </div>
      </div>

      {/* Post-intake modal */}
      {showModal && intakeId && (
        <IntakeCompleteModal
          open={showModal}
          intakeId={intakeId}
          basePath={basePath}
        />
      )}
    </>
  );
}
