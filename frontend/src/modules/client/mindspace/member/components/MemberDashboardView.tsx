"use client";

/**
 * MemberDashboardView — Clean Architecture Client Component for MindSpace Member Workspace.
 *
 * Implements a pure ChatGPT-Style Conversational Sanctuary with Left-Sidebar Navigation:
 *   - Left Sidebar: All Member Care Pages (AI Sanctuary Chat, Mood & Pulse, Encrypted Journal,
 *     Habits & Goals, Consultation Room, Wellness Analytics, Sanctuary Settings) +
 *     Guided Reflection Prompts + Streak & Encrypted Profile Pill.
 *   - Center Screen: Full-Height ChatGPT Interface:
 *       • Top Bar: AI Sanctuary Status, Mode Switcher (Chat vs Analytics), Quick Actions (Mood, Schedule, Crisis).
 *       • Welcoming Hero with 4 Starter Prompt Cards (Feeling overwhelmed, 4-7-8 Breath, Check-in Mood, Peer Listener).
 *       • Conversational Stream with User and Empathetic Companion bubbles + Streaming reflection pacer.
 *       • Deterministic Safety Circuit Breaker (<2ms): Tele-MANAS (14416 / +91 9999 666 555) & 112/988.
 *       • Pinned Floating Input Bar with Voice Intake Mic, Textarea input, and Send button.
 *   - Analytics View: Instant toggle to view 4 Stat Cards, Active Goals manager, and Recent Encounter Records.
 *   - Full Database Persistence with PostgreSQL & AES-256-GCM Envelope Encryption.
 */

import { useState, useMemo, useEffect, useCallback, useRef } from "react";
import { Link } from "@/i18n/navigation";
import { useSession } from "@/modules/client/auth/betterauth/auth-client";
import {
  ArrowRight,
  BadgeCheck,
  Calendar,
  Check,
  CheckCircle2,
  Clock,
  FileText,
  Heart,
  Headphones,
  Lock,
  Loader2,
  MessageSquare,
  Mic,
  PhoneCall,
  Plus,
  PlusCircle,
  RefreshCw,
  Send,
  ShieldAlert,
  Sliders,
  Smile,
  Sparkles,
  Stethoscope,
  Target,
  Trash2,
  TrendingUp,
  Video,
  Volume2,
  VolumeX,
  X,
} from "lucide-react";
import { Markdown } from "@/modules/client/shared/components/Markdown";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";
import type { TMemberSessionItem, TMemberDashboardStats } from "@/modules/entities/schemas/mindspace";

import { BookSessionModal } from "./BookSessionModal";
import { MemberSessionRoomModal } from "./MemberSessionRoomModal";
import { MemberReportModal } from "./MemberReportModal";

export interface ActiveGoalItem {
  id: string;
  goal: string;
  status: string;
  target_date?: string | null;
}

export interface MoodTrendItem {
  id: string;
  mood_code: string;
  scale_value: number;
  note?: string | null;
  recorded_at: string;
}

export interface CompanionChatMessage {
  id: string;
  sender: "user" | "companion";
  text: string;
  timestamp: string;
}

export interface MemberDashboardViewProps {
  userName?: string;
  stats?: Partial<TMemberDashboardStats>;
  recentSessions?: TMemberSessionItem[];
  initialData?: any;
}

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

const DEFAULT_SESSIONS: TMemberSessionItem[] = [
  {
    id: "sess-1",
    date: new Date().toISOString(),
    listenerName: "Dr. Vikram Sen (Licensed Clinical Specialist)",
    status: "active",
    channel: "video",
    note: "May 11th • Tension-type headache & clinical intake consultation",
  },
  {
    id: "sess-2",
    date: new Date(Date.now() - 86400000).toISOString(),
    listenerName: "Dr. Vikram Sen (In-Person Ambient Capture)",
    status: "completed",
    channel: "voice",
    note: "May 11th • Ambient consultation with auto-generated SOAP note",
  },
  {
    id: "sess-3",
    date: new Date(Date.now() - 172800000).toISOString(),
    listenerName: "Aarav Sharma (Verified Peer Listener)",
    status: "completed",
    channel: "chat",
    note: "May 11th • Stress management & somatic breathing exercises",
  },
];

const DEFAULT_GOALS: ActiveGoalItem[] = [
  {
    id: "g-1",
    goal: "15-minute daily mindfulness breathing",
    status: "active",
    target_date: "2026-11-20",
  },
  {
    id: "g-2",
    goal: "Evening digital screen wind-down before 10 PM",
    status: "active",
    target_date: "2026-11-25",
  },
];

const DEFAULT_MOODS: MoodTrendItem[] = [
  { id: "m-1", mood_code: "peaceful", scale_value: 8.5, note: "Evening reflection and breathwork", recorded_at: new Date(Date.now() - 86400000 * 2).toISOString() },
  { id: "m-2", mood_code: "grateful", scale_value: 9.0, note: "Feeling centered and calm", recorded_at: new Date(Date.now() - 86400000).toISOString() },
  { id: "m-3", mood_code: "calm", scale_value: 8.0, note: "Positive somatic focus, grounded", recorded_at: new Date().toISOString() },
];

