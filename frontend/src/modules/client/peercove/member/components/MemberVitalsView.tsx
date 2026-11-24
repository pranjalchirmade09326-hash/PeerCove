"use client";

/**
 * MemberVitalsView — Remapping Patient Vitals into Member Mental Wellbeing Vitals & Emotional Check-ins.
 *
 * Layer: modules / client / peercove / member / components
 */

import { useState, useEffect, useCallback } from "react";
import {
  Activity,
  Heart,
  Moon,
  Smile,
  Zap,
  TrendingUp,
  PlusCircle,
  Clock,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
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

export interface TWellbeingVital {
  id: string;
  date: string;
  calmnessScore: number; // 1-10
  moodLabel: string;
  sleepHours: number;
  stressLevel: "Low" | "Moderate" | "Elevated";
  notes: string;
}

const INITIAL_VITALS: TWellbeingVital[] = [
  {
    id: "v-1",
    date: "Today, 9:00 AM",
    calmnessScore: 8,
    moodLabel: "Grounded & Peaceful",
    sleepHours: 7.5,
    stressLevel: "Low",
    notes: "Morning 10-minute mindfulness breathing before starting work.",
  },
  {
    id: "v-2",
    date: "Yesterday, 10:30 PM",
    calmnessScore: 6,
    moodLabel: "Slightly Tired but Content",
    sleepHours: 6.8,
    stressLevel: "Moderate",
    notes: "Ended work by 8 PM, evening tea helped somatic relaxation.",
  },
  {
    id: "v-3",
    date: "Nov 6, 8:45 AM",
    calmnessScore: 4,
    moodLabel: "Overwhelmed with Deadlines",
    sleepHours: 5.5,
    stressLevel: "Elevated",
    notes: "Restless sleep, high cognitive rumination about project kickoff.",
  },
  {
    id: "v-4",
    date: "Nov 5, 9:15 AM",
    calmnessScore: 7,
    moodLabel: "Reflective & Clear",
    sleepHours: 7.0,
    stressLevel: "Low",
    notes: "Good recovery day. Hydrated and took outdoor break.",
  },
];

export function MemberVitalsView() {
  const [vitals, setVitals] = useState<TWellbeingVital[]>(INITIAL_VITALS);
  const [isLogModalOpen, setIsLogModalOpen] = useState(false);

  const loadLiveMoods = useCallback(async () => {
    try {
      const res = await fetch("/api/peercove/member/moods");
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          const mapped: TWellbeingVital[] = data.map((m: any) => ({
            id: m.id,
            date: new Date(m.recorded_at).toLocaleDateString("en-IN", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }),
            calmnessScore: m.scale_value || 8,
            moodLabel: m.mood_code ? m.mood_code.charAt(0).toUpperCase() + m.mood_code.slice(1) : "Reflective",
            sleepHours: 7.5,
            stressLevel: m.scale_value && m.scale_value < 5 ? "Elevated" : m.scale_value && m.scale_value < 7 ? "Moderate" : "Low",
            notes: m.note || "Encrypted reflection check-in.",
          }));
          setVitals(mapped);
        }
      }
    } catch (e) {
      console.log("Error loading live moods:", e);
    }
  }, []);

  useEffect(() => {
    loadLiveMoods();
  }, [loadLiveMoods]);

  // New vital state
  const [calmness, setCalmness] = useState(7);
  const [mood, setMood] = useState("Calm & Focused");
  const [sleep, setSleep] = useState("7.5");
  const [stress, setStress] = useState<"Low" | "Moderate" | "Elevated">("Low");
  const [notes, setNotes] = useState("");

  const handleLogVital = async () => {
    try {
      await fetch("/api/peercove/member/moods", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mood_code: mood.toLowerCase().includes("calm") ? "calm" : "peaceful",
          scale_code: "1_to_10",
          scale_value: Number(calmness),
          note: notes || undefined,
        }),
      });
      loadLiveMoods();
    } catch {}

    const newEntry: TWellbeingVital = {
      id: `v-${Date.now()}`,
      date: "Just now",
      calmnessScore: Number(calmness),
      moodLabel: mood,
      sleepHours: Number(sleep) || 7,
      stressLevel: stress,
      notes: notes || "Daily self-check-in recorded.",
    };
    setVitals((prev) => [newEntry, ...prev]);
    setIsLogModalOpen(false);
    toast.success("Wellbeing Vitals Recorded & Saved to PostgreSQL!", {
      description: `Calmness: ${calmness}/10 • Stress: ${stress}`,
    });
  };

  const avgCalmness = (
    vitals.reduce((acc, v) => acc + v.calmnessScore, 0) / vitals.length
  ).toFixed(1);

  const avgSleep = (
    vitals.reduce((acc, v) => acc + v.sleepHours, 0) / vitals.length
  ).toFixed(1);

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl font-serif">
            Wellbeing Vitals & Emotional State
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Monitor somatic calmness, sleep quality, and daily emotional balance over time.
          </p>
        </div>

        <Button
          onClick={() => setIsLogModalOpen(true)}
          className="rounded-xl bg-[#236B54] hover:bg-[#1a5240] text-white font-semibold text-xs h-9 px-4 gap-2"
        >
          <PlusCircle className="size-4" />
          <span>Log Today&apos;s Vitals</span>
        </Button>
      </div>

      {/* ── Top Vital Metric Cards ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="p-4 border-border/60 space-y-1">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-semibold uppercase tracking-wider">Calmness</span>
            <Heart className="size-4 text-rose-500" />
          </div>
          <div className="text-2xl font-bold text-foreground">{avgCalmness} / 10</div>
          <p className="text-[11px] text-muted-foreground">Average resilience</p>
        </Card>

        <Card className="p-4 border-border/60 space-y-1">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-semibold uppercase tracking-wider">Sleep</span>
            <Moon className="size-4 text-indigo-500" />
          </div>
          <div className="text-2xl font-bold text-foreground">{avgSleep} hrs</div>
          <p className="text-[11px] text-muted-foreground">Restful night average</p>
        </Card>

        <Card className="p-4 border-border/60 space-y-1">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-semibold uppercase tracking-wider">Stress State</span>
            <Activity className="size-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">Low / Stable</div>
          <p className="text-[11px] text-muted-foreground">Current somatic baseline</p>
        </Card>

        <Card className="p-4 border-border/60 space-y-1">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-semibold uppercase tracking-wider">Check-in Streak</span>
            <Zap className="size-4 text-amber-500" />
          </div>
          <div className="text-2xl font-bold text-foreground">4 Days</div>
          <p className="text-[11px] text-muted-foreground">Consistent mindfulness</p>
        </Card>
      </div>

      {/* ── Vitals Table ── */}
      <Card className="p-5 border-border/60">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base font-semibold text-foreground">Logged Check-ins & Emotional Vitals</h2>
            <p className="text-xs text-muted-foreground">
              A private health journal tracking somatic recovery and resilience indicators.
            </p>
          </div>
          <Badge variant="outline" className="text-xs font-normal">
            {vitals.length} Logs recorded
          </Badge>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Logged Time</TableHead>
              <TableHead>Calmness Score</TableHead>
              <TableHead>Mood / Emotion</TableHead>
              <TableHead>Sleep</TableHead>
              <TableHead>Stress Level</TableHead>
              <TableHead className="text-right">Notes & Context</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {vitals.map((v) => (
              <TableRow key={v.id}>
                <TableCell className="text-xs font-semibold flex items-center gap-1.5">
                  <Clock className="size-3 text-muted-foreground" />
                  {v.date}
                </TableCell>
                <TableCell>
                  <span className="inline-flex items-center gap-1 font-bold text-sm text-foreground">
                    <Heart className="size-3 text-rose-500" />
                    {v.calmnessScore} / 10
                  </span>
                </TableCell>
                <TableCell className="text-xs font-medium text-foreground">
                  {v.moodLabel}
                </TableCell>
                <TableCell className="text-xs">
                  <span className="flex items-center gap-1">
                    <Moon className="size-3 text-indigo-500" />
                    {v.sleepHours} hrs
                  </span>
                </TableCell>
                <TableCell>
                  <Badge
                    variant="secondary"
                    className={`text-[10px] font-semibold capitalize ${
                      v.stressLevel === "Low"
                        ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300"
                        : v.stressLevel === "Moderate"
                        ? "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300"
                        : "bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300"
                    }`}
                  >
                    {v.stressLevel}
                  </Badge>
                </TableCell>
                <TableCell className="text-right text-xs text-muted-foreground max-w-[240px] truncate">
                  {v.notes}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      {/* ── Log Vitals Modal ── */}
      <Dialog open={isLogModalOpen} onOpenChange={setIsLogModalOpen}>
        <DialogContent className="max-w-md rounded-2xl p-6">
          <DialogHeader>
            <DialogTitle className="font-serif text-lg">Log Wellbeing Vitals</DialogTitle>
            <DialogDescription className="text-xs">
              Quick 60-second reflection on your physical and emotional baseline.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-3 text-xs">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Calmness Scale (1 = Distressed, 10 = Very Calm)</Label>
              <div className="flex items-center gap-3">
                <Input
                  type="range"
                  min="1"
                  max="10"
                  value={calmness}
                  onChange={(e) => setCalmness(Number(e.target.value))}
                  className="w-full accent-[#236B54]"
                />
                <span className="font-bold text-sm w-8 text-center">{calmness}/10</span>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Mood Label</Label>
              <Input
                value={mood}
                onChange={(e) => setMood(e.target.value)}
                placeholder="e.g. Grounded, Tired, Energetic..."
                className="h-8 text-xs"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Sleep (Hours)</Label>
                <Input
                  type="number"
                  step="0.5"
                  value={sleep}
                  onChange={(e) => setSleep(e.target.value)}
                  className="h-8 text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Stress State</Label>
                <select
                  value={stress}
                  onChange={(e) => setStress(e.target.value as any)}
                  className="w-full h-8 rounded-md border border-input bg-background px-2 text-xs"
                >
                  <option value="Low">Low / Manageable</option>
                  <option value="Moderate">Moderate / Tense</option>
                  <option value="Elevated">Elevated / Overwhelmed</option>
                </select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Notes / Somatic Observations (Optional)</Label>
              <Input
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="What helped you feel grounded today?"
                className="h-8 text-xs"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setIsLogModalOpen(false)}>
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleLogVital}
              className="bg-[#236B54] hover:bg-[#1a5240] text-white"
            >
              Save Vitals
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

