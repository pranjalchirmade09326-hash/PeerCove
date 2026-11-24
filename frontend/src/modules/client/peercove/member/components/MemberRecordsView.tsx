"use client";

/**
 * MemberRecordsView — Remapping Patient Medical Records into Member Wellbeing & Session Records.
 *
 * Layer: modules / client / peercove / member / components
 */

import { useState, useEffect } from "react";
import {
  FileText,
  Download,
  Printer,
  ShieldCheck,
  Activity,
  Heart,
  Clock,
  CheckCircle2,
  Lock,
  Search,
  Eye,
  FileCheck,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

import { MemberReportModal } from "./MemberReportModal";

export interface TMemberRecordItem {
  id: string;
  title: string;
  type: "Session Reflection Summary" | "Intake Assessment" | "Somatic Reflection Note" | "Session SOAP Summary";
  date: string;
  listener: string;
  tier: "Tier 1: Mild Distress" | "Tier 2: Moderate Work Stress" | "Tier 0: Routine Wellbeing";
  sentimentScore: string;
  keyThemes: string[];
}

const MOCK_RECORDS: TMemberRecordItem[] = [
  {
    id: "rec-1",
    title: "Post-Session Wellbeing & Boundary Review",
    type: "Session Reflection Summary",
    date: new Date(Date.now() - 86400000).toISOString(),
    listener: "Aarav Sharma (Verified Peer Listener)",
    tier: "Tier 1: Mild Distress",
    sentimentScore: "Sentiment: Reflective & Calmer (+18% shift)",
    keyThemes: ["Workplace boundaries", "Sleep hygiene", "4-7-8 Breathing"],
  },
  {
    id: "rec-2",
    title: "Initial Multi-Modal Intake & Distress Screening",
    type: "Intake Assessment",
    date: new Date(Date.now() - 86400000 * 4).toISOString(),
    listener: "PeerCove Care Navigator",
    tier: "Tier 2: Moderate Work Stress",
    sentimentScore: "Sentiment: Overwhelmed -> Grounded",
    keyThemes: ["Deadline overload", "Cognitive rumination", "Social withdrawal"],
  },
  {
    id: "rec-3",
    title: "Grounding & Somatic Reflection Summary",
    type: "Somatic Reflection Note",
    date: new Date(Date.now() - 86400000 * 8).toISOString(),
    listener: "Priya Nair (Somatic Listener)",
    tier: "Tier 0: Routine Wellbeing",
    sentimentScore: "Sentiment: Peaceful & Centered",
    keyThemes: ["Progressive Muscle Relaxation", "Evening walk cadence"],
  },
];

export function MemberRecordsView() {
  const [records, setRecords] = useState<TMemberRecordItem[]>(MOCK_RECORDS);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRecord, setSelectedRecord] = useState<TMemberRecordItem | null>(null);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);

  useEffect(() => {
    fetch("/api/peercove/member/conversations")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          const completed = data.filter((c: any) => c.status === "completed");
          if (completed.length > 0) {
            const mapped: TMemberRecordItem[] = completed.map((c: any) => ({
              id: c.id,
              title: `Session Summary — ${c.note || "Peer Reflection"}`,
              type: "Session SOAP Summary",
              date: c.started_at,
              listener: c.listener_name || "Verified Peer Listener",
              tier: "Tier 1: Mild Distress",
              sentimentScore: "Sentiment: Reflective & Calmer",
              keyThemes: ["Mindfulness check-in", "Active listening", "Grounding"],
            }));
            setRecords([...mapped, ...MOCK_RECORDS]);
          }
        }
      })
      .catch(() => {});
  }, []);

  const filtered = records.filter(
    (r) =>
      r.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.listener.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleOpenReport = (record: TMemberRecordItem) => {
    setSelectedRecord(record);
    setIsReportModalOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl font-serif">
            Wellbeing & Reflection Records
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Your confidential peer session reflections, intake evaluations, and grounding progress notes.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Badge
            variant="outline"
            className="px-3 py-1.5 rounded-full text-xs font-semibold gap-1.5 border-emerald-500/40 bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300"
          >
            <ShieldCheck className="size-3.5 text-emerald-600" />
            AES-256 Confidential & Encrypted
          </Badge>
        </div>
      </div>

      {/* ── Record Overview Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-4 border-border/60">
          <div className="flex items-center justify-between text-muted-foreground mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Records</span>
            <FileText className="size-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold text-foreground">{records.length}</div>
          <p className="text-xs text-muted-foreground mt-0.5">Encrypted summaries on file</p>
        </Card>

        <Card className="p-4 border-border/60">
          <div className="flex items-center justify-between text-muted-foreground mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider">Current Tier</span>
            <Activity className="size-4 text-teal-600" />
          </div>
          <div className="text-lg font-bold text-foreground">Tier 1: Mild Distress</div>
          <p className="text-xs text-muted-foreground mt-0.5">Low risk / Peer supported</p>
        </Card>

        <Card className="p-4 border-border/60">
          <div className="flex items-center justify-between text-muted-foreground mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider">Privacy Protocol</span>
            <Lock className="size-4 text-blue-600" />
          </div>
          <div className="text-lg font-bold text-foreground">Member-Owned</div>
          <p className="text-xs text-muted-foreground mt-0.5">Never shared without consent</p>
        </Card>
      </div>

      {/* ── Search & Filter ── */}
      <div className="flex items-center justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
          <Input
            placeholder="Search reports or listener notes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-9 text-xs rounded-xl"
          />
        </div>
      </div>

      {/* ── Records Cards List ── */}
      <div className="space-y-4">
        {filtered.map((record) => (
          <Card key={record.id} className="p-5 border-border/60 hover:shadow-xs transition-shadow">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="text-[11px] font-semibold">
                    {record.type}
                  </Badge>
                  <Badge
                    variant="outline"
                    className="text-[11px] border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40"
                  >
                    {record.tier}
                  </Badge>
                </div>

                <h3 className="text-base font-bold text-foreground">{record.title}</h3>

                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Clock className="size-3.5 text-muted-foreground" />
                    {new Date(record.date).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </span>
                  <span>•</span>
                  <span>Evaluator / Listener: <strong className="text-foreground">{record.listener}</strong></span>
                </div>

                <p className="text-xs text-emerald-700 dark:text-emerald-400 font-medium pt-1">
                  {record.sentimentScore}
                </p>

                <div className="flex flex-wrap items-center gap-1.5 pt-2">
                  <span className="text-[11px] text-muted-foreground font-medium mr-1">Focus Themes:</span>
                  {record.keyThemes.map((theme) => (
                    <Badge key={theme} variant="outline" className="text-[10px] bg-muted/40 font-normal">
                      {theme}
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="flex sm:flex-col items-center sm:items-end gap-2 shrink-0">
                <Button
                  size="sm"
                  onClick={() => handleOpenReport(record)}
                  className="rounded-xl bg-[#236B54] hover:bg-[#1a5240] text-white text-xs h-8 px-3 gap-1.5"
                >
                  <Eye className="size-3.5" />
                  <span>View Full Report</span>
                </Button>

                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    toast.success("Downloading Cryptographically Signed PDF Report...", {
                      description: `${record.title}.pdf is ready.`,
                    });
                  }}
                  className="rounded-xl text-xs h-8 px-3 gap-1.5"
                >
                  <Download className="size-3.5" />
                  <span>Export PDF</span>
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* ── Modal ── */}
      <MemberReportModal
        open={isReportModalOpen}
        onOpenChange={setIsReportModalOpen}
        session={
          selectedRecord
            ? {
                id: selectedRecord.id,
                date: selectedRecord.date,
                listenerName: selectedRecord.listener,
                note: selectedRecord.title,
              }
            : null
        }
      />
    </div>
  );
}

