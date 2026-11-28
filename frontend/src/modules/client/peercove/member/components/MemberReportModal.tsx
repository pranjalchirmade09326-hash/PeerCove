"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Activity,
  Award,
  CheckCircle2,
  Clock,
  Database,
  Download,
  FileText,
  FlaskConical,
  Heart,
  Pill,
  Printer,
  ShieldCheck,
  Sparkles,
  User,
} from "lucide-react";
import { toast } from "sonner";

export interface MemberReportModalProps {
  open?: boolean;
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  onClose?: () => void;
  session?: {
    id: string;
    date: string;
    listenerName: string;
    note?: string;
  } | null;
}

export function MemberReportModal({
  open,
  isOpen,
  onOpenChange,
  onClose,
  session,
}: MemberReportModalProps) {
  const [activeTab, setActiveTab] = useState<"soap" | "fhir">("soap");
  const isModalOpen = open ?? isOpen ?? false;
  const handleOpenChange = (val: boolean) => {
    onOpenChange?.(val);
    if (!val) onClose?.();
  };
  const listenerName = session?.listenerName || "Dr. Vikram Sen / Aarav Sharma";
  const sessionDate = session?.date
    ? new Date(session.date).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "long",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "May 11th, 06:00 PM";

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    toast.success("Wellbeing & Consultation Summary Downloaded", {
      description: "Encrypted PDF report with SOAP note & FHIR extractions saved to downloads.",
    });
  };

  return (
    <Dialog open={isModalOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl p-6">
        <DialogHeader className="space-y-1.5 pb-2 border-b border-border/50">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-400 flex items-center gap-1.5">
              <Sparkles className="size-3.5 text-emerald-600" />
              PeerCove Consultation & Clinical Record
            </span>
            <Badge variant="outline" className="text-xs border-emerald-600 text-emerald-700 dark:text-emerald-300">
              Verified Session
            </Badge>
          </div>
          <DialogTitle className="text-2xl font-bold font-serif text-slate-950 dark:text-foreground">
            Encounter Summary & SOAP Report
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Session ID: <span className="font-mono">{session?.id || "PC-SESS-9082"}</span> • Date: {sessionDate}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 pt-3 text-xs">
          {/* Metadata Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-3.5 rounded-2xl bg-muted/30 border border-border/60">
            <div>
              <span className="text-muted-foreground block text-[11px]">Member ID:</span>
              <span className="font-semibold text-foreground">MEM-40912 (You)</span>
            </div>
            <div>
              <span className="text-muted-foreground block text-[11px]">Practitioner:</span>
              <span className="font-semibold text-foreground">{listenerName}</span>
            </div>
            <div>
              <span className="text-muted-foreground block text-[11px]">EMR Sync Status:</span>
              <span className="font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                <CheckCircle2 className="size-3.5" /> FHIR Synced
              </span>
            </div>
          </div>

          {/* Tab Switcher */}
          <div className="flex items-center gap-2 border-b pb-2">
            <Button
              size="sm"
              variant={activeTab === "soap" ? "default" : "outline"}
              onClick={() => setActiveTab("soap")}
              className={`text-xs h-8 rounded-xl font-semibold gap-1.5 ${
                activeTab === "soap" ? "bg-[#236B54] text-white" : ""
              }`}
            >
              <FileText className="size-3.5" />
              SOAP Note
            </Button>
            <Button
              size="sm"
              variant={activeTab === "fhir" ? "default" : "outline"}
              onClick={() => setActiveTab("fhir")}
              className={`text-xs h-8 rounded-xl font-semibold gap-1.5 ${
                activeTab === "fhir" ? "bg-[#236B54] text-white" : ""
              }`}
            >
              <Database className="size-3.5" />
              Clinical Extractions (FHIR Format)
            </Button>
          </div>

          {/* TAB 1: SOAP NOTE */}
          {activeTab === "soap" && (
            <div className="space-y-3">
              <Card className="border-border/60">
                <CardHeader className="py-2.5 px-3.5 bg-muted/20">
                  <CardTitle className="text-xs font-bold flex items-center gap-2">
                    <span className="flex size-5 items-center justify-center rounded-full bg-blue-100 text-blue-700 font-bold text-[10px]">S</span>
                    Subjective
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-3 text-xs text-muted-foreground leading-relaxed">
                  Member reported chronic tension headaches, daily fatigue, and mental exhaustion from prolonged screen time. Expressed feeling unable to switch off thoughts before sleeping.
                </CardContent>
              </Card>

              <Card className="border-border/60">
                <CardHeader className="py-2.5 px-3.5 bg-muted/20">
                  <CardTitle className="text-xs font-bold flex items-center gap-2">
                    <span className="flex size-5 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 font-bold text-[10px]">O</span>
                    Objective
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-3 text-xs text-muted-foreground leading-relaxed">
                  Vitals recorded: Blood Pressure 120/80 mmHg, Heart Rate 72 bpm regular, SpO2 98% room air. Patient alert, attentive, and engaged during consultation.
                </CardContent>
              </Card>

              <Card className="border-border/60">
                <CardHeader className="py-2.5 px-3.5 bg-muted/20">
                  <CardTitle className="text-xs font-bold flex items-center gap-2">
                    <span className="flex size-5 items-center justify-center rounded-full bg-amber-100 text-amber-700 font-bold text-[10px]">A</span>
                    Assessment
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-3 text-xs text-muted-foreground leading-relaxed">
                  1. Tension-Type Headache (ICD-10 G44.209)<br />
                  2. Situational Fatigue & Stress (ICD-10 Z73.0) — Stepped-Care Tier 1.
                </CardContent>
              </Card>

              <Card className="border-border/60">
                <CardHeader className="py-2.5 px-3.5 bg-muted/20">
                  <CardTitle className="text-xs font-bold flex items-center gap-2">
                    <span className="flex size-5 items-center justify-center rounded-full bg-purple-100 text-purple-700 font-bold text-[10px]">P</span>
                    Plan
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-3 text-xs text-muted-foreground leading-relaxed">
                  1. Prescribed Acetaminophen 500mg PO every 6 hours PRN for headache relief.<br />
                  2. Ordered Complete Blood Count (CBC) with Differential (LOINC 58410-2).<br />
                  3. Practice 4-7-8 grounding breathwork daily and establish digital boundaries before bedtime.
                </CardContent>
              </Card>
            </div>
          )}

          {/* TAB 2: FHIR CLINICAL EXTRACTIONS */}
          {activeTab === "fhir" && (
            <div className="space-y-3">
              {/* Conditions */}
              <div className="p-3 rounded-2xl border border-border/60 bg-muted/10 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-foreground flex items-center gap-2">
                    <Activity className="size-4 text-rose-600" />
                    Conditions (FHIR Condition)
                  </span>
                  <Badge variant="outline" className="text-[10px]">ICD-10</Badge>
                </div>
                <div className="space-y-1.5">
                  <div className="p-2 rounded-xl bg-background border border-border/50 flex justify-between items-center">
                    <div>
                      <span className="font-semibold text-foreground block">Tension-Type Headache</span>
                      <span className="text-[10px] text-muted-foreground">ICD-10 G44.209 • Active</span>
                    </div>
                    <Badge className="bg-rose-100 text-rose-800 text-[10px]">Primary</Badge>
                  </div>
                  <div className="p-2 rounded-xl bg-background border border-border/50 flex justify-between items-center">
                    <div>
                      <span className="font-semibold text-foreground block">Situational Stress & Fatigue</span>
                      <span className="text-[10px] text-muted-foreground">ICD-10 Z73.0 • Active</span>
                    </div>
                    <Badge className="bg-amber-100 text-amber-800 text-[10px]">Secondary</Badge>
                  </div>
                </div>
              </div>

              {/* Observations */}
              <div className="p-3 rounded-2xl border border-border/60 bg-muted/10 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-foreground flex items-center gap-2">
                    <Activity className="size-4 text-blue-600" />
                    Observations (FHIR Observation)
                  </span>
                  <Badge variant="outline" className="text-[10px]">LOINC</Badge>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div className="p-2 rounded-xl bg-background border border-border/50 text-center">
                    <span className="text-[10px] text-muted-foreground block">BP</span>
                    <span className="font-bold text-foreground">120/80 mmHg</span>
                  </div>
                  <div className="p-2 rounded-xl bg-background border border-border/50 text-center">
                    <span className="text-[10px] text-muted-foreground block">Heart Rate</span>
                    <span className="font-bold text-foreground">72 bpm</span>
                  </div>
                  <div className="p-2 rounded-xl bg-background border border-border/50 text-center">
                    <span className="text-[10px] text-muted-foreground block">SpO2</span>
                    <span className="font-bold text-foreground">98%</span>
                  </div>
                </div>
              </div>

              {/* Medications */}
              <div className="p-3 rounded-2xl border border-emerald-500/30 bg-emerald-50/30 dark:bg-emerald-950/20 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-foreground flex items-center gap-2">
                    <Pill className="size-4 text-emerald-600" />
                    Medications (FHIR MedicationRequest)
                  </span>
                  <Badge className="bg-emerald-700 text-white text-[10px]">Prescription</Badge>
                </div>
                <div className="p-2.5 rounded-xl bg-background border border-emerald-600/30 flex justify-between items-center">
                  <div>
                    <span className="font-bold text-foreground block">Acetaminophen 500mg Oral Tablet</span>
                    <span className="text-[11px] text-muted-foreground">RxNorm: 198440 • 1 tablet every 6 hours PRN for headache</span>
                  </div>
                  <CheckCircle2 className="size-4 text-emerald-600" />
                </div>
              </div>

              {/* Orders */}
              <div className="p-3 rounded-2xl border border-purple-500/30 bg-purple-50/30 dark:bg-purple-950/20 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-foreground flex items-center gap-2">
                    <FlaskConical className="size-4 text-purple-600" />
                    Orders (FHIR ServiceRequest)
                  </span>
                  <Badge className="bg-purple-700 text-white text-[10px]">Requisition</Badge>
                </div>
                <div className="p-2.5 rounded-xl bg-background border border-purple-600/30 flex justify-between items-center">
                  <div>
                    <span className="font-bold text-foreground block">Complete Blood Count (CBC) with Differential</span>
                    <span className="text-[11px] text-muted-foreground">LOINC: 58410-2 • Lab Requisition</span>
                  </div>
                  <CheckCircle2 className="size-4 text-purple-600" />
                </div>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="pt-4 border-t border-border/40 mt-3 flex sm:justify-between items-center gap-2">
          <p className="text-[11px] text-muted-foreground">
            Confidential PeerCove Clinical Documentation • FHIR Compatible.
          </p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handlePrint} className="rounded-xl text-xs gap-1.5">
              <Printer className="size-3.5" />
              Print
            </Button>
            <Button
              size="sm"
              onClick={handleDownload}
              className="rounded-xl text-xs bg-[#236B54] hover:bg-[#1a5240] text-white gap-1.5 font-semibold"
            >
              <Download className="size-3.5" />
              Download PDF
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
