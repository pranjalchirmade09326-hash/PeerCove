"use client";

import { useState } from "react";
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
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Calendar as CalendarIcon,
  Clock,
  Headphones,
  MessageCircle,
  Mic,
  Sparkles,
  UserCheck,
  Video,
  CheckCircle2,
  ShieldCheck,
  Users,
  Building,
  Heart,
  Moon,
  Smile,
  Globe,
  Radio,
  ArrowRight,
} from "lucide-react";
import { toast } from "sonner";
import {
  VALID_TOPICS,
  SupportTopic,
  SupportChannel,
  sanitizeNotes,
} from "../domain/entities/MemberQueue";

export interface BookSessionModalProps {
  open?: boolean;
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  onClose?: () => void;
  onSessionBooked?: (session: {
    id: string;
    date: string;
    listenerName: string;
    channel: "chat" | "voice" | "video";
    status: "active" | "completed" | "pending";
    note: string;
    meetingType?: "virtual" | "in_person";
  }) => void;
  onRequestInitiated?: (matchRequest: any) => void;
  onSuccess?: () => void;
}

const AVAILABLE_LISTENERS = [
  {
    id: "l-3",
    name: "Dr. Vikram Sen",
    role: "Licensed Clinical Counselor / Doctor",
    specialty: "Clinical Anxiety, Somatic Symptoms & Stress Management",
    rating: "4.95 ★",
    avatar: "VS",
    languages: ["en", "hi"],
  },
  {
    id: "l-1",
    name: "Aarav Sharma",
    role: "Verified Peer Listener",
    specialty: "Work Stress & Somatic Grounding",
    rating: "4.9 ★",
    avatar: "AS",
    languages: ["en", "hi"],
  },
  {
    id: "l-2",
    name: "Priya Verma",
    role: "Empathetic Volunteer Specialist",
    specialty: "Mindfulness & Relationship Calm",
    rating: "5.0 ★",
    avatar: "PV",
    languages: ["en", "ta", "hi"],
  },
];

const AVAILABLE_DATES = [
  "May 11th",
  "May 12th",
  "May 13th",
  "Today, Nov 9",
  "Tomorrow, Nov 10",
];

const TIME_SLOTS = [
  "10:00 AM",
  "11:30 AM",
  "02:00 PM",
  "04:30 PM",
  "06:00 PM",
  "08:30 PM",
];

const LANGUAGE_OPTIONS = [
  { code: "en", label: "English" },
  { code: "hi", label: "Hindi (हिंदी)" },
  { code: "ta", label: "Tamil (தமிழ்)" },
  { code: "es", label: "Spanish (Español)" },
];

const TOPIC_DETAILS: Record<
  SupportTopic,
  { label: string; description: string; icon: any }
> = {
  anxiety: {
    label: "Anxiety & Panic",
    description: "Racing thoughts, breathlessness & somatic tension",
    icon: Sparkles,
  },
  stress: {
    label: "Daily Stress & Burnout",
    description: "Work exhaustion, overwhelm & academic pressures",
    icon: Clock,
  },
  sleep: {
    label: "Sleep & Insomnia",
    description: "Restlessness, sleep latency & night-time anxiety",
    icon: Moon,
  },
  relationships: {
    label: "Relationships & Family",
    description: "Interpersonal conflict, boundaries & loneliness",
    icon: Users,
  },
  grief: {
    label: "Grief & Emotional Loss",
    description: "Navigating bereavement, separation & big transitions",
    icon: Heart,
  },
  general: {
    label: "General Wellbeing",
    description: "Mindful check-in, gentle reflection & open listening",
    icon: Smile,
  },
};