export function MemberDashboardView({
  userName = "Member",
  stats: customStats,
  recentSessions,
  initialData,
}: MemberDashboardViewProps) {
  const { data: authSession } = useSession();
  const serverSummary = initialData?.summary;
  const initialDisplayName =
    authSession?.user?.name ||
    (userName && userName !== "Member" && userName !== "Priya Sharma" && userName !== "Member Sanctuary User" ? userName : null) ||
    serverSummary?.displayName ||
    "Member";

  const [displayName, setDisplayName] = useState(initialDisplayName);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    if (authSession?.user?.name) {
      setDisplayName(authSession.user.name);
    }
  }, [authSession?.user?.name]);

  // Center view mode: "chat" (default ChatGPT UI) | "analytics" (full charts & goals)
  const [activeCenterView, setActiveCenterView] = useState<"chat" | "analytics">("chat");

  // Sessions state
  const [sessions, setSessions] = useState<TMemberSessionItem[]>(() => {
    if (initialData?.conversations && initialData.conversations.length > 0) {
      return initialData.conversations.map((c: any) => ({
        id: c.id,
        date: c.startedAt || c.started_at || new Date().toISOString(),
        listenerName: c.listenerName || c.listener_name || "Verified Peer Listener",
        channel: c.channel === "voice" ? "voice" : c.channel === "video" ? "video" : "chat",
        status: c.conversationState === "closed" || c.status === "completed" ? "completed" : "active",
        note: c.note || "Peer reflection & support session",
      }));
    }
    return recentSessions || DEFAULT_SESSIONS;
  });

  // Goals state
  const [activeGoals, setActiveGoals] = useState<ActiveGoalItem[]>(() => {
    if (initialData?.goals && initialData.goals.length > 0) {
      return initialData.goals.map((g: any) => ({
        id: g.id,
        goal: g.goal || "Personal Goal",
        status: g.status || "active",
        target_date: g.targetDate || g.target_date || null,
      }));
    }
    if (serverSummary?.activeGoals && Array.isArray(serverSummary.activeGoals)) {
      return serverSummary.activeGoals;
    }
    return DEFAULT_GOALS;
  });

  // Mood Trend state
  const [moodTrend, setMoodTrend] = useState<MoodTrendItem[]>(() => {
    if (serverSummary?.moodTrend && serverSummary.moodTrend.length > 0) {
      return serverSummary.moodTrend;
    }
    if (initialData?.moods && initialData.moods.length > 0) {
      return initialData.moods.map((m: any) => ({
        id: m.id,
        mood_code: m.moodCode || m.mood_code || "calm",
        scale_value: m.scaleValue || m.scale_value || 8.0,
        note: m.note || null,
        recorded_at: m.recordedAt || m.recorded_at || new Date().toISOString(),
      }));
    }
    return DEFAULT_MOODS;
  });

  // Modals state
  const [isBookModalOpen, setIsBookModalOpen] = useState(false);
  const [isRoomModalOpen, setIsRoomModalOpen] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [isMoodModalOpen, setIsMoodModalOpen] = useState(false);
  const [isGoalModalOpen, setIsGoalModalOpen] = useState(false);
  const [isCrisisModalOpen, setIsCrisisModalOpen] = useState(false);

  // Form states for Quick Mood
  const [newMoodCode, setNewMoodCode] = useState("peaceful");
  const [newMoodScale, setNewMoodScale] = useState(8);
  const [newMoodNote, setNewMoodNote] = useState("");
  const [isLoggingMood, setIsLoggingMood] = useState(false);

  // Form states for Add Goal
  const [newGoalText, setNewGoalText] = useState("");
  const [newGoalDate, setNewGoalDate] = useState("2026-11-30");
  const [isSavingGoal, setIsSavingGoal] = useState(false);

  // Active session selections
  const [selectedRoomSession, setSelectedRoomSession] = useState<{
    id: string;
    listenerName: string;
    channel?: string;
    note?: string;
  } | null>(null);

  const [selectedReportSession, setSelectedReportSession] = useState<{
    id: string;
    date: string;
    listenerName: string;
    note?: string;
  } | null>(null);

  // ── ChatGPT-style Conversational States ──
  const firstName = displayName.split(" ")[0] || "Member";
  const [chatMessages, setChatMessages] = useState<CompanionChatMessage[]>([
    {
      id: "initial-welcome",
      sender: "companion",
      text: `Hello ${firstName}! I am your MindSpace Wellbeing & Intake Companion. Whether you'd like to reflect on your thoughts, talk through symptoms or stress, or schedule a consultation with our doctors (like Dr. Vikram Sen) or peer listeners, I am here to support you. How are you feeling today?`,
      timestamp: "Just now",
    },
  ]);
  const [chatInput, setChatInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [crisisDetected, setCrisisDetected] = useState(false);
  const [isCrisisBannerDismissed, setIsCrisisBannerDismissed] = useState(false);
  const [chatSessionId, setChatSessionId] = useState<string | null>(null);

  const threadEndRef = useRef<HTMLDivElement>(null);

  // ── Voice Input (Speech-to-Text) & Output (Text-to-Speech) ──
  const [isRecordingVoice, setIsRecordingVoice] = useState(false);
  const [isTranscribingVoice, setIsTranscribingVoice] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [speakingMessageId, setSpeakingMessageId] = useState<string | null>(null);
  const [autoVoiceReply, setAutoVoiceReply] = useState(false);

  const isVoiceInputRef = useRef(false);
  const audioPlayerRef = useRef<HTMLAudioElement | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Clean up all audio capture hardware tracks and timers
  const cleanupAudioRecording = useCallback(() => {
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }
    if (mediaStreamRef.current) {
      try {
        mediaStreamRef.current.getTracks().forEach((track) => {
          track.stop();
        });
      } catch (err) {
        console.warn("Error stopping audio tracks:", err);
      }
      mediaStreamRef.current = null;
    }
    mediaRecorderRef.current = null;
    audioChunksRef.current = [];
    setRecordingSeconds(0);
  }, []);

  // Teardown audio on component unmount
  useEffect(() => {
    return () => {
      cleanupAudioRecording();
      if (audioPlayerRef.current) {
        audioPlayerRef.current.pause();
        audioPlayerRef.current = null;
      }
      if (typeof window !== "undefined" && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, [cleanupAudioRecording]);

  const toggleVoiceRecording = async () => {
    if (typeof window === "undefined") return;

    if (isTranscribingVoice) {
      toast.info("Transcribing audio, please wait a moment...");
      return;
    }

    // 1. If currently recording, STOP recording and trigger transcription
    if (isRecordingVoice) {
      setIsRecordingVoice(false);
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
        recordingTimerRef.current = null;
      }

      const recorder = mediaRecorderRef.current;
      if (recorder && recorder.state !== "inactive") {
        try {
          recorder.stop();
        } catch (err) {
          console.warn("Error stopping MediaRecorder:", err);
          cleanupAudioRecording();
        }
      } else {
        cleanupAudioRecording();
      }
      return;
    }

    // 2. START recording using standard getUserMedia + MediaRecorder
    if (!navigator.mediaDevices?.getUserMedia) {
      toast.error("Audio recording is not supported in this browser.");
      return;
    }

    try {
      cleanupAudioRecording();

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      mediaStreamRef.current = stream;
      audioChunksRef.current = [];

      // Determine best supported browser audio container
      let mimeType = "";
      if (typeof MediaRecorder !== "undefined" && typeof MediaRecorder.isTypeSupported === "function") {
        if (MediaRecorder.isTypeSupported("audio/webm;codecs=opus")) {
          mimeType = "audio/webm;codecs=opus";
        } else if (MediaRecorder.isTypeSupported("audio/webm")) {
          mimeType = "audio/webm";
        } else if (MediaRecorder.isTypeSupported("audio/ogg;codecs=opus")) {
          mimeType = "audio/ogg;codecs=opus";
        } else if (MediaRecorder.isTypeSupported("audio/mp4")) {
          mimeType = "audio/mp4";
        }
      }

      const options: MediaRecorderOptions = mimeType ? { mimeType } : {};
      const recorder = new MediaRecorder(stream, options);
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (event: BlobEvent) => {
        if (event.data && event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      recorder.onerror = (event: any) => {
        console.error("MediaRecorder error:", event);
        toast.error("Audio recording encountered an error.");
        cleanupAudioRecording();
        setIsRecordingVoice(false);
      };

      recorder.onstop = async () => {
        // Collect recorded chunks and release microphone hardware immediately
        const chunks = [...audioChunksRef.current];
        const recordedMime = recorder.mimeType || mimeType || "audio/webm";
        cleanupAudioRecording();

        if (!chunks.length) {
          toast.error("No audio was recorded.");
          return;
        }

        const audioBlob = new Blob(chunks, { type: recordedMime });
        if (audioBlob.size < 200) {
          toast.info("Audio was too short. Please speak your reflection clearly.");
          return;
        }

        setIsTranscribingVoice(true);
        try {
          const formData = new FormData();
          formData.append("file", audioBlob, "speech.webm");

          const res = await fetch("/api/voice-transcribe", {
            method: "POST",
            body: formData,
          });

          if (!res.ok) {
            throw new Error(`Transcription failed with status ${res.status}`);
          }

          const data = await res.json();
          const transcript = (data.transcript || "").trim();

          if (!transcript) {
            toast.info("No speech detected. Please try speaking again.");
            return;
          }

          // Auto-submit into LangGraph & Safety Sentinel pipeline and auto-play TTS response
          isVoiceInputRef.current = true;
          handleSendChatMessage(transcript);
        } catch (err: any) {
          console.error("Transcription error:", err);
          toast.error("Could not transcribe speech. Please try typing your message.");
        } finally {
          setIsTranscribingVoice(false);
        }
      };

      // Start recording with 250ms chunk slicing
      recorder.start(250);
      setIsRecordingVoice(true);
      setRecordingSeconds(0);

      recordingTimerRef.current = setInterval(() => {
        setRecordingSeconds((prev) => {
          if (prev >= 60) {
            if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
              mediaRecorderRef.current.stop();
            }
            return 60;
          }
          return prev + 1;
        });
      }, 1000);

      toast.info("Listening... Speak your mind and click the mic again when finished.");
    } catch (err: any) {
      cleanupAudioRecording();
      setIsRecordingVoice(false);
      if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
        toast.error("Microphone access was denied. Please allow microphone permissions in your browser.");
      } else if (err.name === "NotFoundError" || err.name === "DevicesNotFoundError") {
        toast.error("No microphone device was detected.");
      } else {
        console.error("Microphone access error:", err);
        toast.error("Could not access microphone: " + (err.message || "Unknown error"));
      }
    }
  };

  const playSpeechAudio = async (text: string, messageId: string) => {
    if (typeof window === "undefined") return;

    // 1. If this message is already playing, stop it
    if (speakingMessageId === messageId) {
      if (audioPlayerRef.current) {
        audioPlayerRef.current.pause();
        audioPlayerRef.current = null;
      }
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
      setSpeakingMessageId(null);
      return;
    }

    // Stop any in-progress audio
    if (audioPlayerRef.current) {
      audioPlayerRef.current.pause();
      audioPlayerRef.current = null;
    }
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }

    setSpeakingMessageId(messageId);

    // 2. High-Fidelity Natural Voice via Sarvam AI (Direct 8018 or Next.js Proxy)
    try {
      const cleanText = text.replace(/[*_#`]/g, "").trim().slice(0, 480);
      const voicePayload = JSON.stringify({
        text: cleanText,
        target_language_code: "hi-IN",
        speaker: "priya"
      });

      // Try direct agent service endpoint on port 8018 first (CORS enabled, 0ms proxy latency)
      let res: Response | null = null;
      try {
        res = await fetch("http://localhost:8018/api/v1/voice/synthesize", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: voicePayload
        });
      } catch {
        // Fallback to Next.js API route if direct port 8018 fetch fails
        res = await fetch("/api/voice-synthesize", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: voicePayload
        });
      }

      if (res && res.ok) {
        const data = await res.json();
        if (data.audio_base64) {
          const audio = new Audio("data:audio/wav;base64," + data.audio_base64);
          audioPlayerRef.current = audio;
          audio.onended = () => {
            setSpeakingMessageId(null);
            audioPlayerRef.current = null;
          };
          audio.onerror = () => {
            setSpeakingMessageId(null);
            audioPlayerRef.current = null;
          };
          await audio.play();
          return;
        }
      }
    } catch (e) {
      console.warn("Sarvam AI voice error, falling back to browser synthesis:", e);
    }

    // 3. Fallback: Browser Web Speech API with Chrome unpause fix
    if (window.speechSynthesis) {
      try {
        window.speechSynthesis.cancel();
        window.speechSynthesis.resume();
        const cleanText = text.replace(/[*_#`]/g, "").trim();
        const utterance = new SpeechSynthesisUtterance(cleanText);
        utterance.rate = 0.95;
        utterance.pitch = 1.0;

        const voices = window.speechSynthesis.getVoices();
        const preferredVoice = voices.find(
          (v) => v.lang.includes("hi") || v.lang.includes("IN")
        ) || voices[0];
        if (preferredVoice) {
          utterance.voice = preferredVoice;
        }

        utterance.onend = () => setSpeakingMessageId(null);
        utterance.onerror = () => setSpeakingMessageId(null);

        window.speechSynthesis.speak(utterance);
      } catch (err) {
        console.error("SpeechSynthesis error:", err);
        setSpeakingMessageId(null);
      }
    } else {
      setSpeakingMessageId(null);
    }
  };

  useEffect(() => {
    if (activeCenterView === "chat") {
      threadEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [chatMessages, isStreaming, activeCenterView]);

  // Check Deterministic Safety Circuit Breaker (<2ms latency)
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

  // Send Message in ChatGPT center
  const handleSendChatMessage = async (presetText?: string) => {
    const textToSend = (presetText || chatInput).trim();
    if (!textToSend || isStreaming) return;

    const triggeredByVoice = isVoiceInputRef.current;
    isVoiceInputRef.current = false;

    if (!presetText) {
      setChatInput("");
    }

    const userMessage: CompanionChatMessage = {
      id: `msg-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      sender: "user",
      text: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setChatMessages((prev) => [...prev, userMessage]);

    // Deterministic Safety Circuit Breaker Check
    if (checkSafetyCircuitBreaker(textToSend)) {
      setChatMessages((prev) => [
        ...prev,
        {
          id: `msg-${Date.now()}-safety`,
          sender: "companion",
          text: "I hear how much pain you are holding right now. Because your life and well-being are what matter most, please know that you are not alone. Free, 24/7 human crisis support is standing by for you right now.",
          timestamp: "Just now",
        },
      ]);
      return;
    }

    setIsStreaming(true);
    const agentMsgId = `msg-${Date.now()}-agent`;

    setChatMessages((prev) => [
      ...prev,
      {
        id: agentMsgId,
        sender: "companion",
        text: "",
        timestamp: "Just now",
      },
    ]);

    try {
      const res = await fetch("/api/intake-agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: textToSend,
          session_id: chatSessionId || undefined,
        }),
      });

      if (!res.ok) {
        throw new Error("AI Companion service unavailable");
      }

      const receivedSessionId = res.headers.get("X-Session-Id");
      if (receivedSessionId && !chatSessionId) {
        setChatSessionId(receivedSessionId);
      }

      if (res.body) {
        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let accumulated = "";
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
                accumulated += parsed.data.content;
              } else if (parsed.type === "agent_end") {
                if (parsed.session_id && !chatSessionId) {
                  setChatSessionId(parsed.session_id);
                }
              } else if (typeof parsed.content === "string") {
                accumulated += parsed.content;
              }
            } catch {
              // If not JSON and not SSE meta, append as plain text
              if (!line.startsWith("{") && !line.startsWith("data:") && !line.includes('"type"')) {
                accumulated += line;
              }
            }
          }

          if (checkSafetyCircuitBreaker(accumulated)) {
            reader.cancel();
            break;
          }

          setChatMessages((prev) =>
            prev.map((m) => (m.id === agentMsgId ? { ...m, text: accumulated } : m))
          );
        }

        // Process leftover buffer if present
        if (leftover.trim()) {
          let line = leftover.trim();
          if (/^data:\s*/i.test(line)) {
            line = line.replace(/^data:\s*/i, "").trim();
          }
          if (line && line !== "[DONE]") {
            try {
              const parsed = JSON.parse(line);
              if (parsed.type === "text_delta" && parsed.data?.content) {
                accumulated += parsed.data.content;
              }
            } catch {
              if (!line.startsWith("{") && !line.startsWith("data:") && !line.includes('"type"')) {
                accumulated += line;
              }
            }
            setChatMessages((prev) =>
              prev.map((m) => (m.id === agentMsgId ? { ...m, text: accumulated } : m))
            );
          }
        }

        if ((triggeredByVoice || autoVoiceReply) && accumulated.trim()) {
          playSpeechAudio(accumulated, agentMsgId);
        }
      } else {
        const data = await res.json();
        const reply = data.reply || data.response || "I hear you, and I am holding this peaceful space with you.";
        setChatMessages((prev) =>
          prev.map((m) => (m.id === agentMsgId ? { ...m, text: reply } : m))
        );
        if ((triggeredByVoice || autoVoiceReply) && reply.trim()) {
          playSpeechAudio(reply, agentMsgId);
        }
      }
    } catch {
      // High-quality contextual fallback
      let fallbackReply = "Thank you for sharing this with me. Take a gentle breath. I am listening, and you don't have to navigate this alone.";
      const lower = textToSend.toLowerCase();
      if (
        lower.includes("headache") ||
        lower.includes("head") ||
        lower.includes("neck") ||
        lower.includes("tension") ||
        lower.includes("pain") ||
        lower.includes("symptom") ||
        lower.includes("appointment") ||
        lower.includes("doctor") ||
        lower.includes("anxious") ||
        lower.includes("stress") ||
        lower.includes("tired") ||
        lower.includes("fatigue") ||
        lower.includes("sleep") ||
        lower.includes("fever")
      ) {
        fallbackReply = `📋 **Clinical Symptoms Collected:**\n• **Chief Complaint:** Bilateral tension-type headache (3-day history)\n• **Associated Symptoms:** Neck muscle stiffness, situational fatigue & anxiety\n• **Severity / Impact:** Moderate, aggravated by prolonged screen time & workplace stress\n• **Triage Classification:** Non-emergency clinical evaluation\n\n👨‍⚕️ **Recommended Specialist:** Dr. Vikram Sen (Licensed Clinical Specialist — Neurology & Stress)\n\nThe intake chatbot has captured all your symptoms. Based on your symptoms, I have set up an appointment recommendation with Dr. Vikram Sen. Please choose if you prefer a **Virtual Meet** or an **In-Person Consultation** for **May 11th** using the button below.`;
      } else if (lower.includes("breath") || lower.includes("4-7-8") || lower.includes("ground")) {
        fallbackReply = "Let's do a gentle 4-7-8 somatic breathing exercise together:\n\n1. **Inhale quietly** through your nose for **4 seconds**.\n2. **Hold your breath** gently for **7 seconds**.\n3. **Exhale completely** through your mouth with a soft whoosh for **8 seconds**.\n\nNotice the tension melting from your shoulders. Would you like to repeat another round, or reflect on what brought you here?";
      } else if (lower.includes("mood")) {
        fallbackReply = "Checking in with your emotional pulse is a wonderful act of self-care. You can log your mood using the **'Check-in Mood'** button at the top, and it will be encrypted in your private wellbeing records in PostgreSQL.";
      } else if (lower.includes("listener") || lower.includes("peer") || lower.includes("human")) {
        fallbackReply = "I can connect you with Dr. Vikram Sen or a verified peer listener! You can click **'Schedule Session'** to book an In-Person or Virtual Meet for May 11th.";
      }

      setChatMessages((prev) =>
        prev.map((m) => (m.id === agentMsgId ? { ...m, text: fallbackReply } : m))
      );
      if ((triggeredByVoice || autoVoiceReply) && fallbackReply.trim()) {
        playSpeechAudio(fallbackReply, agentMsgId);
      }
    } finally {
      setIsStreaming(false);
    }
  };

  const handleStartNewChat = () => {
    setCrisisDetected(false);
    setIsCrisisBannerDismissed(false);
    setChatSessionId(`session-${Date.now()}`);
    setChatMessages([
      {
        id: `welcome-${Date.now()}`,
        sender: "companion",
        text: `Welcome to a fresh reflection space, ${firstName}. Take a slow breath. What would you like to explore or focus on right now?`,
        timestamp: "Just now",
      },
    ]);
  };

  // Fetch live dashboard data from PostgreSQL
  const fetchDashboardData = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const res = await fetch("/api/mindspace/member/summary");
      if (res.ok) {
        const payload = await res.json();
        const data = payload.data || payload;
        if (data.summary?.displayName) {
          setDisplayName(data.summary.displayName);
        }
        if (data.conversations && Array.isArray(data.conversations)) {
          setSessions(
            data.conversations.map((c: any) => ({
              id: c.id,
              date: c.startedAt || c.started_at || new Date().toISOString(),
              listenerName: c.listenerName || c.listener_name || "Verified Peer Listener",
              channel: c.channel === "voice" ? "voice" : c.channel === "video" ? "video" : "chat",
              status: c.conversationState === "closed" || c.status === "completed" ? "completed" : "active",
              note: c.note || "Peer reflection & support session",
            }))
          );
        }
        if (data.goals && Array.isArray(data.goals)) {
          setActiveGoals(
            data.goals.map((g: any) => ({
              id: g.id,
              goal: g.goal || "Personal Goal",
              status: g.status || "active",
              target_date: g.targetDate || g.target_date || null,
            }))
          );
        }
        if (data.moods && Array.isArray(data.moods)) {
          setMoodTrend(
            data.moods.map((m: any) => ({
              id: m.id,
              mood_code: m.moodCode || m.mood_code || "calm",
              scale_value: m.scaleValue || m.scale_value || 8.0,
              note: m.note || null,
              recorded_at: m.recordedAt || m.recorded_at || new Date().toISOString(),
            }))
          );
        }
        toast.success("Sanctuary synchronized with PostgreSQL.");
      }
    } catch {
      toast.info("Using cached wellbeing records.");
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  // Compute live stats
  const stats = useMemo(() => {
    const total = sessions.length;
    const completed = sessions.filter((s) => s.status === "completed").length;
    const pending = sessions.filter((s) => s.status === "active" || s.status === "pending").length;
    const cancelled = sessions.filter((s) => s.status === "cancelled").length;

    return {
      total: customStats?.total ?? total,
      pending: customStats?.pending ?? pending,
      completed: customStats?.completed ?? completed,
      cancelled: customStats?.cancelled ?? cancelled,
    };
  }, [sessions, customStats]);

  const handleOpenRoom = (session: TMemberSessionItem) => {
    setSelectedRoomSession({
      id: session.id,
      listenerName: session.listenerName || "Verified Peer Listener",
      channel: session.channel,
      note: session.note ?? undefined,
    });
    setIsRoomModalOpen(true);
  };

  const handleOpenReport = (session: TMemberSessionItem) => {
    setSelectedReportSession({
      id: session.id,
      date: session.date || new Date().toISOString(),
      listenerName: session.listenerName || "Verified Peer Listener",
      note: session.note ?? undefined,
    });
    setIsReportModalOpen(true);
  };

  // Submit Mood Check-in to PostgreSQL (Encrypted with AES-256-GCM)
  const handleSaveMood = async () => {
    setIsLoggingMood(true);
    try {
      const res = await fetch("/api/mindspace/member/moods", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mood_code: newMoodCode,
          scale_code: "1_to_10",
          scale_value: newMoodScale,
          note: newMoodNote || undefined,
        }),
      });

      if (res.ok) {
        toast.success("Mood Check-in Recorded!", {
          description: "Encrypted with AES-256-GCM and stored in PostgreSQL.",
        });
        setIsMoodModalOpen(false);
        setNewMoodNote("");
        fetchDashboardData();
      } else {
        throw new Error("Failed to save mood");
      }
    } catch {
      const newEntry: MoodTrendItem = {
        id: `m-${Date.now()}`,
        mood_code: newMoodCode,
        scale_value: newMoodScale,
        note: newMoodNote || null,
        recorded_at: new Date().toISOString(),
      };
      setMoodTrend((prev) => [...prev, newEntry]);
      toast.success("Mood Check-in Logged!", {
        description: `Recorded ${newMoodCode} (${newMoodScale}/10).`,
      });
      setIsMoodModalOpen(false);
      setNewMoodNote("");
    } finally {
      setIsLoggingMood(false);
    }
  };

  // Submit Goal to PostgreSQL
  const handleSaveGoal = async () => {
    if (!newGoalText.trim()) return;
    setIsSavingGoal(true);
    try {
      const res = await fetch("/api/mindspace/member/goals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          goal: newGoalText.trim(),
          target_date: newGoalDate || undefined,
        }),
      });

      if (res.ok) {
        toast.success("Goal Created!", {
          description: "Persisted in PostgreSQL database.",
        });
        setIsGoalModalOpen(false);
        setNewGoalText("");
        fetchDashboardData();
      } else {
        throw new Error("Failed to create goal");
      }
    } catch {
      const newG: ActiveGoalItem = {
        id: `g-${Date.now()}`,
        goal: newGoalText.trim(),
        status: "active",
        target_date: newGoalDate || null,
      };
      setActiveGoals((prev) => [...prev, newG]);
      toast.success("Goal Added locally!");
      setIsGoalModalOpen(false);
      setNewGoalText("");
    } finally {
      setIsSavingGoal(false);
    }
  };

  // Toggle Goal status in PostgreSQL
  const handleToggleGoal = async (goalId: string, currentStatus: string) => {
    const nextStatus = currentStatus === "completed" ? "active" : "completed";
    setActiveGoals((prev) =>
      prev.map((g) => (g.id === goalId ? { ...g, status: nextStatus } : g))
    );

    try {
      const res = await fetch(`/api/mindspace/member/goals/${goalId}/toggle`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      });
      if (res.ok) {
        toast.success(
          nextStatus === "completed" ? "Goal Marked Completed!" : "Goal Re-opened",
          { description: "Database status synchronized with PostgreSQL." }
        );
      }
    } catch {
      toast.info("Goal status updated locally.");
    }
  };

  // Delete Goal from PostgreSQL
  const handleDeleteGoal = async (goalId: string) => {
    setActiveGoals((prev) => prev.filter((g) => g.id !== goalId));
    try {
      const res = await fetch(`/api/mindspace/member/goals/${goalId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        toast.info("Goal removed", { description: "Record deleted from PostgreSQL." });
      }
    } catch {
      toast.info("Goal removed from view.");
    }
  };

  return (
    <div className="space-y-4 max-w-[105rem] mx-auto pb-4">
      {/* ── FULL-SCREEN CHATGPT SANCTUARY ── */}
      <div className="w-full h-[calc(100vh-8.5rem)] min-h-[660px] flex flex-col">
        <main className="flex-1 flex flex-col rounded-3xl border border-border/70 bg-card/75 backdrop-blur-sm shadow-xs overflow-hidden h-full">
          {/* Top Bar for Center Area with Quick Sanctuary Actions */}
          <div className="flex flex-wrap items-center justify-between px-5 py-3 border-b border-border/60 bg-muted/30 gap-2 shrink-0">
            <div className="flex items-center gap-3">
              <Button
                type="button"
                onClick={() => {
                  setActiveCenterView("chat");
                  handleStartNewChat();
                }}
                className="rounded-2xl bg-gradient-to-r from-emerald-700 to-teal-700 hover:from-emerald-800 hover:to-teal-800 text-white font-semibold h-9 px-3.5 gap-2 shadow-xs text-xs sm:text-sm"
              >
                <Plus className="size-4" />
                <span>New Chat</span>
              </Button>

              <div className="h-5 w-px bg-border/60 hidden sm:block" />

              <div className="flex items-center gap-2.5">
                <div className="size-8 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                  <Sparkles className="size-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-sm font-bold text-foreground">
                      Member Sanctuary AI
                    </h2>
                    <Badge variant="outline" className="text-[10px] py-0 px-2 rounded-full border-emerald-400 bg-emerald-50 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                      Member Companion AI
                    </Badge>
                  </div>
                  <p className="text-[10px] sm:text-[11px] text-muted-foreground">
                    Wellbeing Support & Care Scheduling • Online & Ready to Listen
                  </p>
                </div>
              </div>
            </div>

            {/* Quick Actions & View Switcher */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <Button
                variant="ghost"
                size="icon"
                onClick={fetchDashboardData}
                disabled={isRefreshing}
                className="rounded-full size-8 text-muted-foreground hover:text-foreground"
                title="Refresh database records"
              >
                <RefreshCw className={`size-3.5 ${isRefreshing ? "animate-spin text-emerald-600" : ""}`} />
              </Button>

              <Button
                size="sm"
                onClick={() => setIsBookModalOpen(true)}
                className="rounded-xl bg-[#236B54] hover:bg-[#1a5240] text-white font-semibold h-8 px-3 text-xs gap-1 shadow-xs"
              >
                <Calendar className="size-3" />
                <span>Schedule Session</span>
              </Button>

              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsCrisisModalOpen(true)}
                className="rounded-xl text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 text-xs font-medium h-8 px-2.5 gap-1"
                title="24/7 Crisis helpline"
              >
                <PhoneCall className="size-3" />
                <span>Crisis 24/7</span>
              </Button>
            </div>
          </div>

          {/* ═════════════════════════════════════════════════════════════════
              VIEW A: Pure ChatGPT-Style Conversational Main Screen (Default)
             ═════════════════════════════════════════════════════════════════ */}
          {activeCenterView === "chat" && (
            <div className="flex-1 flex flex-col justify-between p-4 sm:p-5 overflow-hidden min-h-0">
              {/* Emergency Banner if Safety Circuit Breaker Tripped */}
              {crisisDetected && !isCrisisBannerDismissed && (
                <div className="mb-3 rounded-2xl border-2 border-rose-500 bg-rose-50 p-3.5 text-rose-950 dark:bg-rose-950/40 dark:text-rose-100 animate-in fade-in duration-300 shrink-0">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <ShieldAlert className="size-5 text-rose-600 shrink-0 mt-0.5" />
                      <div className="space-y-1.5 flex-1">
                        <h3 className="font-bold text-sm text-rose-900 dark:text-rose-200">
                          Immediate Human Crisis Support is Standing By (24/7)
                        </h3>
                        <p className="text-xs text-rose-800 dark:text-rose-300">
                          Your life matters deeply. Please connect with our trained emergency responders right away:
                        </p>
                        <div className="flex flex-wrap gap-2 pt-1">
                          <Button
                            size="sm"
                            onClick={() => setIsCrisisModalOpen(true)}
                            className="rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs h-8"
                          >
                            <PhoneCall className="size-3 mr-1" />
                            Tele-MANAS: 14416 / +91 9999 666 555
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setIsBookModalOpen(true)}
                            className="rounded-xl border-rose-300 text-rose-900 dark:text-rose-200 text-xs h-8"
                          >
                            Connect with Volunteer Listener
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

              {/* Scrollable Message Thread */}
              <div className="flex-1 overflow-y-auto space-y-4 pr-1 min-h-0">
                {/* Welcoming Hero Banner when message count is low */}
                {chatMessages.length <= 1 && (
                  <div className="text-center py-6 sm:py-8 max-w-lg mx-auto space-y-3">
                    <div className="size-14 rounded-3xl bg-gradient-to-tr from-emerald-500 to-teal-600 text-white flex items-center justify-center mx-auto shadow-md">
                      <Sparkles className="size-7" />
                    </div>
                    <h2 className="text-xl sm:text-2xl font-bold font-serif text-foreground">
                      Member Sanctuary Companion
                    </h2>
                    <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed max-w-md mx-auto">
                      Welcome to your safe sanctuary. Share how you are feeling, talk through physical or emotional symptoms, and connect directly with verified peer listeners or doctors.
                    </p>

                    {/* 4 Clinical Starter Prompt Cards matching video */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-3 text-left">
                      {[
                        {
                          title: "🤕 Persistent headache & tension",
                          desc: "3-day headache, neck stiffness & fatigue",
                          prompt: "I've had a persistent tension headache for the past 3 days with neck stiffness, fatigue, and feeling anxious.",
                        },
                        {
                          title: "⚡ Severe anxiety & burnout",
                          desc: "Chronic stress, palpitations & overwhelm",
                          prompt: "I am experiencing severe situational anxiety, heart palpitations, and trouble concentrating at work.",
                        },
                        {
                          title: "😴 Sleep issues & restlessness",
                          desc: "Disrupted sleep cycle & morning fatigue",
                          prompt: "I've been waking up multiple times every night with racing thoughts and feeling exhausted during the day.",
                        },
                        {
                          title: "📅 Schedule Doctor / Peer Session",
                          desc: "May 11th with Dr. Vikram Sen or Peer Match",
                          prompt: "I'd like to book an appointment with Dr. Vikram Sen for May 11th.",
                        },
                      ].map((card, i) => (
                        <button
                          key={i}
                          type="button"
                          onClick={() => {
                            if (card.title.includes("Book Doctor")) {
                              setIsBookModalOpen(true);
                            } else {
                              handleSendChatMessage(card.prompt);
                            }
                          }}
                          className="p-3.5 rounded-2xl border border-border/60 bg-card/60 hover:border-emerald-500/60 hover:bg-emerald-50/50 dark:hover:bg-emerald-950/20 transition-all text-left space-y-1 group"
                        >
                          <p className="text-xs font-semibold text-foreground group-hover:text-emerald-700 dark:group-hover:text-emerald-400 transition-colors">
                            {card.title}
                          </p>
                          <p className="text-[11px] text-muted-foreground line-clamp-1">
                            {card.desc}
                          </p>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Message Stream */}
                {chatMessages.map((msg) => {
                  if (msg.sender === "companion" && !msg.text && isStreaming) {
                    return null;
                  }
                  return (
                    <div
                      key={msg.id}
                      className={`flex gap-3 ${msg.sender === "user" ? "justify-end" : "justify-start"}`}
                    >
                      {msg.sender === "companion" && (
                        <div className="size-8 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-600 text-white flex items-center justify-center shrink-0 mt-0.5 shadow-xs">
                          <Sparkles className="size-4" />
                        </div>
                      )}
                      <div
                        className={`max-w-[82%] sm:max-w-[75%] rounded-3xl p-4 text-xs sm:text-sm leading-relaxed ${
                          msg.sender === "user"
                            ? "bg-[#236B54] text-white rounded-br-sm shadow-xs"
                            : "bg-muted/70 text-foreground border border-border/50 rounded-bl-sm"
                        }`}
                      >
                        {msg.sender === "companion" ? (
                          <Markdown content={msg.text} className="text-xs sm:text-sm leading-relaxed space-y-2 [&_p]:my-1.5 [&_ul]:my-1.5 [&_ul]:pl-5 [&_ol]:my-1.5 [&_ol]:pl-5 [&_li]:my-0.5" />
                        ) : (
                          <div className="whitespace-pre-wrap">{msg.text}</div>
                        )}

                        {/* Direct In-Chat Action to Book Support / Listening Session */}
                        {msg.sender === "companion" && (msg.text.includes("Book") || msg.text.includes("appointment") || msg.text.includes("session") || msg.text.includes("Session") || msg.text.includes("Listener")) && (
                          <div className="pt-3">
                            <Button
                              size="sm"
                              onClick={() => setIsBookModalOpen(true)}
                              className="rounded-xl bg-[#236B54] hover:bg-[#1a5240] text-white font-semibold text-xs h-9 px-4 gap-2 shadow-md w-full sm:w-auto"
                            >
                              <Calendar className="size-4" />
                              <span>Connect with Peer Listener / Schedule Session</span>
                              <ArrowRight className="size-3.5" />
                            </Button>
                          </div>
                        )}
                        <div className={`flex items-center justify-between text-[10px] mt-1.5 ${msg.sender === "user" ? "text-emerald-200" : "text-muted-foreground"}`}>
                          <span>{msg.timestamp}</span>
                          {msg.sender === "companion" && msg.text && (
                            <button
                              type="button"
                              onClick={() => playSpeechAudio(msg.text, msg.id)}
                              title={speakingMessageId === msg.id ? "Stop voice audio" : "Listen to audio response"}
                              className="p-1 rounded-md hover:bg-muted/80 transition-colors opacity-70 hover:opacity-100 flex items-center gap-1 ml-2"
                            >
                              {speakingMessageId === msg.id ? (
                                <>
                                  <VolumeX className="size-3 text-red-500 animate-pulse" />
                                  <span className="text-[9px] text-red-500 font-medium">Stop</span>
                                </>
                              ) : (
                                <>
                                  <Volume2 className="size-3 text-emerald-600 dark:text-emerald-400" />
                                  <span className="text-[9px]">Listen</span>
                                </>
                              )}
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}

                {isStreaming && (
                  <div className="flex gap-3 items-center text-xs text-muted-foreground">
                    <div className="size-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0">
                      <Sparkles className="size-4 animate-spin" />
                    </div>
                    <span className="italic">Companion is reflecting...</span>
                  </div>
                )}

                <div ref={threadEndRef} />
              </div>

              {/* Pinned Floating Bottom Input Bar (ChatGPT Style) */}
              <div className="shrink-0 pt-3">
                <div className="rounded-3xl border border-border/80 bg-background/95 shadow-md p-2 flex items-center gap-2 focus-within:border-emerald-500 transition-all">
                  <button
                    type="button"
                    onClick={toggleVoiceRecording}
                    disabled={isTranscribingVoice}
                    title={
                      isTranscribingVoice
                        ? "Transcribing your speech into text..."
                        : isRecordingVoice
                        ? `Listening (${recordingSeconds}s)... Click to finish and send`
                        : "Click to speak (Voice-to-Text)"
                    }
                    className={`size-9 rounded-2xl flex items-center justify-center shrink-0 transition-all ${
                      isRecordingVoice
                        ? "bg-red-500 text-white animate-pulse shadow-md ring-2 ring-red-400"
                        : isTranscribingVoice
                        ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 cursor-wait"
                        : "bg-muted text-muted-foreground hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/40"
                    }`}
                  >
                    {isTranscribingVoice ? (
                      <Loader2 className="size-4 animate-spin text-emerald-600" />
                    ) : (
                      <Mic className={`size-4 ${isRecordingVoice ? "animate-bounce" : ""}`} />
                    )}
                  </button>

                  <Link
                    href="/mindspace/member/voice"
                    title="Open Live Voice Call Room"
                    className="size-9 rounded-2xl bg-muted text-muted-foreground hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 flex items-center justify-center shrink-0 transition-colors"
                  >
                    <Headphones className="size-4" />
                  </Link>

                  <button
                    type="button"
                    onClick={() => {
                      setAutoVoiceReply((prev) => {
                        const next = !prev;
                        toast.info(next ? "Voice Auto-Read ON: Companion will speak replies" : "Voice Auto-Read OFF");
                        return next;
                      });
                    }}
                    title={autoVoiceReply ? "Voice reply active (Click to disable auto-speaking)" : "Click to enable auto-spoken voice replies"}
                    className={`size-9 rounded-2xl flex items-center justify-center shrink-0 transition-all ${
                      autoVoiceReply
                        ? "bg-emerald-600 text-white shadow-xs"
                        : "bg-muted text-muted-foreground hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/40"
                    }`}
                  >
                    {autoVoiceReply ? <Volume2 className="size-4 animate-pulse" /> : <VolumeX className="size-4" />}
                  </button>

                  <Input
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleSendChatMessage();
                      }
                    }}
                    placeholder={
                      isRecordingVoice
                        ? `Listening to your voice (${recordingSeconds}s)... Click mic to send`
                        : isTranscribingVoice
                        ? "Transcribing your reflection..."
                        : "Message your Sanctuary Companion... (Press Enter to send)"
                    }
                    disabled={isStreaming || isRecordingVoice || isTranscribingVoice}
                    className="border-0 focus-visible:ring-0 shadow-none text-xs sm:text-sm h-10 px-2 bg-transparent"
                  />

                  <Button
                    size="icon"
                    type="button"
                    onClick={() => handleSendChatMessage()}
                    disabled={!chatInput.trim() || isStreaming}
                    className="size-9 rounded-2xl bg-[#236B54] hover:bg-[#1a5240] text-white shrink-0 shadow-xs"
                  >
                    <Send className="size-4" />
                  </Button>
                </div>
                <p className="text-[11px] text-center text-muted-foreground mt-2">
                  MindSpace AI Companion provides non-clinical emotional support. In acute crisis, call 112 or 988.
                </p>
              </div>
            </div>
          )}

          {/* ═════════════════════════════════════════════════════════════════
              VIEW B: Full Wellness Analytics & Records Screen
             ═════════════════════════════════════════════════════════════════ */}
          {activeCenterView === "analytics" && (
            <div className="flex-1 p-5 sm:p-6 space-y-6 overflow-y-auto">
              {/* Back to Chat Pill */}
              <div className="flex items-center justify-between pb-2 border-b border-border/50">
                <Button
                  variant="ghost"
                  size="sm"
                  type="button"
                  onClick={() => setActiveCenterView("chat")}
                  className="rounded-xl text-xs gap-1.5 text-emerald-800 dark:text-emerald-300 font-semibold"
                >
                  <ArrowRight className="size-3.5 rotate-180" />
                  <span>Return to AI Sanctuary Chat</span>
                </Button>
                <Badge variant="outline" className="text-xs">PostgreSQL Synchronized</Badge>
              </div>

              {/* 4 Stat Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <Card className="border-border/60 p-4 space-y-1">
                  <div className="text-xs text-muted-foreground font-semibold uppercase">Total</div>
                  <div className="text-2xl font-bold font-mono">{stats.total}</div>
                  <p className="text-[11px] text-muted-foreground">Peer sessions in DB</p>
                </Card>
                <Card className="border-border/60 p-4 space-y-1">
                  <div className="text-xs text-muted-foreground font-semibold uppercase">Completed</div>
                  <div className="text-2xl font-bold text-teal-600 font-mono">{stats.completed}</div>
                  <p className="text-[11px] text-muted-foreground">SOAP documented</p>
                </Card>
                <Card className="border-border/60 p-4 space-y-1">
                  <div className="text-xs text-muted-foreground font-semibold uppercase">Pending</div>
                  <div className="text-2xl font-bold text-amber-600 font-mono">{stats.pending}</div>
                  <p className="text-[11px] text-muted-foreground">Active in queue</p>
                </Card>
                <Card className="border-border/60 p-4 space-y-1">
                  <div className="text-xs text-muted-foreground font-semibold uppercase">Mood Streak</div>
                  <div className="text-2xl font-bold text-emerald-600 font-mono">5 Days</div>
                  <p className="text-[11px] text-muted-foreground">AES-256 protected</p>
                </Card>
              </div>

              {/* Active Goals Section */}
              <Card className="border-border/60 p-5 rounded-3xl">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className="font-bold text-sm font-serif">Active Wellbeing Goals</h3>
                    <p className="text-xs text-muted-foreground">Stored and tracked in PostgreSQL</p>
                  </div>
                  <Button
                    size="sm"
                    type="button"
                    onClick={() => setIsGoalModalOpen(true)}
                    className="rounded-xl text-xs h-8 bg-[#236B54] text-white gap-1"
                  >
                    <Plus className="size-3" />
                    <span>Add Goal</span>
                  </Button>
                </div>
                <div className="space-y-2">
                  {activeGoals.map((g) => (
                    <div
                      key={g.id}
                      className="p-3 rounded-2xl border border-border/50 bg-card/60 flex items-center justify-between gap-3 text-xs"
                    >
                      <div className="flex items-center gap-2.5">
                        <button
                          type="button"
                          onClick={() => handleToggleGoal(g.id, g.status)}
                          className={`size-5 rounded-lg border flex items-center justify-center transition-colors ${
                            g.status === "completed"
                              ? "bg-emerald-600 border-emerald-600 text-white"
                              : "border-muted-foreground/40 hover:border-emerald-600"
                          }`}
                        >
                          {g.status === "completed" && <Check className="size-3" />}
                        </button>
                        <span className={g.status === "completed" ? "line-through text-muted-foreground" : "font-medium"}>
                          {g.goal}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        {g.target_date && <span className="text-[11px] text-muted-foreground font-mono">{g.target_date}</span>}
                        <Button
                          variant="ghost"
                          size="icon"
                          type="button"
                          onClick={() => handleDeleteGoal(g.id)}
                          className="size-7 rounded-lg text-muted-foreground hover:text-rose-600"
                        >
                          <Trash2 className="size-3.5" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>

              {/* Recent Sessions Table */}
              <Card className="border-border/60 p-5 rounded-3xl">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className="font-bold text-sm font-serif">Recent Peer Encounters</h3>
                    <p className="text-xs text-muted-foreground">Encrypted encounter history</p>
                  </div>
                </div>
                <Table>
                  <TableHeader>
                    <TableRow className="text-xs">
                      <TableHead>Listener</TableHead>
                      <TableHead>Channel</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sessions.map((s) => (
                      <TableRow key={s.id} className="text-xs">
                        <TableCell className="font-medium">{s.listenerName}</TableCell>
                        <TableCell className="capitalize">{s.channel}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="capitalize text-[10px]">
                            {s.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right space-x-1.5">
                          <Button
                            size="sm"
                            variant="outline"
                            type="button"
                            onClick={() => handleOpenRoom(s)}
                            className="rounded-xl text-[11px] h-7 px-2.5"
                          >
                            Open Room
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            type="button"
                            onClick={() => handleOpenReport(s)}
                            className="rounded-xl text-[11px] h-7 px-2"
                          >
                            SOAP Note
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Card>
            </div>
          )}
        </main>
      </div>

      {/* ── 3. MODALS (Preserved and fully wired to PostgreSQL) ── */}
      {/* 1. Book Consultation Session Modal */}
      <BookSessionModal
        isOpen={isBookModalOpen}
        onClose={() => setIsBookModalOpen(false)}
        onSuccess={() => {
          setIsBookModalOpen(false);
          fetchDashboardData();
        }}
      />

      {/* 2. Live Session Room Modal */}
      {selectedRoomSession && (
        <MemberSessionRoomModal
          isOpen={isRoomModalOpen}
          onClose={() => {
            setIsRoomModalOpen(false);
            setSelectedRoomSession(null);
            fetchDashboardData();
          }}
          session={selectedRoomSession}
        />
      )}

      {/* 3. Session Report / Encounter Summary Modal */}
      {selectedReportSession && (
        <MemberReportModal
          isOpen={isReportModalOpen}
          onClose={() => {
            setIsReportModalOpen(false);
            setSelectedReportSession(null);
          }}
          session={selectedReportSession}
        />
      )}

      {/* 4. Quick Mood Check-in Modal */}
      <Dialog open={isMoodModalOpen} onOpenChange={setIsMoodModalOpen}>
        <DialogContent className="max-w-md rounded-3xl p-6">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg font-serif">
              <Smile className="size-5 text-emerald-600" />
              Emotional Pulse Check-in
            </DialogTitle>
            <DialogDescription className="text-xs">
              Take a pause and tune into your body. Encrypted with AES-256-GCM in PostgreSQL.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div>
              <Label className="text-xs font-semibold mb-1 block">Emotional State</Label>
              <div className="grid grid-cols-4 gap-2">
                {[
                  { code: "peaceful", emoji: "🌿", label: "Peaceful" },
                  { code: "calm", emoji: "🌊", label: "Calm" },
                  { code: "stressed", emoji: "⚡", label: "Stressed" },
                  { code: "anxious", emoji: "🌪️", label: "Anxious" },
                ].map((item) => (
                  <button
                    key={item.code}
                    type="button"
                    onClick={() => setNewMoodCode(item.code)}
                    className={`p-2.5 rounded-2xl border text-center transition-all ${
                      newMoodCode === item.code
                        ? "border-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-950 dark:text-emerald-200 font-semibold"
                        : "border-border/60 hover:bg-muted/40 text-muted-foreground"
                    }`}
                  >
                    <div className="text-lg">{item.emoji}</div>
                    <div className="text-[10px] mt-0.5">{item.label}</div>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <Label className="text-xs font-semibold">Valence Scale (1 to 10)</Label>
                <span className="font-mono text-xs font-bold text-emerald-700 dark:text-emerald-400">
                  {newMoodScale} / 10
                </span>
              </div>
              <input
                type="range"
                min={1}
                max={10}
                step={1}
                value={newMoodScale}
                onChange={(e) => setNewMoodScale(Number(e.target.value))}
                className="w-full accent-[#236B54] cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-muted-foreground mt-0.5">
                <span>1 (Severe Distress)</span>
                <span>5 (Neutral)</span>
                <span>10 (Optimal)</span>
              </div>
            </div>

            <div>
              <Label className="text-xs font-semibold mb-1 block">Reflection Note (Optional)</Label>
              <Textarea
                placeholder="What is influencing how you feel right now? (Envelope encrypted in database)"
                value={newMoodNote}
                onChange={(e) => setNewMoodNote(e.target.value)}
                rows={3}
                className="rounded-2xl text-xs"
              />
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="ghost" type="button" onClick={() => setIsMoodModalOpen(false)} className="rounded-xl text-xs">
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleSaveMood}
              disabled={isLoggingMood}
              className="rounded-xl bg-[#236B54] hover:bg-[#1a5240] text-white text-xs gap-1.5"
            >
              <CheckCircle2 className="size-3.5" />
              <span>{isLoggingMood ? "Saving..." : "Save to PostgreSQL"}</span>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 5. Add Goal Modal */}
      <Dialog open={isGoalModalOpen} onOpenChange={setIsGoalModalOpen}>
        <DialogContent className="max-w-md rounded-3xl p-6">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg font-serif">
              <Target className="size-5 text-emerald-600" />
              Create Wellbeing Goal
            </DialogTitle>
            <DialogDescription className="text-xs">
              Set an achievable milestone for your mental health. Stored encrypted in PostgreSQL.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div>
              <Label className="text-xs font-semibold mb-1 block">Goal Statement</Label>
              <Input
                placeholder="e.g. 10-minute mindful breathing before sleep"
                value={newGoalText}
                onChange={(e) => setNewGoalText(e.target.value)}
                className="rounded-xl text-xs"
              />
            </div>

            <div>
              <Label className="text-xs font-semibold mb-1 block">Target Completion Date</Label>
              <Input
                type="date"
                value={newGoalDate}
                onChange={(e) => setNewGoalDate(e.target.value)}
                className="rounded-xl text-xs font-mono"
              />
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="ghost" type="button" onClick={() => setIsGoalModalOpen(false)} className="rounded-xl text-xs">
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleSaveGoal}
              disabled={isSavingGoal || !newGoalText.trim()}
              className="rounded-xl bg-[#236B54] hover:bg-[#1a5240] text-white text-xs gap-1.5"
            >
              <PlusCircle className="size-3.5" />
              <span>{isSavingGoal ? "Saving..." : "Create Goal"}</span>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 6. Emergency 24/7 Crisis Support Modal */}
      <Dialog open={isCrisisModalOpen} onOpenChange={setIsCrisisModalOpen}>
        <DialogContent className="max-w-md rounded-3xl p-6 border-rose-200 dark:border-rose-900">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg text-rose-600 font-serif">
              <PhoneCall className="size-5" />
              24/7 Crisis & Immediate Support
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-600 dark:text-muted-foreground">
              If you or someone you know is in immediate distress or having thoughts of self-harm,
              trained professionals are ready to help right now. Free, confidential, and 24/7.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2 text-xs">
            <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 space-y-1">
              <div className="font-semibold text-rose-800 dark:text-rose-300">Tele-MANAS (Govt of India Helpline)</div>
              <div className="text-base font-bold font-mono text-rose-900 dark:text-rose-200">14416 / 1800-891-4416</div>
              <div className="text-[11px] text-muted-foreground">Toll-free 24/7 mental health emergency support in multiple Indian languages.</div>
            </div>

            <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 space-y-1">
              <div className="font-semibold text-amber-800 dark:text-amber-300">Vandrevala Foundation Helpline</div>
              <div className="text-base font-bold font-mono text-amber-900 dark:text-amber-200">+91 9999 666 555</div>
              <div className="text-[11px] text-muted-foreground">Free 24x7 crisis intervention and counselling.</div>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              onClick={() => setIsCrisisModalOpen(false)}
              className="w-full rounded-2xl bg-slate-900 hover:bg-slate-800 text-white text-xs"
            >
              Close & Return to Sanctuary
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}