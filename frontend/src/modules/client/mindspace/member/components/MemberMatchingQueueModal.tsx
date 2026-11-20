"use client";

import { useState, useEffect, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  Clock,
  Sparkles,
  Radio,
  Video,
  Mic,
  MessageCircle,
  CheckCircle2,
  Wind,
  X,
  AlertCircle,
  ArrowRight,
  ShieldCheck,
  UserCheck,
  Heart,
  Play,
  Pause,
  PhoneCall,
} from "lucide-react";
import { toast } from "sonner";
import {
  QueueState,
  SupportTopic,
  SupportChannel,
  MemberQueueStateMachine,
  BreathworkPacer,
} from "../domain/entities/MemberQueue";
import { MemberMatchRequestApi } from "../infrastructure/services/MemberMatchRequestApi";

export interface MemberMatchingQueueModalProps {
  open?: boolean;
  isOpen?: boolean; // Backward compatibility alias
  onOpenChange?: (open: boolean) => void;
  onClose?: () => void;
  requestId: string | null;
  initialTopic?: SupportTopic;
  initialChannel?: SupportChannel;
  preferredListenerName?: string;
  onCancel?: () => void;
  onMatched?: (matchedData: { conversationId: string; listener: any }) => void;
  onEnterRoom?: (session: {
    id: string;
    listenerName: string;
    channel: SupportChannel;
    note?: string;
  }) => void;
}

