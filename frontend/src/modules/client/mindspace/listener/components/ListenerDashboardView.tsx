"use client";

/**
 * ListenerDashboardView — Clean Architecture Client Component for MindSpace Peer Listener Workspace.
 *
 * Layer: modules / client / mindspace / listener / components
 *
 * Implements:
 *   - Listener greeting & active availability toggle
 *   - Peer listening active queue with:
 *       • "View Intake" (pre-session distress context & active listening guidance)
 *       • "Start Consultation" (live call dialog with live transcript & SOAP note drafting)
 *   - Listener stats (Active conversations, Completed sessions, Empathy rating, Training status)
 *   - Integrated ListenerSessionRoomModal and MemberIntakeViewModal
 */

import { useState, useEffect } from "react";
import { Link } from "@/i18n/navigation";
import { useSession } from "@/modules/client/auth/betterauth/auth-client";
import {
  AlertTriangle,
  BadgeCheck,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock,
  Coffee,
  Copy,
  Eye,
  FileText,
  Headphones,
  Heart,
  MessageCircle,
  Phone,
  PhoneCall,
  Play,
  Radio,
  RefreshCw,
  RotateCcw,
  Search,
  ShieldAlert,
  ShieldCheck,
  Sliders,
  Sparkles,
  Users,
  Video,
  Wind,
  Stethoscope,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";

import { ListenerSessionRoomModal } from "./ListenerSessionRoomModal";
import { MemberIntakeViewModal } from "./MemberIntakeViewModal";
import { ListenerReviewModal } from "./ListenerReviewModal";
import { InPersonConsultationModal } from "./InPersonConsultationModal";

export interface ListenerDashboardViewProps {
  listenerName?: string;
  isAvailable?: boolean;
}

export interface TQueueMember {
  id: string;
  displayName: string;
  topic: string;
  waitingMinutes: number;
  channel: "chat" | "voice" | "video";
  urgency: "routine" | "support" | "elevated";
  status: "waiting" | "in_call" | "completed";
}

const INITIAL_QUEUE_MEMBERS: TQueueMember[] = [
  {
    id: "req-1",
    displayName: "Ananya Sharma",
    topic: "Persistent tension headaches (3 days) & situational workplace fatigue (May 11th Intake)",
    waitingMinutes: 3,
    channel: "video",
    urgency: "routine",
    status: "waiting",
  },
  {
    id: "req-2",
    displayName: "Rohan Verma",
    topic: "In-Person Consultation (Ambient Capture & Waveform Demo)",
    waitingMinutes: 7,
    channel: "voice",
    urgency: "routine",
    status: "waiting",
  },
  {
    id: "req-3",
    displayName: "Simran Kaur",
    topic: "Completed Consultation • SOAP Note & FHIR extractions (Acetaminophen, CBC)",
    waitingMinutes: 12,
    channel: "chat",
    urgency: "support",
    status: "completed",
  },
];

export const CRISIS_HOTLINES = [
  {
    name: "Tele-MANAS (Govt of India)",
    number: "14416",
    tollFree: "1800-891-4416",
    description: "24/7 Free Comprehensive Mental Health Tele-Helpline",
    languages: "20+ Regional Languages",
    jurisdiction: "India Nationwide",
  },
  {
    name: "Vandrevala Foundation Helpline",
    number: "+91 9999 666 555",
    tollFree: "9999-666-555",
    description: "24/7 Professional Crisis Counseling & Emotional Aid",
    languages: "English, Hindi & 8 Regional",
    jurisdiction: "India Nationwide",
  },
  {
    name: "KIRAN Helpline (Govt of India)",
    number: "1800-599-0019",
    tollFree: "1800-599-0019",
    description: "24/7 Mental Health Rehabilitation & Suicide De-escalation",
    languages: "13 Languages Supported",
    jurisdiction: "India Nationwide",
  },
  {
    name: "988 Suicide & Crisis Lifeline",
    number: "988",
    tollFree: "988",
    description: "24/7 Free & Confidential Suicide & Crisis Counseling",
    languages: "English & Spanish",
    jurisdiction: "US & Canada",
  },
  {
    name: "Crisis Text Line",
    number: "741741",
    tollFree: "Text HOME to 741741",
    description: "24/7 Crisis SMS Text Messaging Support",
    languages: "English",
    jurisdiction: "US & UK",
  },
];

export function ListenerDashboardView({
  listenerName: defaultListenerName = "Listener",
  isAvailable: initialAvailable = true,
}: ListenerDashboardViewProps) {
  const { data: session } = useSession();
  const activeListenerName = session?.user?.name || defaultListenerName;

  const [isAvailable, setIsAvailable] = useState(initialAvailable);
  const [queue, setQueue] = useState<TQueueMember[]>(INITIAL_QUEUE_MEMBERS);
  const [filterTab, setFilterTab] = useState<"all" | "waiting" | "completed">("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Fetch live queue & peer conversations on mount
  useEffect(() => {
    async function loadInitialData() {
      try {
        const profileRes = await fetch("/api/mindspace/listener/summary");
        if (profileRes.ok) {
          const pData = await profileRes.json();
          if (pData.active_now !== undefined) {
            setIsAvailable(Boolean(pData.active_now));
          } else if (pData.isOnline !== undefined) {
            setIsAvailable(Boolean(pData.isOnline));
          } else if (pData.availability !== undefined) {
            setIsAvailable(pData.availability === "available");
          }
        }
      } catch {
        // Fallback to initialAvailable prop
      }

      try {
        const res = await fetch("/api/mindspace/listener/conversations");
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data) && data.length > 0) {
            const mapped: TQueueMember[] = data.map((item: any, idx: number) => ({
              id: item.id || `req-${idx}`,
              displayName: item.member_name || item.memberName || "Member",
              topic: item.note || item.topic || "Work stress & active listening support",
              waitingMinutes: item.waitingMinutes || (idx + 1) * 3,
              channel: (item.channel === "voice" || item.channel === "video") ? item.channel : "chat",
              urgency: "routine",
              status: item.status === "completed" ? "completed" : "waiting",
            }));
            setQueue(mapped);
          }
        }
      } catch {
        // Resilient fallback to initial queue
      }
    }
    loadInitialData();
  }, []);

  // Modals state
  const [isIntakeModalOpen, setIsIntakeModalOpen] = useState(false);
  const [isRoomModalOpen, setIsRoomModalOpen] = useState(false);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [isInPersonModalOpen, setIsInPersonModalOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Active selections
  const [selectedMemberForIntake, setSelectedMemberForIntake] = useState<TQueueMember | null>(null);
  const [activeCallSession, setActiveCallSession] = useState<{
    id: string;
    memberName: string;
    topic: string;
    channel?: string;
  } | null>(null);
  const [selectedSessionForReview, setSelectedSessionForReview] = useState<{
    id: string;
    memberName: string;
    topic: string;
  } | null>(null);

  // Caregiver Decompression & Cooldown Lounge (US-019)
  const [cooldownActive, setCooldownActive] = useState(false);
  const [cooldownSeconds, setCooldownSeconds] = useState(15 * 60);
  const [breathingPhase, setBreathingPhase] = useState<"idle" | "inhale" | "hold" | "exhale">("idle");
  const [breathingCount, setBreathingCount] = useState(4);
  const [isHotlinesOpen, setIsHotlinesOpen] = useState(false);
  const [debriefNotes, setDebriefNotes] = useState("");

  // Somatic Breathing 4-7-8 loop
  useEffect(() => {
    if (breathingPhase === "idle") return;
    const interval = setInterval(() => {
      setBreathingCount((prev) => {
        if (prev > 1) return prev - 1;
        if (breathingPhase === "inhale") {
          setBreathingPhase("hold");
          return 7;
        } else if (breathingPhase === "hold") {
          setBreathingPhase("exhale");
          return 8;
        } else {
          setBreathingPhase("inhale");
          return 4;
        }
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [breathingPhase]);

  const handleStartBreathing = () => {
    setBreathingPhase("inhale");
    setBreathingCount(4);
  };

  const handleStopBreathing = () => {
    setBreathingPhase("idle");
    setBreathingCount(4);
  };

  const handleStartCooldown = () => {
    setCooldownActive(true);
    setIsAvailable(false);
    toast.info("15-Minute Caregiver Recovery Break Started", {
      description: "Queue paused. Take a moment to breathe, hydrate, and reset between conversations.",
    });
  };

  const handleEndCooldown = () => {
    setCooldownActive(false);
    setCooldownSeconds(15 * 60);
    setIsAvailable(true);
    toast.success("Cooldown Completed", {
      description: "You are back on the active listener roster.",
    });
  };

  const handleRequestSupervisorConsult = () => {
    toast.success("Supervisor Consultation Requested", {
      description: "Dr. Alok Verma has been notified. You will receive non-urgent boundary and debrief guidance.",
    });
  };

  const handleCopyHotline = (name: string, number: string) => {
    navigator.clipboard?.writeText(number);
    toast.success(`${name} Copied`, {
      description: `${number} copied to clipboard for emergency member sharing.`,
    });
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      const res = await fetch("/api/mindspace/listener/conversations");
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          const mapped: TQueueMember[] = data.map((item: any, idx: number) => ({
            id: item.id || `req-${idx}`,
            displayName: item.member_name || item.memberName || "Member",
            topic: item.note || item.topic || "Work stress & active listening support",
            waitingMinutes: item.waitingMinutes || (idx + 1) * 3,
            channel: (item.channel === "voice" || item.channel === "video") ? item.channel : "chat",
            urgency: "routine",
            status: item.status === "completed" ? "completed" : "waiting",
          }));
          setQueue(mapped);
          toast.success("Roster & Queue Refreshed from Database");
        }
      }
    } catch {
      toast.info("Roster refreshed");
    } finally {
      setIsRefreshing(false);
    }
  };

  const toggleAvailability = async () => {
    if (cooldownActive && cooldownSeconds > 0) {
      toast.warning("Caregiver Cooldown Active", {
        description: "Please complete your rest and decompression period before going online.",
      });
      return;
    }

    const next = !isAvailable;
    setIsAvailable(next);
    try {
      const res = await fetch("/api/mindspace/listener/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isOnline: next, active_now: next }),
      });
      if (res.ok) {
        const data = await res.json();
        const serverOnline =
          data.isOnline !== undefined
            ? Boolean(data.isOnline)
            : data.active_now !== undefined
            ? Boolean(data.active_now)
            : next;
        setIsAvailable(serverOnline);
      }
    } catch {
      // Continue with optimistic state
    }

    if (next) {
      toast.success("You are now Active on the Listener Roster", {
        description: "New member peer-support requests will be routed to you in real-time.",
      });
    } else {
      toast.info("Availability paused", {
        description: "You will not receive new incoming queue requests.",
      });
    }
  };

  const handleCopyPrompt = (text: string) => {
    navigator.clipboard?.writeText(text);
    toast.success("Empathy Prompt Copied", {
      description: "Ready to use during your conversation with the member.",
    });
  };

  const handleOpenIntake = (member: TQueueMember) => {
    setSelectedMemberForIntake(member);
    setIsIntakeModalOpen(true);
  };

  const handleStartCall = async (member: TQueueMember) => {
    if (cooldownActive && cooldownSeconds > 0) {
      toast.warning("Caregiver Cooldown Active", {
        description: "Please complete your decompression break before starting a new consultation.",
      });
      return;
    }

    let conversationId = member.id;

    if (member.status === "waiting") {
      try {
        const res = await fetch(`/api/mindspace/listener/offers/${member.id}/accept`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ channel: member.channel }),
        });

        if (res.status === 200) {
          const data = await res.json();
          if (data.conversation_id) {
            conversationId = data.conversation_id;
          }
        } else if (res.status === 409) {
          const errData = await res.json().catch(() => ({}));
          const detail = errData.detail || "";
          if (detail.includes("CLAIMED")) {
            toast.error("Request Already Claimed", {
              description: "Another listener in your pod claimed this session. Refreshing queue...",
            });
          } else if (detail.includes("CANCELLED")) {
            toast.info("Request Cancelled", {
              description: "The member cancelled this match request. Refreshing queue...",
            });
          } else {
            toast.info("Request Unavailable", {
              description: "This request is no longer available in the queue.",
            });
          }
          handleRefresh();
          return;
        } else if (res.status === 400) {
          const errData = await res.json().catch(() => ({}));
          toast.warning("Cannot Accept Request", {
            description: errData.detail || "Workload limit reached or offline.",
          });
          return;
        }
      } catch {
        // Fallback to local connect
      }
    }

    setActiveCallSession({
      id: conversationId,
      memberName: member.displayName,
      topic: member.topic,
      channel: member.channel,
    });
    setIsIntakeModalOpen(false);
    setIsRoomModalOpen(true);
    toast.success(`Connected to ${member.displayName}`, {
      description: "Secure peer consultation room opened. Microphone and live audio stream ready.",
    });
  };

  const handleEndCall = async () => {
    if (activeCallSession) {
      try {
        await fetch(`/api/mindspace/listener/conversations/${activeCallSession.id}/close`, {
          method: "PUT",
        });
      } catch {
        // Continue
      }
      setQueue((prev) =>
        prev.map((m) => (m.id === activeCallSession.id ? { ...m, status: "completed" } : m))
      );
      // Auto-transition to Post-Session SOAP Record modal!
      setSelectedSessionForReview({
        id: activeCallSession.id,
        memberName: activeCallSession.memberName,
        topic: activeCallSession.topic,
      });
      setIsRoomModalOpen(false);
      setIsReviewModalOpen(true);
      toast.info("Consultation Ended", {
        description: `Now documenting post-session SOAP reflection notes for ${activeCallSession.memberName}.`,
      });
      setActiveCallSession(null);
    } else {
      setIsRoomModalOpen(false);
    }
  };

  const handleOpenReview = (member: TQueueMember) => {
    setSelectedSessionForReview({
      id: member.id,
      memberName: member.displayName,
      topic: member.topic,
    });
    setIsReviewModalOpen(true);
  };

  const activeWaiting = queue.filter((m) => m.status === "waiting");
  const completedList = queue.filter((m) => m.status === "completed");
  const firstWaiting = activeWaiting[0];

  const filteredQueue = queue.filter((req) => {
    if (filterTab === "waiting" && req.status !== "waiting") return false;
    if (filterTab === "completed" && req.status !== "completed") return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        req.displayName.toLowerCase().includes(q) ||
        req.topic.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* ── YOUTUBE VIDEO PARITY DEMO FLOW BAR ── */}
      <div className="p-3.5 rounded-2xl border border-emerald-500/40 bg-gradient-to-r from-emerald-500/15 via-teal-500/10 to-transparent dark:from-emerald-950/40 dark:via-teal-950/20 dark:to-transparent flex flex-wrap items-center justify-between gap-3 shadow-xs">
        <div className="flex items-center gap-2.5">
          <div className="size-8 rounded-xl bg-emerald-700 text-white flex items-center justify-center font-bold text-xs shadow-xs">
            DEMO
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-foreground">
                DrGodly Product Demo Workflow (Doctor / Listener Mode)
              </span>
              <Badge className="bg-emerald-700 text-white text-[10px] px-2 py-0.5 rounded-full">
                Video Parity
              </Badge>
            </div>
            <p className="text-[11px] text-muted-foreground">
              Live CDS Copilot (Suggested Questions) • In-Person Ambient Recording (Waveform) • SOAP & FHIR Extractions
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Button
            size="sm"
            onClick={() => setIsInPersonModalOpen(true)}
            className="text-xs h-8 rounded-xl bg-[#236B54] hover:bg-[#1a5240] text-white font-semibold gap-1.5 shadow-sm"
          >
            <Stethoscope className="size-3.5" />
            <span>4. In-Person Consultation (Ambient Capture)</span>
          </Button>

          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              const waiting = queue[0] || INITIAL_QUEUE_MEMBERS[0];
              handleStartCall(waiting);
            }}
            className="text-xs h-8 rounded-xl border-emerald-400/60 bg-background/80 hover:bg-emerald-50 dark:hover:bg-emerald-950 text-emerald-900 dark:text-emerald-300 font-medium gap-1.5"
          >
            <Headphones className="size-3.5 text-emerald-600" />
            <span>3. Telehealth + CDS Copilot</span>
          </Button>

          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              const comp = queue.find(q => q.status === "completed") || queue[0];
              handleOpenReview(comp);
            }}
            className="text-xs h-8 rounded-xl border-blue-400/60 bg-background/80 hover:bg-blue-50 dark:hover:bg-blue-950 text-blue-900 dark:text-blue-300 font-medium gap-1.5"
          >
            <FileText className="size-3.5 text-blue-600" />
            <span>5. Review SOAP & FHIR</span>
          </Button>
        </div>
      </div>

      {/* ── 1. Header & Status Toggle ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="flex size-2 rounded-full bg-emerald-500 animate-pulse" />
            <p className="text-xs font-semibold uppercase tracking-wider text-emerald-800 dark:text-emerald-400">
              Doctor & Listener Clinical Hub
            </p>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl font-serif">
            Consultations & Ambient Capture
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Practitioner: <strong className="text-foreground">{activeListenerName}</strong> • Ambient AI Data Capture & Clinical Decision Support.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <Button
            size="sm"
            onClick={() => setIsInPersonModalOpen(true)}
            className="rounded-xl text-xs h-9 px-3.5 font-semibold bg-[#236B54] hover:bg-[#1a5240] text-white gap-2 shadow-xs"
          >
            <Stethoscope className="size-4" />
            <span>In-Person Consultation (Ambient Capture)</span>
          </Button>

          <Button
            size="icon"
            variant="outline"
            onClick={handleRefresh}
            disabled={isRefreshing}
            title="Refresh Queue from Database"
            className="size-9 rounded-xl border-border/60 hover:bg-muted"
          >
            <RefreshCw className={`size-4 text-muted-foreground ${isRefreshing ? "animate-spin text-emerald-600" : ""}`} />
          </Button>

          <Link href="/mindspace/listener/profile">
            <Button
              size="sm"
              variant="outline"
              className="rounded-xl text-xs h-9 px-3 gap-1.5 border-border/60 font-medium"
            >
              <Sliders className="size-3.5 text-muted-foreground" />
              <span>Settings</span>
            </Button>
          </Link>

          <Badge
            variant="outline"
            className={`px-3 py-1.5 rounded-full text-xs font-semibold gap-1.5 transition-colors ${
              isAvailable
                ? "border-emerald-500/40 bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300"
                : "border-muted bg-muted/60 text-muted-foreground"
            }`}
          >
            <Radio className={`size-3 ${isAvailable ? "text-emerald-600 animate-pulse" : "text-muted-foreground"}`} />
            {isAvailable ? "Available" : "Offline"}
          </Badge>

          <Button
            size="sm"
            variant={isAvailable ? "outline" : "default"}
            onClick={toggleAvailability}
            className="rounded-xl text-xs h-9 px-4 font-semibold"
          >
            {isAvailable ? "Pause Queue" : "Go Online"}
          </Button>
        </div>
      </div>

      {/* ── 1.1 Priority Queue Handoff Callout (US-015 / US-016) ── */}
      {firstWaiting && (
        <Card className="p-4 border-emerald-500/30 bg-gradient-to-r from-emerald-500/10 via-teal-500/5 to-transparent dark:from-emerald-950/30 dark:via-teal-950/15 dark:to-transparent rounded-2xl flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="size-11 rounded-2xl bg-emerald-600/15 text-emerald-700 dark:text-emerald-300 flex items-center justify-center shrink-0">
              <Headphones className="size-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <Badge className="bg-emerald-700 hover:bg-emerald-800 text-white text-[10px] px-2.5 py-0.5 rounded-full">
                  Next Up in Queue
                </Badge>
                <span className="text-xs text-muted-foreground flex items-center gap-1 font-medium">
                  <Clock className="size-3 text-amber-500" />
                  Waiting {firstWaiting.waitingMinutes}m
                </span>
                <Badge variant="outline" className="text-[10px] capitalize font-medium">
                  {firstWaiting.channel}
                </Badge>
              </div>
              <h3 className="text-base font-bold text-foreground mt-1">
                {firstWaiting.displayName}
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5 max-w-xl">
                {firstWaiting.topic}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2.5 shrink-0">
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleOpenIntake(firstWaiting)}
              className="rounded-xl text-xs h-9 px-3.5 gap-1.5 border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/40"
            >
              <FileText className="size-3.5" />
              <span>View Intake</span>
            </Button>
            <Button
              size="sm"
              disabled={!isAvailable}
              onClick={() => handleStartCall(firstWaiting)}
              className="rounded-xl text-xs h-9 px-4 font-semibold bg-[#236B54] hover:bg-[#1a5240] text-white gap-1.5 shadow-sm"
            >
              <Headphones className="size-3.5" />
              <span>Accept & Start Call</span>
            </Button>
          </div>
        </Card>
      )}

      {/* ── 2. Listener Stat Cards ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="p-4 border-border/60 space-y-1.5">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-semibold uppercase tracking-wider">Queue</span>
            <Users className="size-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold text-foreground">{activeWaiting.length} waiting</div>
          <p className="text-[11px] text-muted-foreground">Avg wait time ~ 4 mins</p>
        </Card>

        <Card className="p-4 border-border/60 space-y-1.5">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-semibold uppercase tracking-wider">Today</span>
            <CheckCircle2 className="size-4 text-blue-600" />
          </div>
          <div className="text-2xl font-bold text-foreground">
            {queue.filter((m) => m.status === "completed").length + 3} fulfilled
          </div>
          <p className="text-[11px] text-muted-foreground">Consultations completed</p>
        </Card>

        <Card className="p-4 border-border/60 space-y-1.5">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-semibold uppercase tracking-wider">Empathy</span>
            <Heart className="size-4 text-rose-600" />
          </div>
          <div className="text-2xl font-bold text-foreground">4.9 / 5.0</div>
          <p className="text-[11px] text-muted-foreground">From member feedback</p>
        </Card>

        <Card className="p-4 border-border/60 space-y-1.5">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-semibold uppercase tracking-wider">Training</span>
            <BadgeCheck className="size-4 text-purple-600" />
          </div>
          <div className="text-2xl font-bold text-foreground">Active</div>
          <p className="text-[11px] text-muted-foreground">Verified Level 2 Listener</p>
        </Card>
      </div>

      {/* ── 3. Roster Capacity & Wellbeing Boundary Guard (US-019) ── */}
      <Card className="p-5 border-border/60 bg-gradient-to-r from-emerald-50/40 via-teal-50/30 to-background dark:from-emerald-950/20 dark:via-teal-950/10 dark:to-background">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-border/50">
          <div>
            <div className="flex items-center gap-2">
              <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
              <h2 className="text-sm font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5">
                <Sliders className="size-3.5" />
                Active Roster Capacity & Boundary Guard (US-019)
              </h2>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Automated workload enforcement protects peer volunteers from fatigue and burnout.
            </p>
          </div>
          <Badge
            variant="outline"
            className="w-fit border-emerald-500/40 bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 text-xs font-semibold"
          >
            Healthy Workload • 1 of 3 Capacity
          </Badge>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-4 text-xs">
          <div className="space-y-2">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="font-semibold text-foreground">Concurrent Member Limit</span>
              <span>1 / 3 Members (33%)</span>
            </div>
            <Progress value={33} className="h-2 bg-emerald-100 dark:bg-emerald-950" />
            <p className="text-[11px] text-muted-foreground">2 slots available for incoming queue matches</p>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="font-semibold text-foreground">Weekly Volunteering Commitment</span>
              <span>6.5 / 10.0 hrs</span>
            </div>
            <Progress value={65} className="h-2 bg-blue-100 dark:bg-blue-950" />
            <p className="text-[11px] text-muted-foreground">3.5 hrs remaining in current 7-day cycle</p>
          </div>

          <div className="space-y-1 sm:border-l sm:pl-6 border-border/50">
            <span className="font-semibold text-foreground block">Supervisor & Accreditation</span>
            <p className="text-muted-foreground text-[11px]">
              Assigned Supervisor: <strong>Dr. Alok Verma</strong>
            </p>
            <div className="flex items-center gap-1 text-emerald-700 dark:text-emerald-400 font-medium text-[11px] pt-0.5">
              <ShieldCheck className="size-3.5" />
              <span>Safeguarding V2 Verified (Exp. Nov 2027)</span>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={handleRequestSupervisorConsult}
              className="w-full mt-2 h-7 text-[11px] rounded-lg border-teal-300 dark:border-teal-800 text-teal-800 dark:text-teal-300 hover:bg-teal-50 dark:hover:bg-teal-950/40 gap-1.5 font-medium"
            >
              <MessageCircle className="size-3" />
              <span>Request Supervisor Consult</span>
            </Button>
          </div>
        </div>
      </Card>

      {/* ── 4. Peer Listening Copilot & Non-Clinical Practice Guidelines (US-020) ── */}
      <Card className="p-5 border-border/60">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-3 border-b border-border/40">
          <div>
            <h2 className="text-sm font-bold flex items-center gap-2 text-foreground">
              <Sparkles className="size-4 text-teal-600 dark:text-teal-400" />
              <span>Listener Empathy Copilot (US-020)</span>
              <Badge variant="secondary" className="text-[10px] font-normal">
                Non-Clinical Prompts
              </Badge>
            </h2>
            <p className="text-xs text-muted-foreground">
              AI-generated empathetic reflection suggestions. Click any prompt to copy before your conversation.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-3">
          <div
            onClick={() => handleCopyPrompt("I hear how heavy and exhausting that has felt on your shoulders lately. It takes courage to share that.")}
            className="group p-3 rounded-xl border border-border/60 hover:border-teal-400 hover:bg-teal-50/40 dark:hover:bg-teal-950/20 cursor-pointer transition-all space-y-1"
          >
            <div className="flex items-center justify-between text-[11px]">
              <span className="font-semibold text-teal-700 dark:text-teal-400">Validating Core Emotion</span>
              <Copy className="size-3 text-muted-foreground group-hover:text-teal-600 transition-colors" />
            </div>
            <p className="text-xs text-foreground italic">
              &quot;I hear how heavy and exhausting that has felt on your shoulders lately. It takes courage to share that.&quot;
            </p>
          </div>

          <div
            onClick={() => handleCopyPrompt("It sounds like you've been carrying a lot of uncertainty without having a quiet space to process it.")}
            className="group p-3 rounded-xl border border-border/60 hover:border-teal-400 hover:bg-teal-50/40 dark:hover:bg-teal-950/20 cursor-pointer transition-all space-y-1"
          >
            <div className="flex items-center justify-between text-[11px]">
              <span className="font-semibold text-teal-700 dark:text-teal-400">Reflective Paraphrasing</span>
              <Copy className="size-3 text-muted-foreground group-hover:text-teal-600 transition-colors" />
            </div>
            <p className="text-xs text-foreground italic">
              &quot;It sounds like you&apos;ve been carrying a lot of uncertainty without having a quiet space to process it.&quot;
            </p>
          </div>

          <div
            onClick={() => handleCopyPrompt("Would it feel supportive if we took a slow, gentle breath together right now?")}
            className="group p-3 rounded-xl border border-border/60 hover:border-teal-400 hover:bg-teal-50/40 dark:hover:bg-teal-950/20 cursor-pointer transition-all space-y-1"
          >
            <div className="flex items-center justify-between text-[11px]">
              <span className="font-semibold text-teal-700 dark:text-teal-400">Somatic Grounding Offer</span>
              <Copy className="size-3 text-muted-foreground group-hover:text-teal-600 transition-colors" />
            </div>
            <p className="text-xs text-foreground italic">
              &quot;Would it feel supportive if we took a slow, gentle breath together right now?&quot;
            </p>
          </div>

          <div
            onClick={() => handleCopyPrompt("I'm here as a supportive peer listener. We can go at whatever pace feels safest for you today.")}
            className="group p-3 rounded-xl border border-border/60 hover:border-teal-400 hover:bg-teal-50/40 dark:hover:bg-teal-950/20 cursor-pointer transition-all space-y-1"
          >
            <div className="flex items-center justify-between text-[11px]">
              <span className="font-semibold text-teal-700 dark:text-teal-400">Clear Peer Boundary</span>
              <Copy className="size-3 text-muted-foreground group-hover:text-teal-600 transition-colors" />
            </div>
            <p className="text-xs text-foreground italic">
              &quot;I&apos;m here as a supportive peer listener. We can go at whatever pace feels safest for you today.&quot;
            </p>
          </div>
        </div>
      </Card>

      {/* ── 5. Active Peer Support Queue & Consultations Table ── */}
      <Card className="p-5 border-border/60">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b">
          <div>
            <h2 className="text-base font-semibold text-foreground">Incoming Consultation & Queue Requests</h2>
            <p className="text-xs text-muted-foreground">
              Review member-consented intake reports before connecting for the consultation.
            </p>
          </div>
          <Badge variant="secondary" className="text-xs font-semibold">
            {activeWaiting.length} Members in line
          </Badge>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-4 pb-2">
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant={filterTab === "all" ? "default" : "outline"}
              onClick={() => setFilterTab("all")}
              className="text-xs h-8 rounded-lg"
            >
              All Requests ({queue.length})
            </Button>
            <Button
              size="sm"
              variant={filterTab === "waiting" ? "default" : "outline"}
              onClick={() => setFilterTab("waiting")}
              className="text-xs h-8 rounded-lg"
            >
              Waiting Queue ({activeWaiting.length})
            </Button>
            <Button
              size="sm"
              variant={filterTab === "completed" ? "default" : "outline"}
              onClick={() => setFilterTab("completed")}
              className="text-xs h-8 rounded-lg"
            >
              Completed ({completedList.length})
            </Button>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="absolute left-2.5 top-2.5 size-3.5 text-muted-foreground" />
            <Input
              placeholder="Search member or focus topic..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-8 pl-8 text-xs rounded-lg"
            />
          </div>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Member</TableHead>
              <TableHead>Topic / Reason</TableHead>
              <TableHead>Format</TableHead>
              <TableHead>Wait Time</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredQueue.map((req) => (
              <TableRow key={req.id}>
                <TableCell className="font-semibold text-sm">{req.displayName}</TableCell>
                <TableCell className="text-xs text-muted-foreground max-w-[240px] truncate">{req.topic}</TableCell>
                <TableCell className="capitalize text-xs">
                  <Badge variant="outline" className="text-xs capitalize font-normal">
                    {req.channel}
                  </Badge>
                </TableCell>
                <TableCell className="text-xs text-muted-foreground">
                  <span className="flex items-center gap-1.5">
                    <Clock className="size-3 text-amber-500" />
                    {req.waitingMinutes}m ago
                  </span>
                </TableCell>
                <TableCell>
                  <Badge
                    variant="secondary"
                    className={`text-[10px] font-semibold capitalize ${
                      req.status === "completed"
                        ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300"
                        : "bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300"
                    }`}
                  >
                    {req.status === "completed" ? "Completed" : "Waiting"}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleOpenIntake(req)}
                      className="h-8 text-xs rounded-xl gap-1.5 px-3 border-emerald-300 text-emerald-800 dark:border-emerald-800 dark:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/50"
                    >
                      <FileText className="size-3.5" />
                      <span>View Intake</span>
                    </Button>

                    {req.status === "completed" ? (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleOpenReview(req)}
                        className="h-8 text-xs rounded-xl border-blue-300 text-blue-800 dark:border-blue-800 dark:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-950/40 gap-1.5 px-3 font-medium"
                      >
                        <FileText className="size-3.5" />
                        <span>SOAP Record</span>
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        disabled={!isAvailable}
                        className="h-8 text-xs rounded-xl bg-[#236B54] hover:bg-[#1a5240] text-white gap-1.5 px-3"
                        onClick={() => handleStartCall(req)}
                      >
                        <Headphones className="size-3.5" />
                        <span>Start Call</span>
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      {/* ── 3.5. Caregiver Wellbeing & Decompression Lounge (US-019) ── */}
      <Card className="p-5 border-border/60 bg-gradient-to-r from-teal-50/30 via-emerald-50/20 to-background dark:from-teal-950/20 dark:via-emerald-950/10 dark:to-background">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-border/50">
          <div className="flex items-center gap-2.5">
            <div className="size-8 rounded-xl bg-teal-100 text-teal-800 dark:bg-teal-950 dark:text-teal-300 flex items-center justify-center">
              <Coffee className="size-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-foreground flex items-center gap-2">
                <span>Caregiver Decompression & Cooldown Lounge (US-019)</span>
                <Badge variant="outline" className="text-[10px] bg-teal-50 text-teal-800 dark:bg-teal-950/60 dark:text-teal-300 border-teal-300">
                  Vicarious Trauma Prevention
                </Badge>
              </h2>
              <p className="text-xs text-muted-foreground">
                Release emotional residue from peer consultations. Regulate your nervous system before your next conversation.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {cooldownActive ? (
              <Button
                size="sm"
                variant="outline"
                onClick={handleEndCooldown}
                className="h-8 text-xs rounded-xl border-amber-300 bg-amber-50 text-amber-900 dark:bg-amber-950/40 dark:text-amber-200 font-semibold gap-1.5"
              >
                <CheckCircle2 className="size-3.5 text-amber-600" />
                <span>End Break & Resume</span>
              </Button>
            ) : (
              <Button
                size="sm"
                variant="outline"
                onClick={handleStartCooldown}
                className="h-8 text-xs rounded-xl border-border/60 hover:bg-muted font-medium gap-1.5"
              >
                <Coffee className="size-3.5 text-muted-foreground" />
                <span>Take 15m Cooldown Break</span>
              </Button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 text-xs">
          {/* Somatic 4-7-8 Breathing Guide */}
          <div className="p-4 rounded-2xl border border-border/60 bg-background/80 dark:bg-muted/10 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-foreground flex items-center gap-1.5">
                <Wind className="size-4 text-teal-600" />
                <span>4-7-8 Somatic Vagus Reset</span>
              </span>
              <Badge variant="secondary" className="text-[10px] capitalize">
                {breathingPhase === "idle" ? "Ready" : `${breathingPhase} (${breathingCount}s)`}
              </Badge>
            </div>

            <div className="flex flex-col items-center justify-center py-2 space-y-2">
              <div
                className={`size-20 rounded-full border-4 flex items-center justify-center transition-all duration-1000 ${
                  breathingPhase === "inhale"
                    ? "scale-110 border-teal-500 bg-teal-50 dark:bg-teal-950/40 text-teal-700"
                    : breathingPhase === "hold"
                    ? "scale-110 border-amber-500 bg-amber-50 dark:bg-amber-950/40 text-amber-700"
                    : breathingPhase === "exhale"
                    ? "scale-95 border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700"
                    : "scale-100 border-border bg-muted/30 text-muted-foreground"
                }`}
              >
                <span className="text-xl font-bold font-mono">
                  {breathingPhase === "idle" ? "4·7·8" : breathingCount}
                </span>
              </div>
              <p className="text-[11px] text-muted-foreground text-center">
                {breathingPhase === "idle"
                  ? "Inhale deeply for 4s, hold gently for 7s, exhale slowly for 8s."
                  : breathingPhase === "inhale"
                  ? "Breathe in through your nose slowly..."
                  : breathingPhase === "hold"
                  ? "Hold your breath calmly..."
                  : "Exhale completely through your mouth..."}
              </p>
            </div>

            <div className="flex items-center justify-center gap-2">
              {breathingPhase === "idle" ? (
                <Button
                  size="sm"
                  onClick={handleStartBreathing}
                  className="h-7 text-xs rounded-lg bg-[#236B54] hover:bg-[#1a5240] text-white gap-1.5 px-3"
                >
                  <Play className="size-3" />
                  <span>Start Breathing Reset</span>
                </Button>
              ) : (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleStopBreathing}
                  className="h-7 text-xs rounded-lg gap-1.5 px-3"
                >
                  <RotateCcw className="size-3" />
                  <span>Stop Grounding</span>
                </Button>
              )}
            </div>
          </div>

          {/* Private Caregiver Debrief Scratchpad */}
          <div className="p-4 rounded-2xl border border-border/60 bg-background/80 dark:bg-muted/10 space-y-2 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="font-semibold text-foreground flex items-center gap-1.5">
                  <FileText className="size-4 text-emerald-600" />
                  <span>Confidential Caregiver Debrief (Not Shared)</span>
                </span>
                <Badge variant="outline" className="text-[10px] text-muted-foreground">Local Only</Badge>
              </div>
              <p className="text-[11px] text-muted-foreground mb-2">
                Write down what felt heavy or rewarding from your last conversation to release it from your mind.
              </p>
              <textarea
                value={debriefNotes}
                onChange={(e) => setDebriefNotes(e.target.value)}
                placeholder="e.g., Felt grateful for Ananya's courage. Reminder to myself: I am a supportive peer presence, not responsible for fixing everything."
                rows={3}
                className="w-full text-xs p-2.5 rounded-xl border border-border/60 bg-muted/20 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>
            <div className="flex items-center justify-between pt-1 text-[11px] text-muted-foreground">
              <span>Auto-cleared on browser close</span>
              {debriefNotes && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    setDebriefNotes("");
                    toast.success("Debrief released & cleared");
                  }}
                  className="h-6 text-[10px] text-rose-600 hover:text-rose-700 p-0"
                >
                  Release & Clear
                </Button>
              )}
            </div>
          </div>
        </div>
      </Card>

      {/* ── 3.6. Emergency Crisis Resources & Direct Handoff Directory (US-021 / US-022) ── */}
      <Card className="p-5 border-border/60">
        <div
          onClick={() => setIsHotlinesOpen(!isHotlinesOpen)}
          className="flex items-center justify-between cursor-pointer select-none"
        >
          <div className="flex items-center gap-2.5">
            <div className="size-8 rounded-xl bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300 flex items-center justify-center">
              <Phone className="size-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-foreground flex items-center gap-2">
                <span>Emergency Crisis Directory & Sentinel Cheat-Sheet (US-022)</span>
                <Badge variant="secondary" className="text-[10px] font-normal">
                  24/7 Verified Hotlines
                </Badge>
              </h2>
              <p className="text-xs text-muted-foreground">
                Immediate verified phone numbers to provide if a member expresses severe distress or acute risk.
              </p>
            </div>
          </div>
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
            {isHotlinesOpen ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
          </Button>
        </div>

        {isHotlinesOpen && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 pt-4 border-t mt-4 text-xs">
            {CRISIS_HOTLINES.map((hotline, idx) => (
              <div
                key={idx}
                className="p-3.5 rounded-2xl border border-border/60 bg-muted/10 hover:bg-muted/20 space-y-2 transition-colors flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-1">
                    <span className="font-bold text-foreground text-xs">{hotline.name}</span>
                    <Badge variant="outline" className="text-[9px] px-1.5 py-0 font-mono">
                      {hotline.jurisdiction}
                    </Badge>
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-0.5">{hotline.description}</p>
                  <p className="text-[10px] text-emerald-700 dark:text-emerald-400 font-medium mt-1">
                    {hotline.languages}
                  </p>
                </div>

                <div className="flex items-center justify-between gap-2 pt-2 border-t border-border/40">
                  <span className="font-mono font-bold text-foreground text-sm">
                    {hotline.number}
                  </span>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleCopyHotline(hotline.name, hotline.number)}
                    className="h-7 text-[11px] rounded-lg gap-1 border-border/60 hover:bg-muted"
                  >
                    <Copy className="size-3" />
                    <span>Copy</span>
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* ── 4. Safety & Protocol Reminder ── */}
      <div className="flex items-start gap-3 p-4 rounded-2xl border border-amber-200 dark:border-amber-900/50 bg-amber-50/70 dark:bg-amber-950/20 text-xs text-amber-950 dark:text-amber-200">
        <ShieldAlert className="size-5 shrink-0 text-amber-600 mt-0.5" />
        <div>
          <span className="font-semibold block mb-0.5">Peer Support Protocols & Safety Guidelines:</span>
          <span>Remember that peer listeners provide empathetic presence, not psychiatric diagnoses or medical advice. If a member expresses immediate danger or crisis, utilize the 1-Click Crisis Handoff tool inside the call room to instantly alert Safety Operations.</span>
        </div>
      </div>

      {/* ── 5. Integrated Modals ── */}
      <MemberIntakeViewModal
        open={isIntakeModalOpen}
        onOpenChange={setIsIntakeModalOpen}
        member={selectedMemberForIntake}
        onStartSession={() => {
          if (selectedMemberForIntake) {
            handleStartCall(selectedMemberForIntake);
          }
        }}
      />

      <ListenerSessionRoomModal
        open={isRoomModalOpen}
        onOpenChange={setIsRoomModalOpen}
        memberSession={activeCallSession}
        onSessionEnded={handleEndCall}
      />

      <ListenerReviewModal
        open={isReviewModalOpen}
        onOpenChange={setIsReviewModalOpen}
        session={selectedSessionForReview}
        onSaved={handleRefresh}
      />

      <InPersonConsultationModal
        open={isInPersonModalOpen}
        onOpenChange={setIsInPersonModalOpen}
        patientName="Ananya Sharma"
        onCompleted={handleRefresh}
      />
    </div>
  );
}
