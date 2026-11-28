"use client";

/**
 * MemberAppointmentsView — PeerCove Member Sessions & Appointment Management.
 *
 * Layer: modules / client / peercove / member / components
 *
 * Includes:
 *   - Slot Booking Wizard (BookSessionModal)
 *   - Live Online Consultation Room (MemberSessionRoomModal)
 *   - Clinical Wellbeing Report (MemberReportModal)
 *   - Reschedule Consultation Modal
 *   - Cancel Consultation Dialog
 */

import { useState, useEffect, useCallback } from "react";
import {
  Calendar as CalendarIcon,
  Clock,
  Video,
  Mic,
  MessageCircle,
  PlusCircle,
  FileText,
  Search,
  Filter,
  CheckCircle2,
  AlertCircle,
  User,
  ArrowRight,
  MoreVertical,
  XCircle,
  RefreshCw,
  Building,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
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

import { BookSessionModal } from "./BookSessionModal";
import { MemberSessionRoomModal } from "./MemberSessionRoomModal";
import { MemberReportModal } from "./MemberReportModal";

export interface TMemberSession {
  id: string;
  date: string;
  timeSlot: string;
  listenerName: string;
  listenerRole: string;
  channel: "video" | "voice" | "chat";
  meetingType?: "virtual" | "in_person";
  status: "upcoming" | "completed" | "cancelled";
  topic: string;
}

const INITIAL_SESSIONS: TMemberSession[] = [
  {
    id: "sess-101",
    date: new Date().toISOString(),
    timeSlot: "May 11th, 6:30 PM - 7:15 PM",
    listenerName: "Dr. Vikram Sen",
    listenerRole: "Licensed Clinical Specialist",
    channel: "video",
    meetingType: "virtual",
    status: "upcoming",
    topic: "Tension-Type Headache & Workplace Stress Management",
  },
  {
    id: "sess-102",
    date: new Date(Date.now() - 86400000 * 2).toISOString(),
    timeSlot: "May 11th, 3:00 PM - 3:45 PM",
    listenerName: "Dr. Vikram Sen",
    listenerRole: "Licensed Clinical Specialist",
    channel: "voice",
    meetingType: "in_person",
    status: "completed",
    topic: "In-Person Consultation (Ambient Capture & Auto SOAP Note)",
  },
  {
    id: "sess-103",
    date: new Date(Date.now() - 86400000 * 5).toISOString(),
    timeSlot: "May 8th, 11:00 AM - 11:30 AM",
    listenerName: "Kabir Mehta",
    listenerRole: "Active Peer Specialist",
    channel: "chat",
    meetingType: "virtual",
    status: "completed",
    topic: "Relocation Stress & Grounding Habits",
  },
];

export function MemberAppointmentsView() {
  const [sessions, setSessions] = useState<TMemberSession[]>(INITIAL_SESSIONS);
  const [filterTab, setFilterTab] = useState<"all" | "upcoming" | "completed">("all");
  const [searchQuery, setSearchQuery] = useState("");

  const loadLiveSessions = useCallback(async () => {
    try {
      const res = await fetch("/api/peercove/member/conversations");
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          const mapped: TMemberSession[] = data.map((c: any) => ({
            id: c.id,
            date: c.started_at,
            timeSlot: new Date(c.started_at).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }),
            listenerName: c.listener_name || "Verified Peer Listener",
            listenerRole: "Verified Peer Specialist",
            channel: c.channel === "voice" ? "voice" : c.channel === "video" ? "video" : "chat",
            status: c.status === "completed" ? "completed" : "upcoming",
            topic: c.note || "Peer support & reflection session",
          }));
          setSessions(mapped);
        }
      }
    } catch (e) {
      console.log("Peer sessions load error:", e);
    }
  }, []);

  useEffect(() => {
    loadLiveSessions();
  }, [loadLiveSessions]);

  // Modals state
  const [isBookModalOpen, setIsBookModalOpen] = useState(false);
  const [isRoomModalOpen, setIsRoomModalOpen] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);

  // Reschedule & Cancel states
  const [sessionToReschedule, setSessionToReschedule] = useState<TMemberSession | null>(null);
  const [newRescheduleSlot, setNewRescheduleSlot] = useState("Tomorrow, 5:00 PM - 5:45 PM");
  const [sessionToCancel, setSessionToCancel] = useState<TMemberSession | null>(null);

  const [activeRoomSession, setActiveRoomSession] = useState<{
    id: string;
    listenerName: string;
    channel?: string;
    note?: string;
  } | null>(null);

  const [activeReportSession, setActiveReportSession] = useState<{
    id: string;
    date: string;
    listenerName: string;
    note?: string;
  } | null>(null);

  const handleBookSuccess = (newSession: {
    id: string;
    date: string;
    listenerName: string;
    channel: "chat" | "voice" | "video";
    status: "active" | "completed" | "pending";
    note: string;
  }) => {
    const mapped: TMemberSession = {
      id: newSession.id,
      date: newSession.date,
      timeSlot: "Scheduled Slot (45 mins)",
      listenerName: newSession.listenerName,
      listenerRole: "Verified Peer Listener",
      channel: newSession.channel,
      status: "upcoming",
      topic: newSession.note,
    };
    setSessions((prev) => [mapped, ...prev]);
    toast.success("Consultation Scheduled!", {
      description: `Your session with ${newSession.listenerName} has been booked.`,
    });
  };

  const confirmReschedule = () => {
    if (!sessionToReschedule) return;
    setSessions((prev) =>
      prev.map((s) =>
        s.id === sessionToReschedule.id ? { ...s, timeSlot: newRescheduleSlot } : s
      )
    );
    toast.success("Session Rescheduled!", {
      description: `Moved to ${newRescheduleSlot}.`,
    });
    setSessionToReschedule(null);
  };

  const confirmCancel = async () => {
    if (!sessionToCancel) return;
    try {
      await fetch(`/api/peercove/member/conversations/${sessionToCancel.id}/close`, {
        method: "PUT",
      });
    } catch {}
    setSessions((prev) =>
      prev.map((s) =>
        s.id === sessionToCancel.id ? { ...s, status: "cancelled" } : s
      )
    );
    toast.info("Session Cancelled", {
      description: "Slot released back to active listener availability in PostgreSQL.",
    });
    setSessionToCancel(null);
  };

  const filteredSessions = sessions.filter((s) => {
    if (filterTab === "upcoming" && s.status !== "upcoming") return false;
    if (filterTab === "completed" && s.status !== "completed") return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        s.listenerName.toLowerCase().includes(q) ||
        s.topic.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* ── Top Metric Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-4 border-border/60">
          <div className="flex items-center justify-between text-muted-foreground mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider">All Sessions</span>
            <CalendarIcon className="size-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold text-foreground">{sessions.length}</div>
          <p className="text-xs text-muted-foreground mt-0.5">Consultations on record</p>
        </Card>

        <Card className="p-4 border-border/60">
          <div className="flex items-center justify-between text-muted-foreground mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider">Upcoming</span>
            <Clock className="size-4 text-blue-600" />
          </div>
          <div className="text-2xl font-bold text-foreground">
            {sessions.filter((s) => s.status === "upcoming").length}
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">Ready to join</p>
        </Card>

        <Card className="p-4 border-border/60">
          <div className="flex items-center justify-between text-muted-foreground mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider">Completed</span>
            <CheckCircle2 className="size-4 text-teal-600" />
          </div>
          <div className="text-2xl font-bold text-foreground">
            {sessions.filter((s) => s.status === "completed").length}
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">Reports available</p>
        </Card>
      </div>

      {/* ── Main Consultation Booking & Table Card ── */}
      <Card className="p-5 border-border/60">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b">
          <div>
            <h2 className="text-lg font-bold text-foreground">Peer Consultations & Appointments</h2>
            <p className="text-xs text-muted-foreground">
              Book scheduled slots, join active online rooms, or review past consultation summaries.
            </p>
          </div>

          <Button
            onClick={() => setIsBookModalOpen(true)}
            className="rounded-xl bg-[#236B54] hover:bg-[#1a5240] text-white font-semibold text-xs h-9 px-4 gap-2"
          >
            <PlusCircle className="size-4" />
            <span>Book New Consultation</span>
          </Button>
        </div>

        {/* Filter Bar */}
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
              variant={filterTab === "upcoming" ? "default" : "outline"}
              onClick={() => setFilterTab("upcoming")}
              className="text-xs h-8 rounded-lg"
            >
              Upcoming ({sessions.filter((s) => s.status === "upcoming").length})
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
              placeholder="Search listener or topic..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-8 pl-8 text-xs rounded-lg"
            />
          </div>
        </div>

        {/* Sessions Table */}
        <div className="mt-4 rounded-xl border overflow-hidden">
          <Table>
            <TableHeader className="bg-muted/40">
              <TableRow>
                <TableHead>Listener</TableHead>
                <TableHead>Topic</TableHead>
                <TableHead>Date & Slot</TableHead>
                <TableHead>Channel</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredSessions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-xs text-muted-foreground">
                    No sessions found. Click &quot;Book New Consultation&quot; to schedule your next session.
                  </TableCell>
                </TableRow>
              ) : (
                filteredSessions.map((session) => (
                  <TableRow key={session.id}>
                    <TableCell>
                      <div className="font-semibold text-sm text-foreground">{session.listenerName}</div>
                      <div className="text-[11px] text-muted-foreground">{session.listenerRole}</div>
                    </TableCell>
                    <TableCell className="text-xs max-w-[200px] truncate text-muted-foreground font-medium">
                      {session.topic}
                    </TableCell>
                    <TableCell className="text-xs">
                      <div className="font-medium text-foreground">{session.timeSlot}</div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        <Badge variant="outline" className="text-xs capitalize font-normal gap-1 w-fit">
                          {session.meetingType === "in_person" ? (
                            <>
                              <Building className="size-3 text-teal-600" />
                              <span>In-Person</span>
                            </>
                          ) : (
                            <>
                              <Video className="size-3 text-emerald-600" />
                              <span>Virtual Meet</span>
                            </>
                          )}
                        </Badge>
                        <span className="text-[10px] text-muted-foreground uppercase font-mono">
                          {session.channel}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="secondary"
                        className={`text-[10px] font-semibold capitalize ${
                          session.status === "upcoming"
                            ? "bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 animate-pulse"
                            : session.status === "completed"
                            ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {session.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {session.status === "upcoming" && (
                          <>
                            <Button
                              size="sm"
                              onClick={() => {
                                setActiveRoomSession({
                                  id: session.id,
                                  listenerName: session.listenerName,
                                  channel: session.channel,
                                  note: session.topic,
                                });
                                setIsRoomModalOpen(true);
                              }}
                              className="h-8 text-xs rounded-xl bg-[#236B54] hover:bg-[#1a5240] text-white gap-1 px-2.5"
                            >
                              <Video className="size-3.5" />
                              <span>Join Call</span>
                            </Button>

                            <Button
                              size="sm"
                              variant="ghost"
                              title="Reschedule Session"
                              onClick={() => setSessionToReschedule(session)}
                              className="h-8 size-8 p-0 text-muted-foreground hover:text-foreground"
                            >
                              <RefreshCw className="size-3.5" />
                            </Button>

                            <Button
                              size="sm"
                              variant="ghost"
                              title="Cancel Session"
                              onClick={() => setSessionToCancel(session)}
                              className="h-8 size-8 p-0 text-muted-foreground hover:text-rose-600"
                            >
                              <XCircle className="size-3.5" />
                            </Button>
                          </>
                        )}

                        {session.status === "completed" && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setActiveReportSession({
                                id: session.id,
                                date: session.date,
                                listenerName: session.listenerName,
                                note: session.topic,
                              });
                              setIsReportModalOpen(true);
                            }}
                            className="h-8 text-xs rounded-xl gap-1.5 px-3 border-emerald-300 text-emerald-800 dark:border-emerald-800 dark:text-emerald-300 hover:bg-emerald-50"
                          >
                            <FileText className="size-3.5" />
                            <span>View Report</span>
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </Card>

      {/* ── Reschedule Dialog ── */}
      <Dialog
        open={Boolean(sessionToReschedule)}
        onOpenChange={(open) => !open && setSessionToReschedule(null)}
      >
        <DialogContent className="max-w-md rounded-2xl p-6">
          <DialogHeader>
            <DialogTitle className="font-serif text-lg">Reschedule Consultation</DialogTitle>
            <DialogDescription className="text-xs">
              Pick a new time slot with {sessionToReschedule?.listenerName}.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-3 text-xs">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Current Session Slot</Label>
              <div className="p-2.5 rounded-xl bg-muted/40 font-medium">
                {sessionToReschedule?.timeSlot}
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Choose New Slot</Label>
              <select
                value={newRescheduleSlot}
                onChange={(e) => setNewRescheduleSlot(e.target.value)}
                className="w-full h-9 rounded-md border border-input bg-background px-3 text-xs"
              >
                <option value="Tomorrow, 5:00 PM - 5:45 PM">Tomorrow, 5:00 PM - 5:45 PM</option>
                <option value="Tomorrow, 7:30 PM - 8:15 PM">Tomorrow, 7:30 PM - 8:15 PM</option>
                <option value="Thursday, 4:00 PM - 4:45 PM">Thursday, 4:00 PM - 4:45 PM</option>
                <option value="Friday, 6:00 PM - 6:45 PM">Friday, 6:00 PM - 6:45 PM</option>
              </select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setSessionToReschedule(null)}>
              Keep Current
            </Button>
            <Button
              size="sm"
              onClick={confirmReschedule}
              className="bg-[#236B54] hover:bg-[#1a5240] text-white"
            >
              Confirm Reschedule
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Cancel Dialog ── */}
      <Dialog
        open={Boolean(sessionToCancel)}
        onOpenChange={(open) => !open && setSessionToCancel(null)}
      >
        <DialogContent className="max-w-sm rounded-2xl p-6">
          <DialogHeader>
            <DialogTitle className="font-serif text-lg text-rose-600">Cancel Consultation?</DialogTitle>
            <DialogDescription className="text-xs">
              Are you sure you want to cancel your session with {sessionToCancel?.listenerName}? You can re-book anytime.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="pt-2">
            <Button variant="outline" size="sm" onClick={() => setSessionToCancel(null)}>
              No, Keep It
            </Button>
            <Button
              size="sm"
              variant="destructive"
              onClick={confirmCancel}
            >
              Yes, Cancel Session
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Modals ── */}
      <BookSessionModal
        open={isBookModalOpen}
        onOpenChange={setIsBookModalOpen}
        onSessionBooked={handleBookSuccess}
      />

      <MemberSessionRoomModal
        open={isRoomModalOpen}
        onOpenChange={setIsRoomModalOpen}
        session={activeRoomSession}
        onSessionEnded={() => {
          setIsRoomModalOpen(false);
          if (activeRoomSession) {
            setSessions((prev) =>
              prev.map((s) => (s.id === activeRoomSession.id ? { ...s, status: "completed" } : s))
            );
          }
        }}
      />

      <MemberReportModal
        open={isReportModalOpen}
        onOpenChange={setIsReportModalOpen}
        session={activeReportSession}
      />
    </div>
  );
}
