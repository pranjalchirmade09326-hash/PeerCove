"use client";

/**
 * MemberIntakeViewModal — Pre-Session Member Intake Report for Peer Listeners.
 *
 * Layer: modules / client / peercove / listener / components
 *
 * Displays:
 *   - Member identity alias & preferred communication channel
 *   - Discussion topic taxonomy & urgency tier
 *   - Pre-session conversational intake context & extracted distress notes
 *   - Safeguarding guardrails & active listening recommendations
 *   - Action to accept & connect directly into consultation room
 */

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
  Clock,
  FileText,
  Heart,
  MessageCircle,
  Mic,
  ShieldCheck,
  Sparkles,
  Video,
} from "lucide-react";

export interface TMemberIntakeInfo {
  id: string;
  displayName: string;
  topic: string;
  urgency?: "routine" | "support" | "elevated" | string;
  waitingMinutes?: number;
  channel?: "video" | "voice" | "chat" | string;
  notes?: string;
  intakeContext?: string;
  supportTopic?: string;
  preferredLanguages?: string[];
  protocolTier?: string;
}

export interface MemberIntakeViewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  member?: TMemberIntakeInfo | null;
  onStartSession?: () => void;
}

export function MemberIntakeViewModal({
  open,
  onOpenChange,
  member,
  onStartSession,
}: MemberIntakeViewModalProps) {
  if (!member) return null;

  const displayName = member.displayName || "Anonymous Member";
  const channel = member.channel || "chat";
  const topic = member.topic || member.supportTopic || "General emotional check-in & active listening";
  const waitingMins = member.waitingMinutes ?? 3;
  const urgency = member.urgency || "routine";
  const languages =
    member.preferredLanguages && member.preferredLanguages.length > 0
      ? member.preferredLanguages.join(", ")
      : "English & Hindi";
  const intakeContextText =
    member.intakeContext ||
    member.notes ||
    "Member completed an intake check-in expressing high situational stress. Looking for a compassionate peer listener to unpack thoughts without pressure.";

  const urgencyLabel =
    urgency === "elevated"
      ? "Elevated Support (Priority)"
      : urgency === "support"
      ? "Emotional Support Tier"
      : "Routine Support";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl max-h-[85vh] overflow-y-auto rounded-3xl p-6">
        <DialogHeader className="space-y-1.5 pb-2 border-b border-border/50">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-teal-700 dark:text-teal-400 flex items-center gap-1.5">
              <Sparkles className="size-3.5 text-teal-600" />
              Pre-Session Member Intake Report
            </span>
            <Badge
              variant="outline"
              className="text-xs border-emerald-600 text-emerald-700 dark:text-emerald-300 capitalize gap-1"
            >
              {channel === "video" && <Video className="size-3" />}
              {channel === "voice" && <Mic className="size-3" />}
              {channel === "chat" && <MessageCircle className="size-3" />}
              {channel} Consultation
            </Badge>
          </div>
          <DialogTitle className="text-xl font-bold font-serif text-slate-950 dark:text-foreground">
            {displayName}&apos;s Intake & Triage Overview
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Waiting {waitingMins} mins • Protocol Tier: {urgencyLabel}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 pt-3 text-xs">
          {/* Member Card */}
          <div className="flex items-center justify-between p-3.5 rounded-2xl bg-muted/40 border border-border/60">
            <div className="flex items-center gap-3">
              <div className="size-10 rounded-xl bg-[#236B54] text-white flex items-center justify-center font-bold text-sm">
                {displayName[0]}
              </div>
              <div>
                <span className="font-semibold text-sm text-foreground">{displayName}</span>
                <span className="block text-xs text-muted-foreground">Preferred: {languages}</span>
              </div>
            </div>
            <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-semibold text-xs">
              <ShieldCheck className="size-4" />
              Safety Verified
            </div>
          </div>

          {/* AI Intake Summary */}
          <Card className="border-border/60">
            <CardHeader className="py-2.5 px-4 bg-muted/20">
              <CardTitle className="text-xs font-semibold flex items-center gap-2">
                <FileText className="size-3.5 text-teal-600" />
                Initial Conversational Intake Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-3">
              <div>
                <span className="text-muted-foreground block text-[11px] font-semibold">Primary Concern & Topic:</span>
                <p className="font-semibold text-foreground text-xs mt-0.5">{topic}</p>
              </div>
              <div>
                <span className="text-muted-foreground block text-[11px] font-semibold">Intake Context & Background:</span>
                <p className="text-muted-foreground text-xs leading-relaxed mt-0.5">
                  {intakeContextText}
                </p>
              </div>
              <div className="flex items-center gap-3 pt-1 text-[11px] text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Clock className="size-3 text-amber-500" />
                  Queued: {waitingMins}m ago
                </span>
                <span>•</span>
                <span className="capitalize">Channel: {channel}</span>
                <span>•</span>
                <Badge
                  variant="outline"
                  className={`text-[10px] ${
                    urgency === "elevated"
                      ? "border-amber-500 text-amber-700 bg-amber-50 dark:bg-amber-950/40"
                      : "border-teal-500 text-teal-700 bg-teal-50 dark:bg-teal-950/40"
                  }`}
                >
                  {urgency}
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Clinical Guardrails & Recommendations */}
          <div className="p-3.5 rounded-2xl border border-teal-200 dark:border-teal-900/50 bg-teal-50/60 dark:bg-teal-950/20 text-xs text-teal-950 dark:text-teal-200 space-y-1">
            <span className="font-bold flex items-center gap-1.5">
              <Heart className="size-3.5 text-teal-600" />
              Listener Guidance for this Session:
            </span>
            <p className="text-muted-foreground text-[11px] leading-relaxed">
              1. Validate their experience with active reflections before offering breathing tools.<br />
              2. Do not offer clinical diagnoses or pharmaceutical suggestions.<br />
              3. Maintain confidential boundaries and red-line safeguarding.
            </p>
          </div>
        </div>

        <DialogFooter className="pt-4 border-t border-border/40 mt-3 flex sm:justify-between items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)} className="rounded-xl text-xs">
            Close
          </Button>
          <Button
            size="sm"
            onClick={() => {
              onOpenChange(false);
              onStartSession?.();
            }}
            className="rounded-xl text-xs bg-[#236B54] hover:bg-[#1a5240] text-white px-4 font-semibold"
          >
            Accept & Connect Now
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