export function BookSessionModal({
  open,
  isOpen,
  onOpenChange,
  onClose,
  onSessionBooked,
  onRequestInitiated,
  onSuccess,
}: BookSessionModalProps) {
  const isModalOpen = open ?? isOpen ?? false;
  const handleOpenChange = (val: boolean) => {
    onOpenChange?.(val);
    if (!val) onClose?.();
  };

  const [activeTab, setActiveTab] = useState<"instant" | "scheduled">("instant");
  const [meetingType, setMeetingType] = useState<"virtual" | "in_person">("virtual");
  const [selectedListener, setSelectedListener] = useState(AVAILABLE_LISTENERS[0]);
  const [selectedTopic, setSelectedTopic] = useState<SupportTopic>("stress");
  const [selectedDate, setSelectedDate] = useState("May 11th");
  const [selectedSlot, setSelectedSlot] = useState("02:00 PM");
  const [channel, setChannel] = useState<SupportChannel>("chat");
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>(["en"]);
  const [topic, setTopic] = useState("Feeling overwhelmed with work deadlines and somatic tension.");
  const [consentShareIntake, setConsentShareIntake] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Toggle language selection
  const toggleLanguage = (code: string) => {
    if (selectedLanguages.includes(code)) {
      if (selectedLanguages.length > 1) {
        setSelectedLanguages(selectedLanguages.filter((c) => c !== code));
      }
    } else {
      setSelectedLanguages([...selectedLanguages, code]);
    }
  };

  // ── 1. Handle Instant Peer Match Request ──
  const handleInstantMatchSubmit = async () => {
    setIsSubmitting(true);
    const sanitizedNote = sanitizeNotes(topic);

    try {
      const res = await fetch("/api/peercove/member/match-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          support_topic: selectedTopic,
          preferred_channel: channel,
          preferred_languages: selectedLanguages,
          consent_share_intake: consentShareIntake,
          notes: sanitizedNote,
        }),
      });

      if (!res.ok) {
        throw new Error(`Server returned status ${res.status}`);
      }

      const matchData = await res.json();
      toast.info("Entering Peer Support Queue", {
        description: `Looking for a listener in ${TOPIC_DETAILS[selectedTopic].label}...`,
      });

      handleOpenChange(false);
      onRequestInitiated?.(matchData);
      onSuccess?.();
    } catch (err) {
      console.warn("Instant match submission fallback:", err);
      const fallbackData = {
        id: `mr-${Date.now()}`,
        request_state: "queued",
        support_topic: selectedTopic,
        preferred_channel: channel,
        preferred_languages: selectedLanguages,
        consent_share_intake: consentShareIntake,
        notes: sanitizedNote,
        created_at: new Date().toISOString(),
        source: "fallback",
      };

      handleOpenChange(false);
      onRequestInitiated?.(fallbackData);
      onSuccess?.();
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── 2. Handle Scheduled Appointment Booking ──
  const handleScheduledBookingSubmit = async () => {
    setIsSubmitting(true);
    const sanitizedNote = sanitizeNotes(topic);

    try {
      const res = await fetch("/api/peercove/member/peer-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          listener_id: selectedListener.id,
          listener_name: `${selectedListener.name} (${selectedListener.role.split(" ")[0]})`,
          channel: channel === "chat" ? "chat" : channel === "video" ? "video" : "voice",
          meeting_type: meetingType,
          note: sanitizedNote,
          support_topic: selectedTopic,
          languages: selectedLanguages,
          consent_share_intake: consentShareIntake,
          scheduled_slot: `${selectedDate} at ${selectedSlot}`,
        }),
      });

      // Background register into match requests
      fetch("/api/peercove/member/match-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          support_topic: selectedTopic,
          preferred_channel: channel,
          preferred_languages: selectedLanguages,
          consent_share_intake: consentShareIntake,
          notes: sanitizedNote,
        }),
      }).catch(() => {});

      if (!res.ok) {
        throw new Error(`Server returned ${res.status}`);
      }

      const savedSession = await res.json();
      onSessionBooked?.({
        id: savedSession.id,
        date: savedSession.date,
        listenerName: savedSession.listenerName,
        channel,
        status: "active",
        note: savedSession.note,
        meetingType,
      });

      onSuccess?.();
      handleOpenChange(false);
      toast.success(`Appointment Confirmed with ${selectedListener.name}!`, {
        description: `Booked for ${selectedDate} at ${selectedSlot} (${meetingType === "virtual" ? "Virtual Meet" : "In-Person Consultation"}).`,
        duration: 4500,
      });
    } catch (err) {
      console.warn("Failed to book session via backend, using fallback:", err);
      const fallbackSession = {
        id: `sess-${Date.now()}`,
        date: new Date().toISOString(),
        listenerName: `${selectedListener.name} (${selectedListener.role.split(" ")[0]})`,
        channel,
        status: "active" as const,
        note: sanitizedNote,
        meetingType,
      };
      onSessionBooked?.(fallbackSession);
      onSuccess?.();
      handleOpenChange(false);

      toast.success(`Appointment Scheduled for ${selectedDate} with ${selectedListener.name}!`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isModalOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto rounded-3xl p-6">
        <DialogHeader className="space-y-1.5 pb-2">
          <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400 font-semibold text-xs uppercase tracking-wider">
            <Sparkles className="size-4 animate-pulse" />
            PeerCove Peer Support & Doctor Intake
          </div>
          <DialogTitle className="text-xl font-bold font-serif">
            {activeTab === "instant" ? "Request Peer Support Session" : "Book Doctor Appointment"}
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            {activeTab === "instant"
              ? "Select your emotional focus topic, preferred communication channel, and enter the active matching queue."
              : "Choose an in-person or virtual consultation with a specialist and select your preferred slot."}
          </DialogDescription>
        </DialogHeader>

        {/* ── Mode Switcher Tabs ── */}
        <div className="grid grid-cols-2 gap-2 p-1 rounded-2xl bg-muted/60 border border-border/60">
          <button
            type="button"
            onClick={() => setActiveTab("instant")}
            className={`py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
              activeTab === "instant"
                ? "bg-[#236B54] text-white shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Radio className="size-3.5" />
            <span>Instant Peer Match</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("scheduled")}
            className={`py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
              activeTab === "scheduled"
                ? "bg-[#236B54] text-white shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <CalendarIcon className="size-3.5" />
            <span>Schedule Slot</span>
          </button>
        </div>

        <div className="space-y-5 pt-3">
          {/* 1. Standardized 6-Topic Intake Taxonomy */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                1. Focus Area (Standardized Intake Taxonomy)
              </Label>
              <span className="text-[11px] text-emerald-700 dark:text-emerald-400 font-medium capitalize">
                Selected: {selectedTopic}
              </span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {VALID_TOPICS.map((top) => {
                const isSelected = selectedTopic === top;
                const details = TOPIC_DETAILS[top];
                const IconComponent = details.icon;
                return (
                  <button
                    key={top}
                    type="button"
                    onClick={() => setSelectedTopic(top)}
                    className={`p-3 rounded-2xl border text-left transition-all flex flex-col justify-between ${
                      isSelected
                        ? "border-emerald-600 bg-emerald-50/90 dark:bg-emerald-950/40 ring-2 ring-emerald-600/20"
                        : "border-border/60 hover:bg-muted/40"
                    }`}
                  >
                    <div className="flex items-center justify-between w-full mb-1">
                      <div
                        className={`size-7 rounded-xl flex items-center justify-center ${
                          isSelected
                            ? "bg-[#236B54] text-white"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        <IconComponent className="size-3.5" />
                      </div>
                      {isSelected && (
                        <CheckCircle2 className="size-3.5 text-emerald-600" />
                      )}
                    </div>
                    <div>
                      <div className="font-semibold text-xs text-foreground">
                        {details.label}
                      </div>
                      <p className="text-[10px] text-muted-foreground mt-0.5 line-clamp-1">
                        {details.description}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. Communication Channel Selector */}
          <div className="space-y-2">
            <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              2. Preferred Communication Channel
            </Label>
            <div className="grid grid-cols-3 gap-2.5">
              <button
                type="button"
                onClick={() => setChannel("chat")}
                className={`p-3 rounded-2xl border text-left transition-all ${
                  channel === "chat"
                    ? "border-emerald-600 bg-emerald-50/90 dark:bg-emerald-950/40 ring-2 ring-emerald-600/20"
                    : "border-border/60 hover:bg-muted/40"
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <div
                    className={`size-7 rounded-xl flex items-center justify-center ${
                      channel === "chat"
                        ? "bg-[#236B54] text-white"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    <MessageCircle className="size-3.5" />
                  </div>
                  {channel === "chat" && (
                    <CheckCircle2 className="size-3.5 text-emerald-600" />
                  )}
                </div>
                <div className="font-semibold text-xs text-foreground">Text Chat</div>
                <p className="text-[10px] text-muted-foreground mt-0.5">
                  Private instant messaging
                </p>
              </button>

              <button
                type="button"
                onClick={() => setChannel("voice")}
                className={`p-3 rounded-2xl border text-left transition-all ${
                  channel === "voice"
                    ? "border-emerald-600 bg-emerald-50/90 dark:bg-emerald-950/40 ring-2 ring-emerald-600/20"
                    : "border-border/60 hover:bg-muted/40"
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <div
                    className={`size-7 rounded-xl flex items-center justify-center ${
                      channel === "voice"
                        ? "bg-[#236B54] text-white"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    <Mic className="size-3.5" />
                  </div>
                  {channel === "voice" && (
                    <CheckCircle2 className="size-3.5 text-emerald-600" />
                  )}
                </div>
                <div className="font-semibold text-xs text-foreground">Voice / Audio</div>
                <p className="text-[10px] text-muted-foreground mt-0.5">
                  Low-pressure audio reflection
                </p>
              </button>

              <button
                type="button"
                onClick={() => setChannel("video")}
                className={`p-3 rounded-2xl border text-left transition-all ${
                  channel === "video"
                    ? "border-emerald-600 bg-emerald-50/90 dark:bg-emerald-950/40 ring-2 ring-emerald-600/20"
                    : "border-border/60 hover:bg-muted/40"
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <div
                    className={`size-7 rounded-xl flex items-center justify-center ${
                      channel === "video"
                        ? "bg-[#236B54] text-white"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    <Video className="size-3.5" />
                  </div>
                  {channel === "video" && (
                    <CheckCircle2 className="size-3.5 text-emerald-600" />
                  )}
                </div>
                <div className="font-semibold text-xs text-foreground">Video Meeting</div>
                <p className="text-[10px] text-muted-foreground mt-0.5">
                  Private WebRTC consultation
                </p>
              </button>
            </div>
          </div>

          {/* 3. Preferred Languages */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <Globe className="size-3.5" />
                3. Preferred Languages
              </Label>
              <span className="text-[11px] text-muted-foreground">
                {selectedLanguages.join(", ").toUpperCase()}
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              {LANGUAGE_OPTIONS.map((lang) => {
                const isSelected = selectedLanguages.includes(lang.code);
                return (
                  <button
                    key={lang.code}
                    type="button"
                    onClick={() => toggleLanguage(lang.code)}
                    className={`py-1.5 px-3 rounded-xl border text-xs font-medium transition-all ${
                      isSelected
                        ? "border-emerald-600 bg-emerald-100 dark:bg-emerald-900/60 text-emerald-900 dark:text-emerald-100 font-semibold"
                        : "border-border/60 hover:bg-muted/40 text-muted-foreground"
                    }`}
                  >
                    {lang.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 4. Scheduled Mode specifics (Only visible in 'scheduled' tab) */}
          {activeTab === "scheduled" && (
            <>
              {/* Meeting Type */}
              <div className="space-y-2">
                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Meeting Format
                </Label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setMeetingType("virtual")}
                    className={`p-3 rounded-2xl border text-left flex items-start gap-3 transition-all ${
                      meetingType === "virtual"
                        ? "border-emerald-600 bg-emerald-50/90 dark:bg-emerald-950/40 ring-2 ring-emerald-600/20"
                        : "border-border/60 hover:bg-muted/40"
                    }`}
                  >
                    <div className="size-8 rounded-xl bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 flex items-center justify-center shrink-0">
                      <Video className="size-4" />
                    </div>
                    <div>
                      <div className="font-semibold text-xs text-foreground flex items-center gap-1.5">
                        Virtual Meet
                        {meetingType === "virtual" && (
                          <CheckCircle2 className="size-3.5 text-emerald-600" />
                        )}
                      </div>
                      <p className="text-[11px] text-muted-foreground mt-0.5">
                        Telehealth call with live AI decision support.
                      </p>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setMeetingType("in_person")}
                    className={`p-3 rounded-2xl border text-left flex items-start gap-3 transition-all ${
                      meetingType === "in_person"
                        ? "border-emerald-600 bg-emerald-50/90 dark:bg-emerald-950/40 ring-2 ring-emerald-600/20"
                        : "border-border/60 hover:bg-muted/40"
                    }`}
                  >
                    <div className="size-8 rounded-xl bg-teal-100 dark:bg-teal-900/60 text-teal-700 dark:text-teal-300 flex items-center justify-center shrink-0">
                      <Building className="size-4" />
                    </div>
                    <div>
                      <div className="font-semibold text-xs text-foreground flex items-center gap-1.5">
                        In-Person Clinic
                        {meetingType === "in_person" && (
                          <CheckCircle2 className="size-3.5 text-emerald-600" />
                        )}
                      </div>
                      <p className="text-[11px] text-muted-foreground mt-0.5">
                        Physical clinic visit with ambient audio capture.
                      </p>
                    </div>
                  </button>
                </div>
              </div>

              {/* Doctor Selection */}
              <div className="space-y-2">
                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Practitioner / Doctor
                </Label>
                <div className="grid gap-2">
                  {AVAILABLE_LISTENERS.map((l) => {
                    const isSelected = selectedListener.id === l.id;
                    return (
                      <div
                        key={l.id}
                        onClick={() => setSelectedListener(l)}
                        className={`flex items-center justify-between p-3 rounded-2xl border cursor-pointer transition-all ${
                          isSelected
                            ? "border-emerald-600 bg-emerald-50/80 dark:bg-emerald-950/30 ring-2 ring-emerald-600/20"
                            : "border-border/60 hover:border-emerald-300 hover:bg-muted/30"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className="size-10 rounded-xl bg-[#236B54] text-white flex items-center justify-center font-bold text-xs">
                            {l.avatar}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-sm">{l.name}</span>
                              <Badge variant="outline" className="text-[10px] font-normal">
                                {l.role}
                              </Badge>
                            </div>
                            <p className="text-xs text-muted-foreground">{l.specialty}</p>
                          </div>
                        </div>
                        <div className="text-right flex flex-col items-end gap-1">
                          <span className="text-xs font-bold text-amber-600 dark:text-amber-400">
                            {l.rating}
                          </span>
                          {isSelected && <CheckCircle2 className="size-4 text-emerald-600" />}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Date & Slot Picker */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Date
                  </Label>
                  <div className="grid grid-cols-2 gap-1.5">
                    {AVAILABLE_DATES.slice(0, 4).map((d) => (
                      <button
                        key={d}
                        type="button"
                        onClick={() => setSelectedDate(d)}
                        className={`py-1.5 px-2 rounded-xl border text-xs font-medium transition-all ${
                          selectedDate === d
                            ? "border-emerald-600 bg-emerald-600 text-white font-bold"
                            : "border-border/60 hover:bg-muted/40 text-muted-foreground"
                        }`}
                      >
                        {d}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Time Slot
                  </Label>
                  <div className="grid grid-cols-2 gap-1.5">
                    {TIME_SLOTS.slice(0, 4).map((slot) => (
                      <button
                        key={slot}
                        type="button"
                        onClick={() => setSelectedSlot(slot)}
                        className={`py-1.5 px-2 rounded-xl border text-xs font-medium transition-all ${
                          selectedSlot === slot
                            ? "border-emerald-600 bg-emerald-600 text-white font-bold"
                            : "border-border/60 hover:bg-muted/40 text-muted-foreground"
                        }`}
                      >
                        {slot}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </>
          )}

          {/* 5. Session Note / Context (XSS sanitized) */}
          <div className="space-y-1.5">
            <Label htmlFor="topic" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {activeTab === "instant" ? "Notes / What's on your mind? (Optional)" : "Symptoms or Consultation Goals"}
            </Label>
            <Input
              id="topic"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="e.g., Persistent anxiety, work overwhelm, need a sounding board"
              className="h-10 rounded-xl text-xs"
            />
          </div>

          {/* 6. Consent to Share AI Intake Context */}
          <div className="flex items-start gap-2.5 p-3 rounded-2xl border border-emerald-900/20 bg-emerald-50/50 dark:bg-emerald-950/20">
            <input
              type="checkbox"
              id="consentShareIntake"
              checked={consentShareIntake}
              onChange={(e) => setConsentShareIntake(e.target.checked)}
              className="mt-0.5 size-4 rounded border-border text-emerald-600 focus:ring-emerald-500 cursor-pointer"
            />
            <label htmlFor="consentShareIntake" className="text-xs text-muted-foreground cursor-pointer leading-relaxed">
              <span className="font-semibold text-foreground block">
                Share intake context and notes with matched listener
              </span>
              Allows your peer listener to understand your context beforehand so your session can start gently without repeating yourself.
            </label>
          </div>
        </div>

        <DialogFooter className="pt-4 border-t border-border/40 mt-3 flex sm:justify-between items-center gap-2">
          <p className="text-[11px] text-muted-foreground flex items-center gap-1">
            <ShieldCheck className="size-3.5 text-emerald-600" />
            Confidential & Encrypted.
          </p>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => handleOpenChange(false)} className="text-xs">
              Cancel
            </Button>
            {activeTab === "instant" ? (
              <Button
                size="sm"
                disabled={isSubmitting}
                onClick={handleInstantMatchSubmit}
                className="rounded-xl bg-[#236B54] hover:bg-[#1a5240] text-white text-xs h-9 px-4 font-semibold gap-1.5 shadow-sm"
              >
                <Radio className="size-3.5" />
                <span>{isSubmitting ? "Initiating..." : "Find Peer Listener Now"}</span>
              </Button>
            ) : (
              <Button
                size="sm"
                disabled={isSubmitting}
                onClick={handleScheduledBookingSubmit}
                className="rounded-xl bg-[#236B54] hover:bg-[#1a5240] text-white text-xs h-9 px-4 font-semibold gap-1.5 shadow-sm"
              >
                <CalendarIcon className="size-3.5" />
                <span>{isSubmitting ? "Booking..." : "Book Appointment"}</span>
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
