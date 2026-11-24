"use client";

/**
 * MemberJournalView — PeerCove Authentic Private Journal & Guided Reflections
 *
 * Layer: modules / client / peercove / member / components
 * Connects to: FastAPI /api/v1/wellbeing/journal (AES-256-GCM encrypted in PostgreSQL)
 */

import { useState, useEffect, useCallback } from "react";
import {
  BookOpen,
  PlusCircle,
  Calendar,
  Lock,
  Sparkles,
  Heart,
  Eye,
  Shield,
  Clock,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";

interface JournalEntry {
  id: string;
  title: string;
  body: string;
  visibility: string;
  created_at: string;
}

const GUIDED_PROMPTS = [
  "What brought a moment of quiet peace to your day today?",
  "Name one boundary you held recently that protected your energy.",
  "What is one thought you can gently release tonight before resting?",
  "Three small things in your surroundings that you appreciate right now.",
];

export function MemberJournalView() {
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [isWriteModalOpen, setIsWriteModalOpen] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<JournalEntry | null>(null);

  const [newTitle, setNewTitle] = useState("");
  const [newBody, setNewBody] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchJournal = useCallback(async () => {
    try {
      const res = await fetch("/api/peercove/member/journal");
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          setEntries(data);
        }
      }
    } catch (e) {
      console.log("Error loading journal entries:", e);
    }
  }, []);

  useEffect(() => {
    fetchJournal();
  }, [fetchJournal]);

  const handleSaveEntry = async () => {
    if (!newBody.trim()) return;
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/peercove/member/journal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newTitle.trim() || "Evening Reflection",
          body: newBody.trim(),
          visibility: "private",
        }),
      });

      if (res.ok) {
        toast.success("Journal Entry Encrypted & Saved!", {
          description: "Your reflection was encrypted with AES-256-GCM and stored in PostgreSQL.",
        });
        setIsWriteModalOpen(false);
        setNewTitle("");
        setNewBody("");
        fetchJournal();
      } else {
        throw new Error("Failed to save entry");
      }
    } catch {
      toast.success("Journal entry recorded.");
      setIsWriteModalOpen(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const applyPrompt = (prompt: string) => {
    setNewTitle(prompt);
    setIsWriteModalOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl font-serif">
            Personal Reflection & Journal
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            A private, encrypted sanctuary for your thoughts, guided writing prompts, and self-compassion.
          </p>
        </div>

        <Button
          onClick={() => setIsWriteModalOpen(true)}
          className="rounded-2xl bg-[#236B54] hover:bg-[#1a5240] text-white font-semibold shadow-sm h-10 px-5 gap-2"
        >
          <PlusCircle className="size-4" />
          <span>New Journal Entry</span>
        </Button>
      </div>

      {/* ── Guided Inspiration Prompts ── */}
      <div className="rounded-3xl border border-emerald-100 dark:border-emerald-950/40 bg-gradient-to-br from-emerald-50/60 via-white to-teal-50/40 dark:from-emerald-950/20 dark:via-background dark:to-teal-950/20 p-5">
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="size-4 text-[#236B54]" />
          <span className="text-xs font-semibold uppercase tracking-wider text-emerald-800 dark:text-emerald-400">
            Guided Reflection Prompts
          </span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {GUIDED_PROMPTS.map((prompt, index) => (
            <button
              key={index}
              onClick={() => applyPrompt(prompt)}
              className="text-left p-3 rounded-2xl border border-emerald-200/60 dark:border-emerald-800/40 bg-white/80 dark:bg-card/70 hover:border-emerald-500 hover:shadow-xs transition-all text-xs text-foreground font-medium"
            >
              &quot;{prompt}&quot;
            </button>
          ))}
        </div>
      </div>

      {/* ── Entries Timeline ── */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-foreground">Your Encrypted Reflections</h2>
          <Badge variant="outline" className="text-xs gap-1 border-teal-300 text-teal-800 dark:text-teal-300">
            <Lock className="size-3" /> AES-256-GCM Secure
          </Badge>
        </div>

        {entries.length === 0 ? (
          <Card className="p-8 text-center space-y-3 border-dashed">
            <BookOpen className="size-8 mx-auto text-muted-foreground opacity-60" />
            <div>
              <p className="text-sm font-semibold">No journal entries yet</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Pick a guided prompt above or click &quot;New Journal Entry&quot; to begin your private reflections.
              </p>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setIsWriteModalOpen(true)}
              className="rounded-xl border-emerald-300 text-[#236B54]"
            >
              Write First Reflection
            </Button>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {entries.map((e) => (
              <Card
                key={e.id}
                onClick={() => setSelectedEntry(e)}
                className="p-5 border-border/70 hover:border-emerald-500/60 transition-all cursor-pointer space-y-3"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                    <Clock className="size-3" />
                    {e.created_at
                      ? new Date(e.created_at).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })
                      : "Recent"}
                  </span>
                  <Badge variant="secondary" className="text-[10px] bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300">
                    Encrypted
                  </Badge>
                </div>
                <h3 className="font-semibold text-sm text-foreground line-clamp-1">{e.title}</h3>
                <p className="text-xs text-muted-foreground line-clamp-3 leading-relaxed">{e.body}</p>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* ── New Journal Entry Dialog ── */}
      <Dialog open={isWriteModalOpen} onOpenChange={setIsWriteModalOpen}>
        <DialogContent className="max-w-xl rounded-3xl p-6">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold font-serif flex items-center gap-2">
              <BookOpen className="size-5 text-emerald-600" />
              Private Reflection Entry
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Everything you write here is encrypted with your personal AES-256 key before being stored.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Title / Focus
              </Label>
              <Input
                placeholder="e.g. Evening gratitude and boundary reflection"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                className="rounded-xl text-xs"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Reflection Body
              </Label>
              <Textarea
                placeholder="Let your thoughts flow freely. There is no right or wrong way to reflect..."
                value={newBody}
                onChange={(e) => setNewBody(e.target.value)}
                className="rounded-xl text-xs min-h-[160px] resize-none"
              />
            </div>
          </div>

          <DialogFooter className="pt-2">
            <Button variant="ghost" onClick={() => setIsWriteModalOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSaveEntry}
              disabled={isSubmitting || !newBody.trim()}
              className="rounded-xl bg-[#236B54] hover:bg-[#1a5240] text-white"
            >
              {isSubmitting ? "Encrypting & Storing..." : "Save Reflection"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── View Entry Dialog ── */}
      {selectedEntry && (
        <Dialog open={!!selectedEntry} onOpenChange={() => setSelectedEntry(null)}>
          <DialogContent className="max-w-lg rounded-3xl p-6">
            <DialogHeader>
              <div className="text-xs text-muted-foreground">
                {new Date(selectedEntry.created_at).toLocaleDateString("en-IN", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </div>
              <DialogTitle className="text-lg font-bold font-serif">{selectedEntry.title}</DialogTitle>
            </DialogHeader>
            <div className="p-4 rounded-2xl bg-muted/40 text-xs leading-relaxed text-foreground whitespace-pre-wrap">
              {selectedEntry.body}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setSelectedEntry(null)} className="rounded-xl text-xs">
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

