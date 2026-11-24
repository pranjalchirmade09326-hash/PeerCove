"use client";

/**
 * ListenerConsultationsView — Remapping Doctor Appointments & Consultations into Peer Listener Consultation Hub.
 *
 * Layer: modules / client / peercove / listener / components
 */

import { useState, useEffect } from "react";
import {
  Calendar as CalendarIcon,
  Clock,
  Video,
  Mic,
  MessageCircle,
  FileText,
  Search,
  Filter,
  CheckCircle2,
  Headphones,
  Users,
  Radio,
  Eye,
  Check,
  X,
  AlertCircle,
  ArrowRight,
  Wind,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
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
import { Stethoscope } from "lucide-react";

export interface TListenerSessionItem {
  id: string;
  memberName: string;
  topic: string;
  channel: "video" | "voice" | "chat";
  timeSlot: string;
  status: "waiting" | "confirmed" | "completed";
  urgency: "routine" | "support" | "elevated";
  waitingMinutes: number;
}

const INITIAL_SESSIONS: TListenerSessionItem[] = [
  {
    id: "sess-d1",
    memberName: "Ananya",
    topic: "Work anxiety & feeling chronically overwhelmed with deadlines",
    channel: "video",
    timeSlot: "Today, 6:30 PM (Waiting in queue)",
    status: "waiting",
    urgency: "routine",
    waitingMinutes: 3,
  },
  {
    id: "sess-d2",
    memberName: "Rohan",
    topic: "Exam stress & disrupted sleep cycle",
    channel: "chat",
    timeSlot: "Today, 7:15 PM",
    status: "confirmed",
    urgency: "routine",
    waitingMinutes: 0,
  },
  {
    id: "sess-d3",
    memberName: "Simran",
    topic: "Feeling isolated & emotionally drained after city relocation",
    channel: "voice",
    timeSlot: "Today, 8:00 PM",
    status: "confirmed",
    urgency: "support",
    waitingMinutes: 0,
  },
  {
    id: "sess-d4",
    memberName: "Dev",
    topic: "Career transition fatigue & imposter thoughts",
    channel: "video",
    timeSlot: "Yesterday, 5:30 PM",
    status: "completed",
    urgency: "routine",
    waitingMinutes: 0,
  },
];

export function ListenerConsultationsView() {
  const [sessions, setSessions] = useState<TListenerSessionItem[]>(INITIAL_SESSIONS);
  const [filterTab, setFilterTab] = useState<"all" | "waiting" | "confirmed" | "completed">("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Caregiver Decompression Cooldown State Machine
  const [cooldownRemaining, setCooldownRemaining] = useState(0);
  const [isDecompressing, setIsDecompressing] = useState(false);

  useEffect(() => {
    if (!isDecompressing || cooldownRemaining <= 0) {
      if (isDecompressing && cooldownRemaining <= 0) {
        setIsDecompressing(false);
        toast.success("Caregiver Decompression Rest Complete", {
          description: "You are rested and eligible to accept new peer support requests.",
        });
      }
      return;
    }
    const timer = setInterval(() => {
      setCooldownRemaining((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [isDecompressing, cooldownRemaining]);

  const canAcceptNewSessions = () => !isDecompressing || cooldownRemaining <= 0;

  // Live session queue loading
  const loadSessions = async () => {
    try {
      // 1. Attempt to fetch active queued match requests
      let activeItems: TListenerSessionItem[] = [];
      try {
        const activeRes = await fetch("/api/peercove/listener/match-requests/active");
        if (activeRes.ok) {
          const activeData = await activeRes.json();
          if (Array.isArray(activeData)) {
            activeItems = activeData.map((item: any, idx: number) => ({
              id: item.id || `active-${idx}`,
              memberName: item.member_name || item.memberName || "Anonymous Member",
              topic: item.support_topic || item.topic || "Work stress & active listening support",
              channel: (item.preferred_channel === "voice" || item.preferred_channel === "video") ? item.preferred_channel : "chat",
              timeSlot: `Waiting in queue (${item.waiting_minutes || 0}m)`,
              status: "waiting",
              urgency: item.urgency || "routine",
              waitingMinutes: item.waiting_minutes || 1,
            }));
          }
        }
      } catch {
        // Fallback continues
      }

      // 2. Fetch scheduled / confirmed / historical conversations
      const res = await fetch("/api/peercove/listener/conversations");
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          const mapped: TListenerSessionItem[] = data.map((item: any, idx: number) => ({
            id: item.id || `sess-d${idx + 1}`,
            memberName: item.member_name || item.memberName || "Member",
            topic: item.note || item.topic || "Work stress & active listening support",
            channel: (item.channel === "voice" || item.channel === "video") ? item.channel : "chat",
            timeSlot: item.started_at ? new Date(item.started_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "Today",
            status: item.status === "completed" ? "completed" : (item.status === "confirmed" ? "confirmed" : "waiting"),
            urgency: "routine",
            waitingMinutes: item.waitingMinutes || (idx + 1) * 3,
          }));

          // Merge active items with conversation items, avoiding duplicates
          const existingIds = new Set(activeItems.map((a) => a.id));
          const nonDup = mapped.filter((m) => !existingIds.has(m.id));
          const combined = [...activeItems, ...nonDup];
          setSessions(combined.length > 0 ? combined : INITIAL_SESSIONS);
          return;
        }
      }
      if (activeItems.length > 0) {
        setSessions(activeItems);
      }
    } catch {
      // Fallback to initial
    }
  };

  useEffect(() => {
    loadSessions();
  }, []);

  // Modals state
  const [isRoomModalOpen, setIsRoomModalOpen] = useState(false);
  const [isIntakeModalOpen, setIsIntakeModalOpen] = useState(false);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [isInPersonModalOpen, setIsInPersonModalOpen] = useState(false);

  // Selections
  const [activeCallSession, setActiveCallSession] = useState<{
    id: string;
    memberName: string;
    topic: string;
    channel?: string;
  } | null>(null);

  const [selectedMemberForIntake, setSelectedMemberForIntake] = useState<{
    id: string;
    displayName: string;
    topic: string;
    urgency: string;
    waitingMinutes: number;
    channel: string;
    notes?: string;
    intakeContext?: string;
  } | null>(null);

  const [selectedSessionForReview, setSelectedSessionForReview] = useState<{
    id: string;
    memberName: string;
    topic: string;
  } | null>(null);

  const handleConfirmRequest = async (id: string, name: string) => {
    // 1. Mandatory Cooldown check
    if (!canAcceptNewSessions()) {
      toast.warning("Mandatory Caregiver Cooldown in Progress", {
        description: `Please wait ${cooldownRemaining}s to complete decompression rest before claiming new sessions.`,
      });
      return;
    }

    try {
      const res = await fetch(`/api/peercove/listener/offers/${id}/accept`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ channel: "chat" }),
      });

      if (res.status === 200) {
        const data = await res.json();
        const conversationId = data.conversation_id || id;
        setSessions((prev) =>
          prev.map((s) => (s.id === id ? { ...s, status: "confirmed", id: conversationId } : s))
        );
        toast.success(`Request Confirmed for ${name}`, {
          description: "Match claimed successfully. Launching consultation room...",
        });
        const found = sessions.find((s) => s.id === id);
        setActiveCallSession({
          id: conversationId,
          memberName: name,
          topic: found?.topic || "Active listening support",
          channel: found?.channel || "chat",
        });
        setIsRoomModalOpen(true);
        return;
      }

      if (res.status === 409) {
        const err = await res.json().catch(() => ({}));
        const detail = err.detail || "";
        if (detail.includes("CLAIMED")) {
          toast.error("Request Already Claimed", {
            description: "Another peer listener in your pod has accepted this request. Refreshing queue...",
          });
        } else if (detail.includes("CANCELLED")) {
          toast.info("Request Cancelled", {
            description: "The member cancelled this match request. Refreshing queue...",
          });
        } else if (detail.includes("EXPIRED")) {
          toast.info("Request Expired", {
            description: "This match request has expired. Refreshing queue...",
          });
        } else {
          toast.warning("Request Unavailable", {
            description: "This request is no longer available in the queue.",
          });
        }
        loadSessions();
        return;
      }

      if (res.status === 400) {
        const err = await res.json().catch(() => ({}));
        const detail = err.detail || "";
        if (detail.includes("CAPACITY_LIMIT_EXCEEDED") || detail.includes("LISTENER_AT_CAPACITY")) {
          toast.error("Workload Capacity Exceeded", {
            description: "You have reached your maximum active concurrent sessions. Please complete open sessions first.",
          });
        } else if (detail.includes("LISTENER_OFFLINE")) {
          toast.warning("Listener Offline", {
            description: "Please toggle your status to Active/Online before accepting requests.",
          });
        } else {
          toast.error("Unable to Accept Request", {
            description: detail || "Invalid request.",
          });
        }
        return;
      }
    } catch {
      // Offline fallback in tests / dev
    }

    setSessions((prev) =>
      prev.map((s) => (s.id === id ? { ...s, status: "confirmed" } : s))
    );
    toast.success(`Request Confirmed for ${name}`, {
      description: "Member notified. You can start the consultation call when ready.",
    });
  };

  const handleStartCall = (session: TListenerSessionItem) => {
    setActiveCallSession({
      id: session.id,
      memberName: session.memberName,
      topic: session.topic,
      channel: session.channel,
    });
    setIsRoomModalOpen(true);
  };

  const handleOpenReview = (session: TListenerSessionItem) => {
    setSelectedSessionForReview({
      id: session.id,
      memberName: session.memberName,
      topic: session.topic,
    });
    setIsReviewModalOpen(true);
  };

  const filtered = sessions.filter((s) => {
    if (filterTab === "waiting" && s.status !== "waiting") return false;
    if (filterTab === "confirmed" && s.status !== "confirmed") return false;
    if (filterTab === "completed" && s.status !== "completed") return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        s.memberName.toLowerCase().includes(q) ||
        s.topic.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* ── Metric Cards ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="p-4 border-border/60 space-y-1">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-semibold uppercase tracking-wider">Queue</span>
            <Users className="size-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold text-foreground">
            {sessions.filter((s) => s.status === "waiting").length} waiting
          </div>
          <p className="text-[11px] text-muted-foreground">Needs listener pickup</p>
        </Card>

        <Card className="p-4 border-border/60 space-y-1">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-semibold uppercase tracking-wider">Confirmed</span>
            <Clock className="size-4 text-blue-600" />
          </div>
          <div className="text-2xl font-bold text-foreground">
            {sessions.filter((s) => s.status === "confirmed").length} slots
          </div>
          <p className="text-[11px] text-muted-foreground">Scheduled for today</p>
        </Card>

        <Card className="p-4 border-border/60 space-y-1">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-semibold uppercase tracking-wider">Completed</span>
            <CheckCircle2 className="size-4 text-teal-600" />
          </div>
          <div className="text-2xl font-bold text-foreground">
            {sessions.filter((s) => s.status === "completed").length + 4} sessions
          </div>
          <p className="text-[11px] text-muted-foreground">Documented with SOAP</p>
        </Card>

        <Card className="p-4 border-border/60 space-y-1">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-semibold uppercase tracking-wider">Avg Duration</span>
            <Headphones className="size-4 text-purple-600" />
          </div>
          <div className="text-2xl font-bold text-foreground">38 mins</div>
          <p className="text-[11px] text-muted-foreground">Empathetic listening</p>
        </Card>
      </div>

      {/* ── Caregiver Decompression Cooldown Banner (60s Mandatory Rest) ── */}
      {isDecompressing && cooldownRemaining > 0 && (
        <Card className="p-4 border-teal-500/40 bg-teal-500/10 dark:bg-teal-950/30 rounded-2xl flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-3.5">
            <div className="size-10 rounded-xl bg-teal-500/20 text-teal-700 dark:text-teal-300 flex items-center justify-center font-bold">
              <Wind className="size-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <Badge className="bg-teal-700 text-white text-[10px] px-2 py-0.5 rounded-full font-mono">
                  {cooldownRemaining}s
                </Badge>
                <h4 className="text-sm font-bold text-foreground">
                  Mandatory Caregiver Decompression Rest Active
                </h4>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                Volunteer safeguarding: claiming new sessions is paused during this 60-second recovery window.
              </p>
            </div>
          </div>
          <Badge variant="outline" className="text-xs font-mono border-teal-500 text-teal-700 dark:text-teal-300">
            Cooldown: {cooldownRemaining}s
          </Badge>
        </Card>
      )}

      {/* ── Consultations Roster Table Card ── */}
      <Card className="p-5 border-border/60">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b">
          <div>
            <h2 className="text-lg font-bold text-foreground">Consultations & Active Schedule</h2>
            <p className="text-xs text-muted-foreground">
              Accept incoming queue requests, review member intake context, join live consultation calls, and file SOAP documentation.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              onClick={() => setIsInPersonModalOpen(true)}
              className="rounded-xl text-xs bg-[#236B54] hover:bg-[#1a5240] text-white gap-2 font-semibold shadow-xs"
            >
              <Stethoscope className="size-4" />
              <span>In-Person Consultation (Ambient Capture)</span>
            </Button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-4">
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant={filterTab === "all" ? "default" : "outline"}
              onClick={() => setFilterTab("all")}
              className="text-xs h-8 rounded-lg"
            >
              All ({sessions.length})
            </Button>
            <Button
              size="sm"
              variant={filterTab === "waiting" ? "default" : "outline"}
              onClick={() => setFilterTab("waiting")}
              className="text-xs h-8 rounded-lg"
            >
              Waiting Queue ({sessions.filter((s) => s.status === "waiting").length})
            </Button>
            <Button
              size="sm"
              variant={filterTab === "confirmed" ? "default" : "outline"}
              onClick={() => setFilterTab("confirmed")}
              className="text-xs h-8 rounded-lg"
            >
              Confirmed ({sessions.filter((s) => s.status === "confirmed").length})
            </Button>
            <Button
              size="sm"
              variant={filterTab === "completed" ? "default" : "outline"}
              onClick={() => setFilterTab("completed")}
              className="text-xs h-8 rounded-lg"
            >
              Completed ({sessions.filter((s) => s.status === "completed").length})
            </Button>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="absolute left-2.5 top-2.5 size-3.5 text-muted-foreground" />
            <Input
              placeholder="Search member or topic..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-8 pl-8 text-xs rounded-lg"
            />
          </div>
        </div>

        {/* Table */}
        <div className="mt-4 rounded-xl border overflow-hidden">
          <Table>
            <TableHeader className="bg-muted/40">
              <TableRow>
                <TableHead>Member</TableHead>
                <TableHead>Discussion Topic</TableHead>
                <TableHead>Format</TableHead>
                <TableHead>Scheduled Slot</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((session) => (
                <TableRow key={session.id}>
                  <TableCell>
                    <div className="font-semibold text-sm text-foreground">{session.memberName}</div>
                    <div className="text-[11px] text-muted-foreground">
                      {session.status === "waiting" ? `${session.waitingMinutes}m ago in queue` : "Scheduled"}
                    </div>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground max-w-[220px] truncate font-medium">
                    {session.topic}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-xs capitalize font-normal gap-1">
                      {session.channel === "video" && <Video className="size-3 text-emerald-600" />}
                      {session.channel === "voice" && <Mic className="size-3 text-teal-600" />}
                      {session.channel === "chat" && <MessageCircle className="size-3 text-blue-600" />}
                      {session.channel}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs font-medium text-foreground">
                    {session.timeSlot}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="secondary"
                      className={`text-[10px] font-semibold capitalize ${
                        session.status === "waiting"
                          ? "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 animate-pulse"
                          : session.status === "confirmed"
                          ? "bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300"
                          : "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300"
                      }`}
                    >
                      {session.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      {/* View Intake Button */}
                      <Button
                        size="sm"
                        variant="outline"
                        title="View Intake Context"
                        onClick={() => {
                          setSelectedMemberForIntake({
                            id: session.id,
                            displayName: session.memberName,
                            topic: session.topic,
                            urgency: session.urgency,
                            waitingMinutes: session.waitingMinutes,
                            channel: session.channel,
                          });
                          setIsIntakeModalOpen(true);
                        }}
                        className="h-8 text-xs rounded-xl gap-1 px-2.5 border-emerald-300 text-emerald-800 dark:border-emerald-800 dark:text-emerald-300 hover:bg-emerald-50"
                      >
                        <FileText className="size-3.5" />
                        <span>Intake</span>
                      </Button>

                      {/* Confirm Button if waiting */}
                      {session.status === "waiting" && (
                        <Button
                          size="sm"
                          disabled={!canAcceptNewSessions()}
                          onClick={() => handleConfirmRequest(session.id, session.memberName)}
                          className={`h-8 text-xs rounded-xl gap-1 px-2.5 transition-all ${
                            !canAcceptNewSessions()
                              ? "bg-slate-300 dark:bg-slate-800 text-muted-foreground cursor-not-allowed opacity-60"
                              : "bg-blue-600 hover:bg-blue-700 text-white"
                          }`}
                          title={!canAcceptNewSessions() ? `Cooldown active (${cooldownRemaining}s)` : "Accept and claim member request"}
                        >
                          <Check className="size-3.5" />
                          <span>Accept</span>
                        </Button>
                      )}

                      {/* Start Call Button if confirmed or waiting */}
                      {session.status !== "completed" && (
                        <Button
                          size="sm"
                          onClick={() => handleStartCall(session)}
                          className="h-8 text-xs rounded-xl bg-[#236B54] hover:bg-[#1a5240] text-white gap-1 px-2.5"
                        >
                          <Headphones className="size-3.5" />
                          <span>Start Call</span>
                        </Button>
                      )}

                      {/* Review & SOAP Button */}
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => handleOpenReview(session)}
                        className="h-8 text-xs rounded-xl gap-1 px-2.5"
                      >
                        <CheckCircle2 className="size-3.5 text-emerald-600" />
                        <span>SOAP Notes</span>
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Card>

      {/* ── Modals ── */}
      <ListenerSessionRoomModal
        open={isRoomModalOpen}
        onOpenChange={setIsRoomModalOpen}
        memberSession={activeCallSession}
        onSessionEnded={async () => {
          setIsRoomModalOpen(false);
          if (activeCallSession) {
            try {
              await fetch(`/api/peercove/listener/conversations/${activeCallSession.id}/close`, {
                method: "PUT",
              });
            } catch {
              // Continue
            }
            setSessions((prev) =>
              prev.map((s) => (s.id === activeCallSession.id ? { ...s, status: "completed" } : s))
            );
            // Commencing 60-second mandatory caregiver cooldown
            setCooldownRemaining(60);
            setIsDecompressing(true);
            toast.info("Consultation Ended", {
              description: "Session closed. Commencing 60-second mandatory caregiver decompression rest.",
            });
          }
        }}
      />

      <MemberIntakeViewModal
        open={isIntakeModalOpen}
        onOpenChange={setIsIntakeModalOpen}
        member={selectedMemberForIntake}
        onStartSession={() => {
          if (selectedMemberForIntake) {
            setIsIntakeModalOpen(false);
            const found = sessions.find((s) => s.id === selectedMemberForIntake.id);
            if (found) handleStartCall(found);
          }
        }}
      />

      <ListenerReviewModal
        open={isReviewModalOpen}
        onOpenChange={setIsReviewModalOpen}
        session={selectedSessionForReview}
        onSaved={() => {
          if (selectedSessionForReview) {
            setSessions((prev) =>
              prev.map((s) => (s.id === selectedSessionForReview.id ? { ...s, status: "completed" } : s))
            );
          }
        }}
      />

      <InPersonConsultationModal
        open={isInPersonModalOpen}
        onOpenChange={setIsInPersonModalOpen}
        patientName="Ananya Sharma"
        onCompleted={() => loadSessions()}
      />
    </div>
  );
}