export function MemberMatchingQueueModal({
  open,
  isOpen,
  onOpenChange,
  onClose,
  requestId,
  initialTopic = "general",
  initialChannel = "chat",
  preferredListenerName,
  onCancel,
  onMatched,
  onEnterRoom,
}: MemberMatchingQueueModalProps) {
  const isModalOpen = open ?? isOpen ?? false;
  const handleOpenChange = (val: boolean) => {
    onOpenChange?.(val);
    if (!val) onClose?.();
  };

  const queueSM = useRef<MemberQueueStateMachine>(new MemberQueueStateMachine("queued"));
  const [queueState, setQueueState] = useState<QueueState>("queued");
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [matchedListener, setMatchedListener] = useState<{
    id: string;
    name?: string;
    display_name?: string;
    rating?: number;
    avatar?: string;
    specialty?: string;
  } | null>(null);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [isCancelling, setIsCancelling] = useState(false);

  // ── Somatic 4-7-8 Breathwork State ──
  // 19-second cycle: Inhale (4s) -> Hold (7s) -> Exhale (8s)
  const [isBreathworkActive, setIsBreathworkActive] = useState(true);
  const [breathPhase, setBreathPhase] = useState<"Inhale" | "Hold" | "Exhale">("Inhale");
  const [phaseSecondsRemaining, setPhaseSecondsRemaining] = useState(4);
  const [completedCycles, setCompletedCycles] = useState(0);

  // Reset or initialize state when modal opens with a new valid requestId
  useEffect(() => {
    if (isModalOpen && requestId) {
      queueSM.current = new MemberQueueStateMachine("queued");
      setQueueState("queued");
      setElapsedSeconds(0);
      setMatchedListener(null);
      setConversationId(null);
      setIsCancelling(false);
      setBreathPhase("Inhale");
      setPhaseSecondsRemaining(4);
      setCompletedCycles(0);
      setIsBreathworkActive(true);
    }
  }, [isModalOpen, requestId]);

  // ── Elapsed Waiting Timer (Monotonic wall-clock derived from queueSM) ──
  useEffect(() => {
    if (!isModalOpen || (queueState !== "queued" && queueState !== "matching")) {
      return;
    }

    const updateTimer = () => {
      const elapsed = queueSM.current.getElapsedSeconds(Date.now());
      setElapsedSeconds(elapsed);

      // Check 15-minute queue timeout (900 seconds)
      if (queueSM.current.checkTimeout(15, Date.now())) {
        setQueueState("timeout");
        toast.error("Queue Timeout Reached", {
          description: "No peer listener was available within 15 minutes. Support hotlines are available below.",
          duration: 8000,
        });
      }
    };

    updateTimer();
    const timer = setInterval(updateTimer, 1000);

    return () => clearInterval(timer);
  }, [isModalOpen, queueState]);

  // ── Somatic 4-7-8 Breathwork Pacer Interval ──
  useEffect(() => {
    if (!isModalOpen || !isBreathworkActive || queueState === "matched" || queueState === "timeout") {
      return;
    }

    const breathInterval = setInterval(() => {
      setPhaseSecondsRemaining((prevCount) => {
        if (prevCount > 1) {
          return prevCount - 1;
        }

        // Phase transitions when countdown reaches 0
        setBreathPhase((currentPhase) => {
          if (currentPhase === "Inhale") {
            // Inhale 4s -> Hold 7s
            return "Hold";
          } else if (currentPhase === "Hold") {
            // Hold 7s -> Exhale 8s
            return "Exhale";
          } else {
            // Exhale 8s -> completed 1 cycle -> Inhale 4s
            setCompletedCycles((c) => c + 1);
            return "Inhale";
          }
        });

        // Set next countdown based on incoming phase
        if (breathPhase === "Inhale") {
          return 7; // Next is Hold
        } else if (breathPhase === "Hold") {
          return 8; // Next is Exhale
        } else {
          return 4; // Next is Inhale
        }
      });
    }, 1000);

    return () => clearInterval(breathInterval);
  }, [isModalOpen, isBreathworkActive, breathPhase, queueState]);

  // ── Polling for Match Acceptance every 2000ms ──
  useEffect(() => {
    if (!isModalOpen || !requestId || (queueState !== "queued" && queueState !== "matching")) {
      return;
    }

    const pollInterval = setInterval(async () => {
      try {
        const data = await MemberMatchRequestApi.getStatus(requestId);
        if (data.request_state === "matched" && data.conversation_id) {
          const listenerInfo = data.listener || {
            id: "l-aarav",
            name: preferredListenerName || "Aarav Sharma",
            display_name: preferredListenerName || "Aarav Sharma",
            rating: 4.95,
            avatar: "AS",
            specialty: "Somatic Grounding & Stress Management",
          };

          queueSM.current.match(
            {
              id: listenerInfo.id,
              name: listenerInfo.display_name || listenerInfo.name || "Aarav Sharma",
              rating: listenerInfo.rating || 4.95,
            },
            data.conversation_id
          );

          setMatchedListener(listenerInfo);
          setConversationId(data.conversation_id);
          setQueueState("matched");
          toast.success("Matched with Peer Listener!", {
            description: `${listenerInfo.display_name || listenerInfo.name} has claimed your request.`,
          });
          onMatched?.({ conversationId: data.conversation_id, listener: listenerInfo });
        } else if (data.request_state === "matching" && queueState === "queued") {
          queueSM.current.advanceToMatching();
          setQueueState("matching");
        } else if (data.request_state === "cancelled") {
          setQueueState("cancelled");
        }
      } catch {
        // Continue polling on transient errors
      }
    }, 2000);

    return () => clearInterval(pollInterval);
  }, [isModalOpen, requestId, queueState, preferredListenerName, onMatched]);

  // ── Enter Consultation Room ──
  const handleEnterRoom = () => {
    if (!conversationId) return;
    const lName =
      matchedListener?.display_name ||
      matchedListener?.name ||
      preferredListenerName ||
      "Verified Peer Listener";

    onEnterRoom?.({
      id: conversationId,
      listenerName: lName,
      channel: initialChannel,
      note: `Peer consultation for ${initialTopic}`,
    });
    handleOpenChange(false);
  };

  // ── Handle Request Cancellation ──
  const handleCancel = async () => {
    // Guard against already-matched state: transition directly to consultation room
    if (queueSM.current.getState() === "matched" || queueState === "matched") {
      handleEnterRoom();
      return;
    }

    setIsCancelling(true);
    try {
      if (requestId) {
        await MemberMatchRequestApi.cancelRequest(requestId);
      }
      queueSM.current.cancel("member_withdrew");
      setQueueState("cancelled");
      toast.info("Match Request Withdrawn", {
        description: "You have safely left the waiting queue.",
      });
      onCancel?.();
      setTimeout(() => {
        handleOpenChange(false);
      }, 700);
    } catch (err: any) {
      if (err?.message === "REQUEST_ALREADY_CLAIMED") {
        toast.info("Match Claimed by Listener", {
          description: "A peer listener has just accepted your match offer. Entering consultation room now...",
        });
        if (requestId) {
          try {
            const data = await MemberMatchRequestApi.getStatus(requestId);
            if (data.request_state === "matched" && data.conversation_id) {
              const listenerInfo = data.listener || {
                id: "l-aarav",
                name: preferredListenerName || "Aarav Sharma",
                display_name: preferredListenerName || "Aarav Sharma",
                rating: 4.95,
                avatar: "AS",
                specialty: "Somatic Grounding & Stress Management",
              };

              if (queueSM.current.getState() === "queued" || queueSM.current.getState() === "matching") {
                queueSM.current.match(
                  {
                    id: listenerInfo.id,
                    name: listenerInfo.display_name || listenerInfo.name || "Aarav Sharma",
                    rating: listenerInfo.rating || 4.95,
                  },
                  data.conversation_id
                );
              }

              setMatchedListener(listenerInfo);
              setConversationId(data.conversation_id);
              setQueueState("matched");
              onMatched?.({ conversationId: data.conversation_id, listener: listenerInfo });
            }
          } catch {
            // Polling loop will transition smoothly on next status check
          }
        }
        return;
      }
      console.warn("Cancel notice:", err);
    } finally {
      setIsCancelling(false);
    }
  };

  // Formatted elapsed timer: mm:ss
  const formatTimer = (totalSec: number) => {
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <Dialog open={isModalOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-md max-h-[92vh] overflow-y-auto rounded-3xl p-6 border-border/80 bg-background/95 backdrop-blur-md">
        <DialogHeader className="space-y-1.5 pb-2 text-center">
          <div className="flex items-center justify-center gap-2 text-emerald-700 dark:text-emerald-400 font-semibold text-xs uppercase tracking-wider">
            <Radio className="size-4 animate-pulse text-emerald-600" />
            <span>MindSpace Live Peer Queue</span>
          </div>

          <DialogTitle className="text-xl font-bold font-serif text-foreground">
            {queueState === "queued" && "Finding Your Peer Listener"}
            {queueState === "matching" && "Connecting with Listener..."}
            {queueState === "matched" && "Listener Matched!"}
            {queueState === "cancelled" && "Request Cancelled"}
            {queueState === "timeout" && "Queue Wait Exceeded"}
          </DialogTitle>

          <DialogDescription className="text-xs text-muted-foreground">
            {queueState === "queued" &&
              "You are in the queue for a peer listener. Relax with our calming 4-7-8 breathing exercise while we match you."}
            {queueState === "matching" &&
              "A verified peer listener is reviewing and claiming your support request."}
            {queueState === "matched" &&
              "Your consultation room is ready. Enter when you are comfortable."}
            {queueState === "cancelled" &&
              "You have withdrawn from the waiting queue."}
            {queueState === "timeout" &&
              "No listener became available within 15 minutes. Support is always available through verified helplines below."}
          </DialogDescription>
        </DialogHeader>

        {/* ── Status Badge & Elapsed Timer ── */}
        <div className="flex items-center justify-between px-4 py-2.5 rounded-2xl bg-muted/40 border border-border/60 text-xs">
          <div className="flex items-center gap-2">
            <span
              className={`size-2.5 rounded-full ${
                queueState === "matched"
                  ? "bg-emerald-500 animate-none"
                  : queueState === "cancelled"
                    ? "bg-muted-foreground"
                    : queueState === "timeout"
                      ? "bg-amber-500"
                      : "bg-emerald-500 animate-ping"
              }`}
            />
            <span className="font-semibold capitalize text-foreground">
              {queueState === "queued" && "Waiting in FIFO Queue"}
              {queueState === "matching" && "Claim in Progress"}
              {queueState === "matched" && "Connected"}
              {queueState === "cancelled" && "Withdrawn"}
              {queueState === "timeout" && "Timed Out"}
            </span>
          </div>

          <div className="flex items-center gap-1.5 font-mono text-xs font-semibold text-emerald-700 dark:text-emerald-400">
            <Clock className="size-3.5" />
            <span>Wait: {formatTimer(elapsedSeconds)}</span>
          </div>
        </div>

        {/* ── Request Context Pill ── */}
        <div className="flex items-center justify-center gap-3 text-[11px] text-muted-foreground">
          <span>
            Topic: <strong className="text-foreground capitalize">{initialTopic}</strong>
          </span>
          <span>•</span>
          <span className="flex items-center gap-1">
            Channel:
            {initialChannel === "video" && <Video className="size-3 text-emerald-600" />}
            {initialChannel === "voice" && <Mic className="size-3 text-emerald-600" />}
            {initialChannel === "chat" && <MessageCircle className="size-3 text-emerald-600" />}
            <strong className="text-foreground uppercase">{initialChannel}</strong>
          </span>
        </div>

        {/* ── Somatic 4-7-8 Breathing Pacer View (Active while Queued / Matching) ── */}
        {(queueState === "queued" || queueState === "matching") && (
          <div className="my-2 p-5 rounded-3xl bg-gradient-to-b from-emerald-50/70 to-teal-50/40 dark:from-emerald-950/30 dark:to-teal-950/20 border border-emerald-500/20 text-center space-y-4">
            <div className="flex items-center justify-between text-[11px] text-emerald-800 dark:text-emerald-300 font-medium px-1">
              <span className="flex items-center gap-1.5">
                <Wind className="size-3.5 text-emerald-600" />
                Somatic 4-7-8 Grounding
              </span>
              <button
                type="button"
                onClick={() => setIsBreathworkActive(!isBreathworkActive)}
                className="hover:underline flex items-center gap-1 text-[11px] text-emerald-700 dark:text-emerald-400"
              >
                {isBreathworkActive ? (
                  <>
                    <Pause className="size-3" /> Pause
                  </>
                ) : (
                  <>
                    <Play className="size-3" /> Resume
                  </>
                )}
              </button>
            </div>

            {/* Breathing Animation Orb */}
            <div className="relative flex items-center justify-center h-36">
              {/* Outer pulsing ring */}
              <div
                className={`absolute rounded-full transition-all duration-1000 ease-in-out ${
                  breathPhase === "Inhale"
                    ? "size-32 bg-emerald-400/20 shadow-lg shadow-emerald-500/30 scale-100"
                    : breathPhase === "Hold"
                      ? "size-36 bg-cyan-400/25 shadow-xl shadow-cyan-500/30 scale-105 animate-pulse"
                      : "size-24 bg-teal-400/15 shadow-sm scale-75"
                }`}
              />

              {/* Inner animated core orb */}
              <div
                className={`relative flex flex-col items-center justify-center rounded-full text-white font-bold transition-all duration-1000 ease-in-out shadow-inner ${
                  breathPhase === "Inhale"
                    ? "size-28 bg-[#236B54] scale-100"
                    : breathPhase === "Hold"
                      ? "size-30 bg-teal-700 scale-105"
                      : "size-22 bg-[#1a5240] scale-80"
                }`}
              >
                <span className="text-2xl font-mono leading-none">
                  {phaseSecondsRemaining}s
                </span>
                <span className="text-[11px] font-medium tracking-wide uppercase mt-1 opacity-90">
                  {breathPhase}
                </span>
              </div>
            </div>

            {/* Breath Instruction Text */}
            <div className="space-y-1">
              <p className="text-xs font-semibold text-emerald-900 dark:text-emerald-200">
                {breathPhase === "Inhale" && "Inhale gently through your nose..."}
                {breathPhase === "Hold" && "Hold with calm stillness..."}
                {breathPhase === "Exhale" && "Exhale slowly through your mouth..."}
              </p>
              <p className="text-[11px] text-muted-foreground">
                🌿 {completedCycles} calming {completedCycles === 1 ? "cycle" : "cycles"} completed while waiting
              </p>
            </div>
          </div>
        )}

        {/* ── Matched Listener Card (When Matched) ── */}
        {queueState === "matched" && (
          <Card className="p-4 border-emerald-500/50 bg-emerald-50/80 dark:bg-emerald-950/40 rounded-2xl space-y-3 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="size-12 rounded-2xl bg-[#236B54] text-white flex items-center justify-center font-bold text-sm shadow-sm">
                  {matchedListener?.avatar || "PL"}
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-sm text-foreground">
                      {matchedListener?.display_name || matchedListener?.name || "Verified Peer Listener"}
                    </span>
                    <Badge variant="outline" className="text-[10px] bg-emerald-100 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-200">
                      Matched
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {matchedListener?.specialty || "Active Peer Supporter & Grounding Specialist"}
                  </p>
                </div>
              </div>

              <div className="text-right">
                <span className="text-xs font-bold text-amber-600 dark:text-amber-400">
                  {matchedListener?.rating ? `${matchedListener.rating} ★` : "4.95 ★"}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-1 text-[11px] text-emerald-800 dark:text-emerald-300">
              <ShieldCheck className="size-3.5 text-emerald-600 shrink-0" />
              <span>Trauma-informed, confidential, and safe peer connection.</span>
            </div>
          </Card>
        )}

        {/* ── Timeout Support Card (When Timed Out) ── */}
        {queueState === "timeout" && (
          <div className="p-4 rounded-2xl border border-amber-500/40 bg-amber-50/70 dark:bg-amber-950/30 text-xs space-y-2.5">
            <div className="flex items-center gap-2 font-semibold text-amber-900 dark:text-amber-200">
              <AlertCircle className="size-4 text-amber-600" />
              <span>We apologize for the wait</span>
            </div>
            <p className="text-muted-foreground text-[11px] leading-relaxed">
              All peer listeners are currently in consultation sessions. If you are experiencing distress, please reach out to immediate support hotlines:
            </p>
            <div className="grid grid-cols-2 gap-2 pt-1">
              <a
                href="tel:14416"
                className="p-2 rounded-xl border border-amber-300 dark:border-amber-800 bg-background flex items-center gap-2 text-foreground font-semibold hover:bg-muted"
              >
                <PhoneCall className="size-3.5 text-emerald-600" />
                <span>Tele-MANAS: 14416</span>
              </a>
              <a
                href="tel:988"
                className="p-2 rounded-xl border border-amber-300 dark:border-amber-800 bg-background flex items-center gap-2 text-foreground font-semibold hover:bg-muted"
              >
                <PhoneCall className="size-3.5 text-emerald-600" />
                <span>Crisis Lifeline: 988</span>
              </a>
            </div>
          </div>
        )}

        {/* ── Footer Actions ── */}
        <DialogFooter className="pt-2 border-t border-border/40 flex sm:justify-between items-center gap-2">
          {queueState === "matched" ? (
            <Button
              onClick={handleEnterRoom}
              className="w-full rounded-xl bg-[#236B54] hover:bg-[#1a5240] text-white font-semibold text-xs h-10 gap-2 shadow-sm"
            >
              <span>Enter Consultation Room</span>
              <ArrowRight className="size-4" />
            </Button>
          ) : queueState === "timeout" ? (
            <Button
              onClick={() => handleOpenChange(false)}
              className="w-full rounded-xl bg-muted text-foreground text-xs h-9 font-medium"
            >
              Close & Return to Sanctuary
            </Button>
          ) : (
            <div className="flex items-center justify-between w-full">
              <p className="text-[11px] text-muted-foreground flex items-center gap-1">
                <ShieldCheck className="size-3 text-emerald-600" />
                Encrypted & Private Queue
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={handleCancel}
                disabled={isCancelling}
                className="rounded-xl text-xs h-8 border-rose-300 dark:border-rose-900 text-rose-700 dark:text-rose-300 hover:bg-rose-50 dark:hover:bg-rose-950/40"
              >
                <X className="size-3.5 mr-1" />
                <span>{isCancelling ? "Cancelling..." : "Cancel Request"}</span>
              </Button>
            </div>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
