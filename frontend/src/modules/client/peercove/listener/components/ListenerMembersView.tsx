"use client";

/**
 * ListenerMembersView — Remapping Doctor Clinical Records & Patient Workspace into Peer Listener Member Histories.
 *
 * Layer: modules / client / peercove / listener / components
 */

import { useState } from "react";
import {
  Users,
  Search,
  FileText,
  Clock,
  Heart,
  ShieldCheck,
  CheckCircle2,
  Calendar,
  Activity,
  ArrowRight,
  Eye,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

import { ListenerReviewModal } from "./ListenerReviewModal";

export interface TAssignedMember {
  id: string;
  alias: string;
  pronouns: string;
  totalEncounters: number;
  lastSessionDate: string;
  primaryFocus: string;
  sentimentShift: string;
  triageTier: "Tier 1: Mild Distress" | "Tier 2: Moderate Work Stress" | "Tier 0: Routine Wellbeing";
}

const MOCK_ASSIGNED_MEMBERS: TAssignedMember[] = [
  {
    id: "mem-1",
    alias: "Ananya",
    pronouns: "she/her",
    totalEncounters: 3,
    lastSessionDate: "Today",
    primaryFocus: "Work burnout & bedtime racing thoughts",
    sentimentShift: "+22% Calmness improvement",
    triageTier: "Tier 1: Mild Distress",
  },
  {
    id: "mem-2",
    alias: "Rohan",
    pronouns: "he/him",
    totalEncounters: 2,
    lastSessionDate: "Nov 6",
    primaryFocus: "Exam stress & sleep schedule disruption",
    sentimentShift: "+15% Focus restoration",
    triageTier: "Tier 1: Mild Distress",
  },
  {
    id: "mem-3",
    alias: "Simran",
    pronouns: "they/them",
    totalEncounters: 4,
    lastSessionDate: "Nov 3",
    primaryFocus: "City relocation & emotional isolation",
    sentimentShift: "+28% Social grounding",
    triageTier: "Tier 2: Moderate Work Stress",
  },
  {
    id: "mem-4",
    alias: "Dev",
    pronouns: "he/him",
    totalEncounters: 1,
    lastSessionDate: "Oct 28",
    primaryFocus: "Career transition fatigue & imposter reflex",
    sentimentShift: "Baseline established",
    triageTier: "Tier 0: Routine Wellbeing",
  },
];

export function ListenerMembersView() {
  const [members] = useState<TAssignedMember[]>(MOCK_ASSIGNED_MEMBERS);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedMember, setSelectedMember] = useState<TAssignedMember | null>(null);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);

  const filtered = members.filter(
    (m) =>
      m.alias.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.primaryFocus.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleOpenSoapHistory = (member: TAssignedMember) => {
    setSelectedMember(member);
    setIsReviewModalOpen(true);
  };

  const handleScheduleFollowup = (alias: string) => {
    toast.success(`Autonomous 48-Hour Check-In Armed for ${alias}`, {
      description: "Follow-Up Agent armed to send gentle longitudinal check-in as per US-017.",
    });
  };

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl font-serif">
            Member Records & Histories
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Review past encounter SOAP notes, sentiment shifts, and follow-up plans for members you support.
          </p>
        </div>

        <Badge
          variant="outline"
          className="border-emerald-500/40 bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 gap-1.5"
        >
          <ShieldCheck className="size-3.5 text-emerald-600" />
          Member-Consented Records
        </Badge>
      </div>

      {/* ── Top Metric Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-4 border-border/60">
          <div className="flex items-center justify-between text-muted-foreground mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider">Members Supported</span>
            <Users className="size-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold text-foreground">{members.length}</div>
          <p className="text-xs text-muted-foreground mt-0.5">Under your listening care</p>
        </Card>

        <Card className="p-4 border-border/60">
          <div className="flex items-center justify-between text-muted-foreground mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Encounters</span>
            <FileText className="size-4 text-blue-600" />
          </div>
          <div className="text-2xl font-bold text-foreground">
            {members.reduce((acc, m) => acc + m.totalEncounters, 0)}
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">Documented sessions</p>
        </Card>

        <Card className="p-4 border-border/60">
          <div className="flex items-center justify-between text-muted-foreground mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider">Avg Sentiment Shift</span>
            <Activity className="size-4 text-teal-600" />
          </div>
          <div className="text-lg font-bold text-emerald-600 dark:text-emerald-400">+21.6%</div>
          <p className="text-xs text-muted-foreground mt-0.5">Post-session calmness gain</p>
        </Card>
      </div>

      {/* ── Search Bar ── */}
      <div className="relative w-full sm:w-80">
        <Search className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
        <Input
          placeholder="Search member alias or focus topic..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9 h-9 text-xs rounded-xl"
        />
      </div>

      {/* ── Member Cards List ── */}
      <div className="space-y-4">
        {filtered.map((member) => (
          <Card key={member.id} className="p-5 border-border/60 hover:shadow-xs transition-shadow">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-base text-foreground">{member.alias}</span>
                  <Badge variant="secondary" className="text-[10px] font-normal">
                    {member.pronouns}
                  </Badge>
                  <Badge
                    variant="outline"
                    className="text-[10px] border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40"
                  >
                    {member.triageTier}
                  </Badge>
                </div>

                <p className="text-xs text-muted-foreground font-medium">
                  Primary Focus: <strong className="text-foreground">{member.primaryFocus}</strong>
                </p>

                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground pt-1">
                  <span className="flex items-center gap-1">
                    <Calendar className="size-3.5 text-muted-foreground" />
                    Last session: <strong className="text-foreground">{member.lastSessionDate}</strong>
                  </span>
                  <span>•</span>
                  <span>Total encounters: <strong className="text-foreground">{member.totalEncounters}</strong></span>
                  <span>•</span>
                  <span className="text-emerald-700 dark:text-emerald-400 font-semibold">
                    {member.sentimentShift}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleScheduleFollowup(member.alias)}
                  className="rounded-xl text-xs h-8 px-3 gap-1.5 border-teal-300 dark:border-teal-800 text-teal-800 dark:text-teal-300 hover:bg-teal-50 dark:hover:bg-teal-950/40"
                >
                  <Clock className="size-3.5" />
                  <span>Arm Follow-Up</span>
                </Button>

                <Button
                  size="sm"
                  onClick={() => handleOpenSoapHistory(member)}
                  className="rounded-xl bg-[#236B54] hover:bg-[#1a5240] text-white text-xs h-8 px-3.5 gap-1.5"
                >
                  <Eye className="size-3.5" />
                  <span>Review Past SOAP</span>
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* ── Modal ── */}
      <ListenerReviewModal
        open={isReviewModalOpen}
        onOpenChange={setIsReviewModalOpen}
        session={
          selectedMember
            ? {
                id: selectedMember.id,
                memberName: selectedMember.alias,
                topic: selectedMember.primaryFocus,
              }
            : null
        }
      />
    </div>
  );
}

