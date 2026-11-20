"use client";

/**
 * MemberConsultationView — Remapping Patient Consultation into MindSpace Member Consultation Hub.
 *
 * Layer: modules / client / mindspace / member / components
 *
 * Features:
 *   - Match Request & Queue Lifecycle (MatchRequestCreate DTO, queue state machine)
 *   - Live Queue Waiting UI with elapsed timer & cancel trigger
 *   - Smooth transition into MemberSessionRoomModal on match acceptance
 */

import { useState, useEffect, useRef } from "react";
import {
  Video,
  Mic,
  MessageCircle,
  Calendar,
  Sparkles,
  ShieldCheck,
  Clock,
  Radio,
  UserCheck,
  CheckCircle2,
  ArrowRight,
  X,
  AlertCircle,
  RefreshCw,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { toast } from "sonner";

import { MemberSessionRoomModal } from "./MemberSessionRoomModal";
import { BookSessionModal } from "./BookSessionModal";
import { MemberMatchingQueueModal } from "./MemberMatchingQueueModal";
import {
  MemberQueueStateMachine,
  QueueState,
  SupportTopic,
  SupportChannel,
  VALID_TOPICS,
} from "../domain/entities/MemberQueue";

const ONLINE_LISTENERS = [
  {
    id: "l-1",
    name: "Aarav Sharma",
    specialty: "Work Stress & Grounding",
    topic: "stress" as SupportTopic,
    rating: "4.9 ★",
    avatar: "AS",
    status: "Available Now",
    channel: "video" as SupportChannel,
  },
  {
    id: "l-2",
    name: "Priya Nair",
    specialty: "Somatic Breathwork & Sleep",
    topic: "sleep" as SupportTopic,
    rating: "4.9 ★",
    avatar: "PN",
    status: "Available Now",
    channel: "voice" as SupportChannel,
  },
  {
    id: "l-3",
    name: "Kabir Mehta",
    specialty: "Social Anxiety & Mindfulness",
    topic: "anxiety" as SupportTopic,
    rating: "4.8 ★",
    avatar: "KM",
    status: "In Session (Free in 10m)",
    channel: "chat" as SupportChannel,
  },
];

export function MemberConsultationView() {
  const [isRoomModalOpen, setIsRoomModalOpen] = useState(false);
  const [isBookModalOpen, setIsBookModalOpen] = useState(false);
  const [isQueueModalOpen, setIsQueueModalOpen] = useState(false);
  const [activeSession, setActiveSession] = useState<{
    id: string;
    listenerName: string;
    channel?: string;
    note?: string;
  } | null>(null);

  // ── Queue Lifecycle State Machine ──
  const queueSM = useRef<MemberQueueStateMachine>(new MemberQueueStateMachine());
  const [queueState, setQueueState] = useState<QueueState>("idle");
  const [activeRequestId, setActiveRequestId] = useState<string | null>(null);
  const [queueElapsedSeconds, setQueueElapsedSeconds] = useState(0);
  const [isCancellingQueue, setIsCancellingQueue] = useState(false);
  const [queuedDetails, setQueuedDetails] = useState<{
    listenerName: string;
    specialty: string;
    channel: SupportChannel;
    topic: SupportTopic;
  } | null>(null);

  // Live timer tick for queue waiting state
  useEffect(() => {
    if (queueState !== "queued" && queueState !== "matching") {
      return;
    }

    const updateTimer = () => {
      const elapsed = queueSM.current.getElapsedSeconds(Date.now());
      setQueueElapsedSeconds(elapsed);
      if (queueSM.current.checkTimeout(15, Date.now())) {
        setQueueState("timeout");
        toast.error("Queue Timeout Reached", {
          description: "No peer listener was able to connect within 15 minutes. Please try again or explore self-help resources.",
        });
      }
    };

    updateTimer();
    const timer = setInterval(updateTimer, 1000);

    return () => clearInterval(timer);
  }, [queueState]);

  // Polling for match acceptance from peer listener
  useEffect(() => {
    if ((queueState !== "queued" && queueState !== "matching") || !activeRequestId) {
      return;
    }

    const pollInterval = setInterval(async () => {
      try {
        const res = await fetch(`/api/mindspace/member/match-requests/${activeRequestId}`);
        if (res.ok) {
          const data = await res.json();
          if (data.request_state === "matched" && data.conversation_id) {
            queueSM.current.match(
              data.listener || {
                id: "l-aarav",
                name: queuedDetails?.listenerName || "Aarav Sharma",
                rating: 4.9,
              },
              data.conversation_id
            );
            handleMatchSuccessful(data.conversation_id, data.listener);
            return;
          } else if (data.request_state === "matching" && queueState === "queued") {
            queueSM.current.advanceToMatching();
            setQueueState("matching");
          }
        }
      } catch {
        // Continue polling
      }
    }, 2000);

    return () => {
      clearInterval(pollInterval);
    };
  }, [queueState, activeRequestId, queuedDetails]);

  const handleMatchSuccessful = (convId: string, listener?: any) => {
    const lName = listener?.display_name || listener?.name || queuedDetails?.listenerName || "Aarav Sharma (Verified Peer Listener)";
    setQueueState("matched");
    toast.success(`Matched with ${lName}!`, {
      description: "Listener has claimed your session. Transitioning to consultation room...",
      duration: 3500,
    });

    setIsQueueModalOpen(false);

    setTimeout(() => {
      setActiveSession({
        id: convId,
        listenerName: lName,
        channel: queuedDetails?.channel || "voice",
        note: `Peer consultation for ${queuedDetails?.specialty || "wellbeing & stress relief"}`,
      });
      setQueueState("idle");
      setActiveRequestId(null);
      setIsRoomModalOpen(true);
    }, 900);
  };

  // Initiate Match Request into active FIFO Queue
  const startInstantCall = async (
    listener: (typeof ONLINE_LISTENERS)[0] | { name: string; channel: SupportChannel; specialty: string; topic: SupportTopic }
  ) => {
    const targetTopic: SupportTopic = (listener.topic as SupportTopic) || "general";
    const targetChannel: SupportChannel = listener.channel || "voice";

    // Initialize State Machine
    queueSM.current = new MemberQueueStateMachine();
    queueSM.current.queue();
    setQueueState("queued");
    setQueueElapsedSeconds(0);
    setQueuedDetails({
      listenerName: listener.name,
      specialty: listener.specialty,
      channel: targetChannel,
      topic: targetTopic,
    });

    let reqId = `mr-${Date.now()}`;

    try {
      const res = await fetch("/api/mindspace/member/match-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          support_topic: targetTopic,
          preferred_channel: targetChannel,
          preferred_languages: ["en"],
          consent_share_intake: true,
          notes: `Instant consultation request for ${listener.specialty}`,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.id) {
          reqId = data.id;
        }
      }
    } catch {
      // Offline fallback preserves seamless queue
    }

    setActiveRequestId(reqId);
    setIsQueueModalOpen(true);
    toast.info("Peer Session Request Queued", {
      description: "Finding available verified listener in active roster. Opening queue room...",
    });
  };

  // Cancel match request while queued
  const handleCancelQueue = async () => {
    setIsCancellingQueue(true);
    try {
      queueSM.current.cancel("member_withdrew");
      if (activeRequestId) {
        await fetch("/api/mindspace/member/match-request/cancel", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: activeRequestId }),
        });
      }
    } catch {}

    setQueueState("cancelled");
    toast.success("Match Request Cancelled", {
      description: "You have withdrawn from the waiting queue. Returning to sanctuary.",
    });

    setTimeout(() => {
      setQueueState("idle");
      setActiveRequestId(null);
      setQueuedDetails(null);
      setIsCancellingQueue(false);
    }, 600);
  };

  const formatTimer = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl font-serif">
            Consultation Rooms & Peer Sessions
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Choose your preferred consultation format — connect instantly or schedule ahead.
          </p>
        </div>

        <Button
          onClick={() => setIsBookModalOpen(true)}
          className="rounded-xl bg-[#236B54] hover:bg-[#1a5240] text-white font-semibold text-xs h-9 px-4 gap-2"
        >
          <Calendar className="size-4" />
          <span>Schedule Future Slot</span>
        </Button>
      </div>

      {/* ── Active Queue Waiting Banner (if queued) ── */}
      {(queueState === "queued" || queueState === "matching") && (
        <Card className="p-5 border-emerald-500/50 bg-emerald-50/60 dark:bg-emerald-950/30 rounded-2xl animate-in fade-in zoom-in-95 duration-200">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start sm:items-center gap-3.5">
              <div className="relative flex items-center justify-center size-10 rounded-xl bg-[#236B54] text-white">
                <Radio className="size-5 animate-pulse" />
                <span className="absolute inset-0 rounded-xl border border-emerald-400 animate-ping opacity-50" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-sm text-foreground">
                    {queueState === "matching" ? "Matching with Peer Listener..." : "In Queue for Peer Listener"}
                  </h3>
                  <Badge variant="outline" className="text-[10px] bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300 border-emerald-400">
                    Live FIFO Active
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Requested: <strong className="text-foreground capitalize">{queuedDetails?.topic}</strong> ({queuedDetails?.channel.toUpperCase()}) • Preferred: {queuedDetails?.listenerName}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsQueueModalOpen(true)}
                className="rounded-xl text-xs h-8 border-emerald-400 dark:border-emerald-700 text-emerald-800 dark:text-emerald-200 hover:bg-emerald-100/60"
              >
                <Sparkles className="size-3.5 mr-1" />
                <span>Open Queue Room</span>
              </Button>
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-background border border-border text-xs font-mono font-semibold text-emerald-700 dark:text-emerald-400">
                <Clock className="size-3.5" />
                <span>Elapsed: {formatTimer(queueElapsedSeconds)}</span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleCancelQueue}
                disabled={isCancellingQueue}
                className="rounded-xl text-xs h-8 border-rose-300 dark:border-rose-900 text-rose-700 dark:text-rose-300 hover:bg-rose-50"
              >
                <X className="size-3.5 mr-1" />
                <span>Cancel Request</span>
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* ── 3 Main Consultation Format Cards ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Video Consultation */}
        <Card className="p-5 border-border/60 hover:border-emerald-500/50 transition-all flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <div className="flex size-11 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
              <Video className="size-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-foreground">Video Consultation</h3>
              <p className="text-xs text-muted-foreground mt-1 leading-5">
                Face-to-face peer reflection in a private WebRTC encrypted video room. Camera optional.
              </p>
            </div>
          </div>

          <Button
            onClick={() => startInstantCall(ONLINE_LISTENERS[0])}
            disabled={queueState === "queued" || queueState === "matching"}
            className="w-full rounded-xl bg-[#236B54] hover:bg-[#1a5240] text-white text-xs h-9 font-semibold gap-1.5 disabled:opacity-50"
          >
            <Video className="size-3.5" />
            <span>Launch Video Room</span>
          </Button>
        </Card>

        {/* Audio Consultation */}
        <Card className="p-5 border-border/60 hover:border-teal-500/50 transition-all flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <div className="flex size-11 items-center justify-center rounded-2xl bg-teal-100 text-teal-800 dark:bg-teal-950 dark:text-teal-300">
              <Mic className="size-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-foreground">Voice / Audio Consultation</h3>
              <p className="text-xs text-muted-foreground mt-1 leading-5">
                Low-pressure audio space. Talk it through out loud with a trained empathetic listener.
              </p>
            </div>
          </div>

          <Button
            onClick={() => startInstantCall(ONLINE_LISTENERS[1])}
            disabled={queueState === "queued" || queueState === "matching"}
            variant="outline"
            className="w-full rounded-xl border-teal-300 dark:border-teal-800 text-teal-800 dark:text-teal-300 hover:bg-teal-50 text-xs h-9 font-semibold gap-1.5 disabled:opacity-50"
          >
            <Mic className="size-3.5" />
            <span>Start Voice Call</span>
          </Button>
        </Card>

        {/* Chat Consultation */}
        <Card className="p-5 border-border/60 hover:border-blue-500/50 transition-all flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <div className="flex size-11 items-center justify-center rounded-2xl bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300">
              <MessageCircle className="size-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-foreground">Confidential Text Chat</h3>
              <p className="text-xs text-muted-foreground mt-1 leading-5">
                Take your time to write. Real-time text dialogue or asynchronous reflection check-in.
              </p>
            </div>
          </div>

          <Button
            onClick={() => startInstantCall(ONLINE_LISTENERS[2])}
            disabled={queueState === "queued" || queueState === "matching"}
            variant="outline"
            className="w-full rounded-xl border-blue-300 dark:border-blue-800 text-blue-800 dark:text-blue-300 hover:bg-blue-50 text-xs h-9 font-semibold gap-1.5 disabled:opacity-50"
          >
            <MessageCircle className="size-3.5" />
            <span>Open Chat Room</span>
          </Button>
        </Card>
      </div>

      {/* ── Active Listeners Roster ── */}
      <Card className="p-5 border-border/60">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base font-semibold text-foreground">Listeners on Duty</h2>
            <p className="text-xs text-muted-foreground">Verified peer listeners available to connect right now.</p>
          </div>
          <Badge
            variant="outline"
            className="text-xs border-emerald-500/40 bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 gap-1.5"
          >
            <Radio className="size-3 text-emerald-600 animate-pulse" />
            2 Available Live
          </Badge>
        </div>

        <div className="space-y-3">
          {ONLINE_LISTENERS.map((listener) => (
            <div
              key={listener.id}
              className="flex items-center justify-between p-3.5 rounded-2xl border border-border/60 bg-muted/20 hover:bg-muted/40 transition-colors"
            >
              <div className="flex items-center gap-3.5">
                <div className="flex size-10 items-center justify-center rounded-xl bg-[#236B54]/10 text-[#236B54] font-bold text-xs">
                  {listener.avatar}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm text-foreground">{listener.name}</span>
                    <Badge variant="secondary" className="text-[10px] h-4 px-1.5 font-normal">
                      {listener.rating}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">{listener.specialty}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-xs text-emerald-700 dark:text-emerald-400 font-medium hidden sm:inline">
                  {listener.status}
                </span>
                <Button
                  size="sm"
                  onClick={() => startInstantCall(listener)}
                  disabled={queueState === "queued" || queueState === "matching"}
                  className="rounded-xl bg-[#236B54] hover:bg-[#1a5240] text-white text-xs h-8 px-3.5 gap-1.5 disabled:opacity-50"
                >
                  <span>Connect</span>
                  <ArrowRight className="size-3" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* ── Modals ── */}
      <MemberMatchingQueueModal
        open={isQueueModalOpen}
        onOpenChange={setIsQueueModalOpen}
        requestId={activeRequestId}
        initialTopic={queuedDetails?.topic || "general"}
        initialChannel={queuedDetails?.channel || "chat"}
        preferredListenerName={queuedDetails?.listenerName}
        onMatched={(data) => {
          handleMatchSuccessful(data.conversationId, data.listener);
        }}
        onEnterRoom={(session) => {
          setIsQueueModalOpen(false);
          setActiveSession(session);
          setQueueState("idle");
          setActiveRequestId(null);
          setIsRoomModalOpen(true);
        }}
        onCancel={() => {
          setIsQueueModalOpen(false);
          setQueueState("idle");
          setActiveRequestId(null);
          setQueuedDetails(null);
        }}
      />

      <MemberSessionRoomModal
        open={isRoomModalOpen}
        onOpenChange={setIsRoomModalOpen}
        session={activeSession}
        onSessionEnded={() => {
          setIsRoomModalOpen(false);
          setActiveSession(null);
        }}
      />

      <BookSessionModal
        open={isBookModalOpen}
        onOpenChange={setIsBookModalOpen}
        onRequestInitiated={(matchData) => {
          setIsBookModalOpen(false);
          queueSM.current = new MemberQueueStateMachine("queued");
          setQueueState("queued");
          setQueueElapsedSeconds(0);
          setActiveRequestId(matchData.id);
          setQueuedDetails({
            listenerName: "Verified Peer Listener",
            specialty: matchData.support_topic || "Daily Stress & Burnout",
            channel: (matchData.preferred_channel as SupportChannel) || "chat",
            topic: (matchData.support_topic as SupportTopic) || "general",
          });
          setIsQueueModalOpen(true);
        }}
        onSessionBooked={() => {
          setIsBookModalOpen(false);
          toast.success("Consultation Slot Reserved!", {
            description: "View details in your Sessions & Appointments section.",
          });
        }}
      />
    </div>
  );
}
