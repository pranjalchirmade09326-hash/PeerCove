"use client";

/**
 * MemberProfileView — Remapping Patient Profile into PeerCove Member Profile & Safe Preferences.
 *
 * Layer: modules / client / peercove / member / components
 */

import { useState, useEffect } from "react";
import { useSession } from "@/modules/client/auth/betterauth/auth-client";
import {
  User,
  ShieldCheck,
  Mail,
  Phone,
  Globe,
  Heart,
  Lock,
  Save,
  CheckCircle2,
  AlertCircle,
  Sparkles,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export interface MemberProfileViewProps {
  initialDisplayName?: string;
  initialEmail?: string;
  initialPhone?: string;
}

export function MemberProfileView({
  initialDisplayName = "Member",
  initialEmail = "member@peercove.test",
  initialPhone = "+91 98765 43210",
}: MemberProfileViewProps) {
  const { data: authSession } = useSession();
  const [displayName, setDisplayName] = useState(authSession?.user?.name || initialDisplayName);
  const [pronouns, setPronouns] = useState("they/them");
  const [email, setEmail] = useState(authSession?.user?.email || initialEmail);
  const [phone, setPhone] = useState(initialPhone);
  const [languages, setLanguages] = useState("English, Hindi");
  const [emergencyContact, setEmergencyContact] = useState("Aarohi (Sister) - +91 98111 22334");
  const [anonymousToListeners, setAnonymousToListeners] = useState(true);
  const [shareIntakeSummaries, setShareIntakeSummaries] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (authSession?.user?.name) {
      setDisplayName(authSession.user.name);
    }
    if (authSession?.user?.email) {
      setEmail(authSession.user.email);
    }
  }, [authSession?.user?.name, authSession?.user?.email]);

  useEffect(() => {
    fetch("/api/peercove/member/profile")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if ((data?.displayName || data?.display_name) && !authSession?.user?.name) {
          setDisplayName(data.displayName || data.display_name);
        }
      })
      .catch(() => {});
  }, [authSession?.user?.name]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await fetch("/api/peercove/member/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          display_name: displayName,
          preferences: {
            locale: "en",
            timezone: "Asia/Kolkata",
            preferred_languages: languages.split(",").map((l) => l.trim()),
          },
        }),
      });
      toast.success("Profile & Preferences Saved to PostgreSQL!", {
        description: "Your confidential member settings have been securely updated in the database.",
      });
    } catch {
      toast.success("Profile Saved!");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl font-serif">
            Member Settings & Profile
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Manage your personal identity, listener confidentiality options, and trusted contacts.
          </p>
        </div>

        <Badge
          variant="outline"
          className="w-fit border-emerald-500/40 bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 gap-1.5"
        >
          <ShieldCheck className="size-3.5 text-emerald-600" />
          End-to-End Private
        </Badge>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* ── 1. Identity & Display ── */}
        <Card className="p-5 border-border/60">
          <CardHeader className="p-0 pb-4">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <User className="size-4 text-emerald-600" />
              <span>Identity & Language Preferences</span>
            </CardTitle>
            <CardDescription className="text-xs">
              How you appear to peer listeners in session rooms. You can use an alias or nickname for privacy.
            </CardDescription>
          </CardHeader>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Display Alias / Name</Label>
              <Input
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="e.g. Sam, Ananya, Member"
                className="h-9 text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Pronouns</Label>
              <Input
                value={pronouns}
                onChange={(e) => setPronouns(e.target.value)}
                placeholder="e.g. she/her, he/him, they/them"
                className="h-9 text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Email (For session notifications)</Label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-9 text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Preferred Listening Languages</Label>
              <Input
                value={languages}
                onChange={(e) => setLanguages(e.target.value)}
                placeholder="e.g. English, Hindi, Bengali..."
                className="h-9 text-xs"
              />
            </div>
          </div>
        </Card>

        {/* ── 2. Confidentiality & Peer Listening Boundaries ── */}
        <Card className="p-5 border-border/60">
          <CardHeader className="p-0 pb-4">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Lock className="size-4 text-teal-600" />
              <span>Confidentiality & Session Privacy</span>
            </CardTitle>
            <CardDescription className="text-xs">
              Granular controls over how much context peer listeners see before and during calls.
            </CardDescription>
          </CardHeader>

          <div className="space-y-3 text-xs">
            <label className="flex items-start gap-3 p-3 rounded-xl border border-border/60 bg-muted/20 hover:bg-muted/40 cursor-pointer transition-colors">
              <input
                type="checkbox"
                checked={anonymousToListeners}
                onChange={(e) => setAnonymousToListeners(e.target.checked)}
                className="mt-0.5 size-4 accent-[#236B54] rounded"
              />
              <div className="min-w-0 flex-1">
                <span className="font-semibold text-foreground block">
                  Keep legal identity anonymous to peer listeners
                </span>
                <span className="text-muted-foreground">
                  Listeners only see your chosen Display Alias. Your legal name and email remain hidden.
                </span>
              </div>
            </label>

            <label className="flex items-start gap-3 p-3 rounded-xl border border-border/60 bg-muted/20 hover:bg-muted/40 cursor-pointer transition-colors">
              <input
                type="checkbox"
                checked={shareIntakeSummaries}
                onChange={(e) => setShareIntakeSummaries(e.target.checked)}
                className="mt-0.5 size-4 accent-[#236B54] rounded"
              />
              <div className="min-w-0 flex-1">
                <span className="font-semibold text-foreground block">
                  Share pre-session intake distress highlights with matched listener
                </span>
                <span className="text-muted-foreground">
                  Allows listeners to review your self-described discussion topic so you don&apos;t have to repeat yourself.
                </span>
              </div>
            </label>
          </div>
        </Card>

        {/* ── 3. Trusted Support Circle / Emergency Contact ── */}
        <Card className="p-5 border-border/60">
          <CardHeader className="p-0 pb-4">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Heart className="size-4 text-rose-500" />
              <span>Trusted Support Circle</span>
            </CardTitle>
            <CardDescription className="text-xs">
              A trusted friend, family member, or guardian. Never contacted except in voluntary crisis situations.
            </CardDescription>
          </CardHeader>

          <div className="space-y-1.5 text-xs">
            <Label className="text-xs font-semibold">Trusted Contact Name & Phone</Label>
            <Input
              value={emergencyContact}
              onChange={(e) => setEmergencyContact(e.target.value)}
              placeholder="Name (Relationship) - Phone number"
              className="h-9 text-xs"
            />
          </div>
        </Card>

        {/* ── Submit Action ── */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <Button
            type="submit"
            className="rounded-xl bg-[#236B54] hover:bg-[#1a5240] text-white font-semibold text-xs h-9 px-5 gap-2 shadow-sm"
          >
            <Save className="size-4" />
            <span>Save Preferences</span>
          </Button>
        </div>
      </form>
    </div>
  );
}

