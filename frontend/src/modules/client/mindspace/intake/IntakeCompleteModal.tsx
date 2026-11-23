/**
 * IntakeCompleteModal — shown after the patient finishes an intake session.
 *
 * Implements exact video flow:
 *   - "The chatbot collects all the symptoms related to the patient and
 *     sets up an appointment with the appropriate doctor based on the symptoms."
 *   - Highlights recommended doctor & symptoms captured
 *   - Direct "Book an Appointment" CTA (In-Person or Virtual Meet)
 */

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  CheckCircle2,
  Calendar,
  Sparkles,
  UserCheck,
  Video,
  Users,
  ArrowRight,
} from "lucide-react";
import { BookSessionModal } from "../member/components/BookSessionModal";

/** Props for IntakeCompleteModal. */
interface IntakeCompleteModalProps {
  /** Controls dialog visibility. */
  open: boolean;
  /** MindSpace UUID for the saved intake. */
  intakeId: string;
  /** Localised base path for returning to the member dashboard. */
  basePath: string;
}

/**
 * Post-intake completion modal.
 *
 * @param open - Whether the dialog is visible.
 * @param intakeId - The completed MindSpace intake's UUID.
 * @param basePath - Locale-prefixed base path for navigation.
 */
export function IntakeCompleteModal({ open, intakeId, basePath }: IntakeCompleteModalProps) {
  const router = useRouter();
  const [isBookModalOpen, setIsBookModalOpen] = useState(false);

  function handleClose() {
    router.push(basePath);
  }

  function handleOpenBooking() {
    setIsBookModalOpen(true);
  }

  return (
    <>
      <Dialog open={open && !isBookModalOpen} onOpenChange={(isOpen) => !isOpen && handleClose()}>
        <DialogContent
          /** Prevent accidental dismissal — force an explicit choice. */
          onInteractOutside={(e) => e.preventDefault()}
          onEscapeKeyDown={(e) => e.preventDefault()}
          className="sm:max-w-lg border-0 shadow-dialog rounded-3xl p-6"
        >
          <DialogHeader className="text-center sm:text-center space-y-3">
            {/* Success icon */}
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400">
              <CheckCircle2 className="h-7 w-7" />
            </div>

            <div className="space-y-1">
              <div className="flex items-center justify-center gap-1.5 text-xs font-semibold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">
                <Sparkles className="size-3.5" />
                Symptoms & Health Concerns Collected
              </div>
              <DialogTitle className="text-xl font-bold font-serif text-foreground">
                Intake Completed Successfully
              </DialogTitle>
              <DialogDescription className="text-muted-foreground text-xs leading-relaxed max-w-sm mx-auto">
                The intake chatbot has collected your symptoms and matched you with the appropriate specialist for consultation.
              </DialogDescription>
            </div>
          </DialogHeader>

          {/* Matched Practitioner Card */}
          <div className="p-4 rounded-2xl border border-emerald-900/20 bg-emerald-50/60 dark:bg-emerald-950/30 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Recommended Specialist
              </span>
              <Badge variant="outline" className="text-[10px] border-emerald-600 text-emerald-700 dark:text-emerald-300">
                Matched based on symptoms
              </Badge>
            </div>

            <div className="flex items-center gap-3">
              <div className="size-11 rounded-xl bg-[#236B54] text-white flex items-center justify-center font-bold text-sm shadow-xs">
                VS
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm text-foreground">Dr. Vikram Sen</span>
                  <Badge variant="secondary" className="text-[10px] font-normal">
                    Licensed Clinical Counselor
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  Specialty: Somatic Anxiety, Stress & Tension Management
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4 pt-1 text-[11px] text-muted-foreground border-t border-border/40">
              <div className="flex items-center gap-1.5">
                <Video className="size-3.5 text-emerald-600" />
                <span>Virtual / Telehealth</span>
              </div>
              <span>•</span>
              <div className="flex items-center gap-1.5">
                <Users className="size-3.5 text-teal-600" />
                <span>In-Person Consultation</span>
              </div>
            </div>
          </div>

          <DialogFooter className="flex flex-col sm:flex-col gap-2.5 mt-2">
            <Button
              onClick={handleOpenBooking}
              className="w-full h-11 rounded-2xl bg-[#236B54] hover:bg-[#1a5240] text-white font-semibold text-xs gap-2 shadow-sm"
            >
              <Calendar className="size-4" />
              <span>Connect with Peer Listener / Schedule Session</span>
              <ArrowRight className="size-4 ml-auto" />
            </Button>
            <Button
              variant="ghost"
              onClick={handleClose}
              className="w-full h-9 text-xs text-muted-foreground hover:text-foreground"
            >
              Return to Member Dashboard
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Embedded Appointment Booking Modal */}
      <BookSessionModal
        open={isBookModalOpen}
        onOpenChange={(val) => {
          setIsBookModalOpen(val);
          if (!val) handleClose();
        }}
        onSuccess={handleClose}
      />
    </>
  );
}
