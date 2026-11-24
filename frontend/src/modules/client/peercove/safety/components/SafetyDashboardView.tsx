"use client";

/**
 * SafetyDashboardView — Clean Architecture Client Component for PeerCove Safety Operations.
 *
 * Layer: modules / client / peercove / safety / components
 */

import { useState } from "react";
import { Link } from "@/i18n/navigation";
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  ExternalLink,
  LifeBuoy,
  PhoneCall,
  Radio,
  ShieldAlert,
  ShieldCheck,
  UserCheck,
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

const SAFETY_CASES = [
  {
    id: "CASE-902",
    priority: "High",
    summary: "Escalated distress keywords identified during peer check-in",
    assignedTo: "Safety Specialist (You)",
    time: "8 min ago",
    status: "In Review",
  },
  {
    id: "CASE-894",
    priority: "Medium",
    summary: "Listener requested supervisor guidance regarding member boundaries",
    assignedTo: "Safety Specialist (You)",
    time: "2 hrs ago",
    status: "Coordinated",
  },
  {
    id: "CASE-880",
    priority: "Low",
    summary: "Follow-up verification after crisis resource link referral",
    assignedTo: "Safety Specialist (You)",
    time: "Yesterday",
    status: "Completed",
  },
];

export function SafetyDashboardView() {
  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2">
          <span className="flex size-2 rounded-full bg-amber-500 animate-pulse" />
          <p className="text-xs font-semibold uppercase tracking-wider text-amber-800 dark:text-amber-400">
            Clinical Safety Sentinel & Escalation
          </p>
        </div>
        <h1 className="mt-1 text-2xl font-bold tracking-tight text-foreground sm:text-3xl font-serif">
          Safety Operations
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Review escalated peer support alerts, confirm warm human handoffs, and uphold safe crisis protocols.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Assigned Cases
            </CardTitle>
            <ShieldAlert className="size-4 text-amber-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">3 Cases</div>
            <p className="mt-1 text-xs text-muted-foreground">Require prompt review</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Human Handoffs
            </CardTitle>
            <Radio className="size-4 text-rose-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">1 Pending</div>
            <p className="mt-1 text-xs text-muted-foreground">Coordination in progress</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Follow-ups Due
            </CardTitle>
            <CheckCircle2 className="size-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">2 Due Today</div>
            <p className="mt-1 text-xs text-muted-foreground">Post-referral check-in</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Protocol Compliance
            </CardTitle>
            <ShieldCheck className="size-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">100%</div>
            <p className="mt-1 text-xs text-muted-foreground">Standard operating procedures</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-lg">Assigned Safety Review Queue</CardTitle>
            <CardDescription>
              Review flagged items according to vetted protocol. Sensitive personal notes remain redacted.
            </CardDescription>
          </div>
          <Link
            href="/peercove/safety-operations/case-queue"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:underline"
          >
            Open case manager
            <ExternalLink className="size-3" />
          </Link>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Case ID</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Summary</TableHead>
                <TableHead>Reported</TableHead>
                <TableHead className="text-right">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {SAFETY_CASES.map((cs) => (
                <TableRow key={cs.id}>
                  <TableCell className="font-mono text-sm font-medium">
                    {cs.id}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={`text-xs ${
                        cs.priority === "High"
                          ? "border-rose-400 bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300"
                          : cs.priority === "Medium"
                          ? "border-amber-400 bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300"
                          : "border-slate-300 text-slate-700 dark:text-slate-300"
                      }`}
                    >
                      {cs.priority}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-foreground max-w-md">
                    {cs.summary}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">{cs.time}</TableCell>
                  <TableCell className="text-right">
                    <Badge variant="secondary" className="text-xs">
                      {cs.status}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <div className="flex gap-3 rounded-2xl border border-amber-300 bg-amber-50/70 p-4 text-sm text-amber-950 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-100">
        <ShieldAlert className="mt-0.5 size-5 shrink-0 text-amber-700 dark:text-amber-400" aria-hidden="true" />
        <div className="space-y-0.5">
          <p className="font-semibold text-amber-900 dark:text-amber-200">
            Emergency Care Handoff Notice
          </p>
          <p className="text-xs text-amber-800/90 dark:text-amber-300/80">
            PeerCove is a non-clinical emotional wellbeing and peer support platform. For severe emergency situations, direct users immediately to local emergency services or official 24/7 crisis lines (e.g. 988 or Tele-MANAS).
          </p>
        </div>
      </div>
    </div>
  );
}

