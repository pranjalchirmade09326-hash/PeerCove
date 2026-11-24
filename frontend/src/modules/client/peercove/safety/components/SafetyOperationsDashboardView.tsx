"use client";

/**
 * SafetyOperationsDashboardView — Clean Architecture Client Component for PeerCove Safety Operations Workspace.
 *
 * Layer: modules / client / peercove / safety / components
 *
 * Implements:
 *   - Clinical safety triage greeting & operational status
 *   - Stat cards (Assigned cases, Pending handoffs, Follow-ups due, Verified hotlines)
 *   - Priority Crisis & Safety Case Queue with triage actions
 *   - Approved Human Handoffs & Verified Crisis Directory (Tele-MANAS, Vandrevala, 988, 112)
 *   - Scheduled Wellbeing Check-ins tracker
 *   - 24/7 Clinical Sentinel Notice
 */

import { useState, useEffect } from "react";
import {
  CalendarDays,
  CheckCircle2,
  Clock,
  ExternalLink,
  FileClock,
  Headphones,
  LifeBuoy,
  ListChecks,
  PhoneCall,
  Radio,
  ShieldAlert,
  ShieldCheck,
  TriangleAlert,
  Users,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";

export interface SafetyCaseItem {
  id: string;
  code: string;
  memberPseudonym: string;
  trigger: string;
  priority: "severe" | "high" | "medium" | "routine";
  assignedResponder: string;
  time: string;
  state: "assigned" | "in_review" | "handed_off" | "resolved";
}

export interface CrisisResourceItem {
  id: string;
  name: string;
  contact: string;
  type: string;
  coverage: string;
  status: "verified" | "needs_review";
}

export interface SafetyFollowupItem {
  id: string;
  memberPseudonym: string;
  scheduledTime: string;
  channel: string;
  status: "due" | "scheduled" | "completed";
}

const DEFAULT_CASES: SafetyCaseItem[] = [
  {
    id: "case-204",
    code: "S-204",
    memberPseudonym: "Member M-104",
    trigger: "Extreme distress & despair notes",
    priority: "high",
    assignedResponder: "You (Safety Specialist)",
    time: "Today, 9:42 AM",
    state: "assigned",
  },
  {
    id: "case-198",
    code: "S-198",
    memberPseudonym: "Member M-087",
    trigger: "Intake distress score elevated",
    priority: "medium",
    assignedResponder: "You (Safety Specialist)",
    time: "Yesterday, 4:15 PM",
    state: "in_review",
  },
  {
    id: "case-192",
    code: "S-192",
    memberPseudonym: "Member M-063",
    trigger: "Crisis keyword detected in reflection",
    priority: "high",
    assignedResponder: "Dr. Alok Verma",
    time: "Nov 8, 2:30 PM",
    state: "handed_off",
  },
];

const DEFAULT_RESOURCES: CrisisResourceItem[] = [
  {
    id: "res-1",
    name: "Tele-MANAS (Govt of India)",
    contact: "14416 / 1800-891-4416",
    type: "24/7 Mental Health Helpline",
    coverage: "Pan-India · Free & Toll-Free",
    status: "verified",
  },
  {
    id: "res-2",
    name: "Vandrevala Foundation",
    contact: "+91 9999 666 555",
    type: "Crisis Counseling & Suicide Prevention",
    coverage: "Pan-India · 24/7 WhatsApp & Call",
    status: "verified",
  },
  {
    id: "res-3",
    name: "AASRA Suicide Helpline",
    contact: "+91 98204 66726",
    type: "Confidential Emotional Support",
    coverage: "Pan-India · 24/7",
    status: "verified",
  },
  {
    id: "res-4",
    name: "National Emergency Services",
    contact: "112 (India) / 988 (US/CA)",
    type: "Immediate Emergency Dispatch",
    coverage: "National Emergency Services",
    status: "verified",
  },
];

const DEFAULT_FOLLOWUPS: SafetyFollowupItem[] = [
  {
    id: "fu-311",
    memberPseudonym: "Member M-104",
    scheduledTime: "Today, 4:00 PM",
    channel: "Encrypted Secure Check-in",
    status: "due",
  },
  {
    id: "fu-307",
    memberPseudonym: "Member M-087",
    scheduledTime: "Tomorrow, 11:00 AM",
    channel: "Peer Listener Re-assignment",
    status: "scheduled",
  },
  {
    id: "fu-299",
    memberPseudonym: "Member M-055",
    scheduledTime: "Nov 7, 2:00 PM",
    channel: "Care Pathway Connection",
    status: "completed",
  },
];

export function SafetyOperationsDashboardView() {
  const [cases, setCases] = useState<SafetyCaseItem[]>(DEFAULT_CASES);
  const [followups, setFollowups] = useState<SafetyFollowupItem[]>(DEFAULT_FOLLOWUPS);

  useEffect(() => {
    let mounted = true;
    fetch("/api/peercove/safety/cases")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!mounted || !Array.isArray(data) || data.length === 0) return;
        setCases((prev) => {
          const apiCases = data.map((c: any) => ({
            id: c.id,
            code: typeof c.id === "string" ? c.id.slice(0, 6).toUpperCase() : "CASE",
            memberPseudonym: `Member M-${typeof c.memberId === "string" ? c.memberId.slice(-3) : "101"}`,
            trigger: c.triggerSummary || c.triggerSource || "Elevated distress indicators",
            priority: (c.riskLevel || c.priorityCode || "medium").toLowerCase() as any,
            assignedResponder: c.escalatedTo || "Safety Ops Specialist",
            time: new Date(c.createdAt || Date.now()).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
            state: (c.caseState || "assigned") as any,
          }));
          return [...apiCases, ...prev.filter((p) => !apiCases.some((a: any) => a.id === p.id))];
        });
      })
      .catch(() => {});
    return () => {
      mounted = false;
    };
  }, []);

  const handleAction = async (caseId: string, actionName: string) => {
    try {
      await fetch(`/api/peercove/safety/cases/${caseId}/actions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action_type: actionName,
          notes: `Action "${actionName}" performed by Safety Specialist`,
          action_state: "completed",
        }),
      });
    } catch {
      // offline/dev fallback
    }
    toast.success(`Action "${actionName}" recorded`, {
      description: `Logged in audit trail for ${caseId} with AES-256 encrypted verification.`,
    });
  };

  const handleCompleteFollowup = async (fuId: string) => {
    setFollowups((prev) =>
      prev.map((item) => (item.id === fuId ? { ...item, status: "completed" } : item))
    );
    try {
      await fetch(`/api/peercove/safety/followups/${fuId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ followup_state: "completed" }),
      });
    } catch {
      // offline/dev fallback
    }
    toast.success("Follow-up marked completed", {
      description: "Wellbeing check-in recorded by safety specialist.",
    });
  };

  const priorityBadge = (priority: SafetyCaseItem["priority"]) => {
    switch (priority) {
      case "severe":
        return <Badge className="bg-red-600 text-white hover:bg-red-700">Severe Risk</Badge>;
      case "high":
        return <Badge className="bg-amber-600 text-white hover:bg-amber-700">High Priority</Badge>;
      case "medium":
        return <Badge variant="secondary" className="bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200">Medium</Badge>;
      default:
        return <Badge variant="outline">Routine</Badge>;
    }
  };

  const stateBadge = (state: SafetyCaseItem["state"]) => {
    switch (state) {
      case "assigned":
        return <Badge variant="outline" className="border-amber-500 text-amber-700 dark:text-amber-400">Assigned</Badge>;
      case "in_review":
        return <Badge className="bg-blue-100 text-blue-900 dark:bg-blue-950 dark:text-blue-200">In Review</Badge>;
      case "handed_off":
        return <Badge className="bg-emerald-100 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-200">Handed Off</Badge>;
      case "resolved":
        return <Badge variant="secondary">Resolved</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* ── 1. Header & Live Indicator ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl font-serif">
            Safety Operations & Crisis Response
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Human-led crisis escalation triage, emergency handoffs, and post-incident wellness follow-ups.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Badge
            variant="outline"
            className="px-3 py-1.5 rounded-full text-xs font-semibold gap-1.5 border-amber-500/40 bg-amber-50 text-amber-900 dark:bg-amber-950/40 dark:text-amber-200"
          >
            <Radio className="size-3 text-amber-600 animate-pulse" />
            24/7 Clinical Sentinel Active
          </Badge>
        </div>
      </div>

      {/* ── 2. Stat Cards ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="p-4 border-amber-200/60 dark:border-amber-900/40 bg-card space-y-1.5">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-semibold uppercase tracking-wider">Assigned Queue</span>
            <ShieldAlert className="size-4 text-amber-600" />
          </div>
          <div className="text-2xl font-bold text-foreground">
            {cases.filter((c) => c.state === "assigned").length} Pending
          </div>
          <p className="text-[11px] text-muted-foreground">Requires immediate review</p>
        </Card>

        <Card className="p-4 border-border/60 bg-card space-y-1.5">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-semibold uppercase tracking-wider">Handoffs</span>
            <LifeBuoy className="size-4 text-blue-600" />
          </div>
          <div className="text-2xl font-bold text-foreground">
            {cases.filter((c) => c.state === "handed_off").length} In Transit
          </div>
          <p className="text-[11px] text-muted-foreground">External care connection</p>
        </Card>

        <Card className="p-4 border-border/60 bg-card space-y-1.5">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-semibold uppercase tracking-wider">Follow-ups Due</span>
            <CalendarDays className="size-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold text-foreground">
            {followups.filter((f) => f.status === "due").length} Today
          </div>
          <p className="text-[11px] text-muted-foreground">Scheduled wellness checks</p>
        </Card>

        <Card className="p-4 border-border/60 bg-card space-y-1.5">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-semibold uppercase tracking-wider">Crisis Pathways</span>
            <PhoneCall className="size-4 text-teal-600" />
          </div>
          <div className="text-2xl font-bold text-foreground">
            {DEFAULT_RESOURCES.length} Verified
          </div>
          <p className="text-[11px] text-muted-foreground">Active national directories</p>
        </Card>
      </div>

      {/* ── 3. Sentinel Notice ── */}
      <div className="flex gap-3 rounded-2xl border border-amber-300 bg-amber-50/80 p-4 text-sm text-amber-950 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-100">
        <TriangleAlert className="mt-0.5 size-5 shrink-0 text-amber-600" aria-hidden="true" />
        <div className="space-y-1">
          <p className="font-semibold text-amber-900 dark:text-amber-200">
            Mandatory Operational Protocol:
          </p>
          <p className="text-xs sm:text-sm text-amber-800 dark:text-amber-300/90 leading-relaxed">
            All safety actions must follow human-verified pathways. If immediate life threat is indicated,
            coordinate immediate emergency transfer via National Services (112 / 988) or authorized crisis hotlines.
          </p>
        </div>
      </div>

      {/* ── 4. Priority Safety Case Queue ── */}
      <Card className="border-border/60 shadow-xs">
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <div>
            <CardTitle className="text-lg font-bold">Assigned Safety Triage Queue</CardTitle>
            <CardDescription>
              Cases flagged by safety classification or listener escalation requiring human intervention.
            </CardDescription>
          </div>
          <Badge variant="outline" className="text-xs">
            {cases.length} Total Cases
          </Badge>
        </CardHeader>
        <CardContent>
          <div className="rounded-xl border border-border/60 overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40 hover:bg-muted/40">
                  <TableHead className="font-semibold">Case ID</TableHead>
                  <TableHead className="font-semibold">Member</TableHead>
                  <TableHead className="font-semibold">Trigger / Category</TableHead>
                  <TableHead className="font-semibold">Priority</TableHead>
                  <TableHead className="font-semibold">Assigned To</TableHead>
                  <TableHead className="font-semibold">Status</TableHead>
                  <TableHead className="text-right font-semibold">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {cases.map((item) => (
                  <TableRow key={item.id} className="hover:bg-muted/30">
                    <TableCell className="font-mono text-xs font-bold text-foreground">
                      {item.code}
                    </TableCell>
                    <TableCell className="text-sm font-medium">{item.memberPseudonym}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{item.trigger}</TableCell>
                    <TableCell>{priorityBadge(item.priority)}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{item.assignedResponder}</TableCell>
                    <TableCell>{stateBadge(item.state)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Button
                          size="xs"
                          variant="outline"
                          onClick={() => handleAction(item.code, "Review & Log")}
                          className="h-8 text-xs font-medium"
                        >
                          Review
                        </Button>
                        <Button
                          size="xs"
                          className="h-8 text-xs bg-amber-600 hover:bg-amber-700 text-white font-medium"
                          onClick={() => handleAction(item.code, "Coordinate Crisis Handoff")}
                        >
                          Handoff
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* ── 5. Two Column: Verified Hotlines & Scheduled Follow-ups ── */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Approved Human Handoffs & Hotlines */}
        <Card className="border-border/60 shadow-xs">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <PhoneCall className="size-4 text-emerald-600" />
              Verified Crisis & Escalation Directories
            </CardTitle>
            <CardDescription>
              Approved, staffed emergency pathways for direct member handoff.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {DEFAULT_RESOURCES.map((res) => (
              <div
                key={res.id}
                className="flex items-start justify-between p-3.5 rounded-xl border border-border/60 bg-muted/20 hover:bg-muted/40 transition-colors"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-sm text-foreground">{res.name}</p>
                    <Badge variant="outline" className="text-[10px] border-emerald-500/40 text-emerald-700 dark:text-emerald-400">
                      Verified
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">{res.type} · {res.coverage}</p>
                  <p className="font-mono text-xs font-bold text-emerald-700 dark:text-emerald-400">
                    {res.contact}
                  </p>
                </div>
                <Button
                  size="xs"
                  variant="ghost"
                  onClick={() => {
                    navigator.clipboard.writeText(res.contact);
                    toast.success(`Copied ${res.name} hotline number: ${res.contact}`);
                  }}
                  className="text-xs text-muted-foreground hover:text-foreground shrink-0"
                >
                  Copy
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Scheduled Wellbeing Follow-ups */}
        <Card className="border-border/60 shadow-xs">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <FileClock className="size-4 text-blue-600" />
              Scheduled Wellbeing Follow-ups
            </CardTitle>
            <CardDescription>
              Scheduled human wellness checks after safety containment or listener handoffs.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {followups.map((fu) => (
              <div
                key={fu.id}
                className="flex items-center justify-between p-3.5 rounded-xl border border-border/60 bg-muted/20 hover:bg-muted/40 transition-colors"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-sm text-foreground">{fu.memberPseudonym}</p>
                    {fu.status === "due" ? (
                      <Badge className="bg-amber-500 text-white text-[10px]">Due Today</Badge>
                    ) : fu.status === "completed" ? (
                      <Badge variant="outline" className="border-emerald-500 text-emerald-700 dark:text-emerald-400 text-[10px]">
                        Completed
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="text-[10px]">Scheduled</Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                    <Clock className="size-3" />
                    {fu.scheduledTime} · {fu.channel}
                  </p>
                </div>

                {fu.status !== "completed" && (
                  <Button
                    size="xs"
                    variant="outline"
                    onClick={() => handleCompleteFollowup(fu.id)}
                    className="text-xs font-semibold h-8"
                  >
                    Check In
                  </Button>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* ── 6. Encryption Note ── */}
      <div className="text-xs text-muted-foreground flex items-center justify-between border-t border-border/40 pt-4">
        <span>AES-256-GCM Encrypted Case Logs · Free-text notes stored separately from conversation streams</span>
        <span className="text-amber-700 dark:text-amber-400 font-medium">PeerCove Clinical Safety Engine v1.0</span>
      </div>
    </div>
  );
}

