/**
 * HowItWorksPage — dedicated deep-dive page on PeerCove's stepped-care peer wellness workflow.
 *
 * Layer: client / (marketing) / pages
 *
 * Covers: the Member Tier 1 -> Tier 2 journey, the Peer Listener / Listener Supervisor /
 * Safety Operations / Platform Admin workflow, and the Three-Engine + Auxiliary Interop
 * architecture.
 */

"use client";

import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "@/i18n/navigation";
import { OAuthPkceButton } from "@/modules/client/auth/components/OAuthPkceButton";
import {
  UserCheck,
  Mic,
  Headphones,
  Heart,
  ShieldAlert,
  ArrowRight,
  ArrowDown,
  CheckCircle2,
  ClipboardCheck,
  Sparkles,
  Lock,
} from "lucide-react";
import type { AuthResponse } from "@/modules/server/auth/types";

// ── Member journey (Tier 1 to Tier 2 & Tier 3) ──────────────────────────────

const memberSteps = [
  {
    icon: <UserCheck className="w-6 h-6 text-primary" />,
    step: "01",
    title: "Enter Member Sanctuary & Consent",
    description:
      "Sign up or launch a demo account into your Member Sanctuary. Before any guided intake or voice stream begins, PeerCove presents explicit consent controls (PeerCoveIntakeGate) explaining transcript-only storage.",
    layerBadge: "Member Sanctuary",
  },
  {
    icon: <Mic className="w-6 h-6 text-primary" />,
    step: "02",
    title: "Guided Text or Live Voice Intake",
    description:
      "Share at your own pace through SSE streaming text intake (/api/agent/intake) or bidirectional WebSocket voice (/ws/audio) powered by Sarvam Saaras v3 STT, Bulbul v3 TTS, and Gemini fallback across English, Hindi, and Hinglish.",
    layerBadge: "Engine 2 · :8018",
  },
  {
    icon: <Sparkles className="w-6 h-6 text-primary" />,
    step: "03",
    title: "Tier 1 Grounding, Mood Pulse & Encrypted Journal",
    description:
      "Access the AI Wellbeing Companion for 4-7-8 Breathing, 5-4-3-2-1 Sensory Grounding, Box Breathing, and PMR — alongside daily Mood Pulse check-ins, personal goals, and an AES-256-GCM encrypted journal.",
    layerBadge: "AES-256-GCM",
  },
  {
    icon: <Headphones className="w-6 h-6 text-primary" />,
    step: "04",
    title: "Peer Listener Match & LiveKit / WebRTC Room",
    description:
      "When human connection helps, Peer Matcher requests a trained, supervisor-verified Peer Listener and opens an encrypted 1-on-1 listening room featuring chat, voice, video, and a shared 4-7-8 breathwork pacer.",
    layerBadge: "Tier 2 · LiveKit",
  },
  {
    icon: <ShieldAlert className="w-6 h-6 text-primary" />,
    step: "05",
    title: "Post-Session Reflection & <2ms Safety Sentinel",
    description:
      "Sync post-call mood reflections privately or export via /api/v1/privacy-requests. Every turn passes through the <2ms Safety Sentinel before inference, surfacing Tele-MANAS 14416, 988, 112, and Safety Ops handoffs.",
    layerBadge: "Tier 3 · Safety",
  },
];

// ── Peer Listener, Supervisor, Safety Ops & Admin journey ──────────────────

const careTeamSteps = [
  {
    icon: <Headphones className="w-6 h-6 text-primary" />,
    step: "01",
    title: "Listener Availability & Offer Queue",
    description:
      "Peer Listeners manage availability windows and capacity, review consent-gated member intake context, and accept match offers.",
  },
  {
    icon: <Heart className="w-6 h-6 text-primary" />,
    step: "02",
    title: "Live Support Room & Breathwork Pacer",
    description:
      "Listeners hold non-clinical, empathetic sessions in WebRTC/LiveKit rooms with an in-call 4-7-8 pacer and real-time Safety Sentinel escalation cards.",
  },
  {
    icon: <Lock className="w-6 h-6 text-primary" />,
    step: "03",
    title: "Encrypted SOAP Debrief & 60s Cooldown",
    description:
      "After each session, listeners submit structured encrypted SOAP reflection notes and complete a mandatory 60-second caregiver decompression cooldown.",
  },
  {
    icon: <ClipboardCheck className="w-6 h-6 text-primary" />,
    step: "04",
    title: "Supervisor Pod Audits & PC-* Signoffs",
    description:
      "Listener Supervisors oversee pod eligibility, resolve encrypted conduct audits, and verify training signoffs: PC-AL-101, PC-BE-201, PC-SS-202, and PC-SC-301.",
  },
  {
    icon: <ShieldAlert className="w-6 h-6 text-primary" />,
    step: "05",
    title: "Safety Ops Triage & Zero-Knowledge Admin",
    description:
      "Safety Operations manages escalated crisis cases and follow-ups while Platform Admins rotate KMS keys and inspect audit trails with zero access to private journals.",
  },
];

// ── Three-Engine & Auxiliary Interop Flow ──────────────────────────────────

const architectureFlow = [
  {
    from: "Next.js App Router Client (:4000)",
    to: "IAM Service (:5001) — Ed25519 JWKS + 5-Role RBAC",
    arrow: true,
  },
  {
    from: "Authenticated Member Turn",
    to: "Engine 2 LangGraph (:8018) — <2ms Safety Sentinel Gate",
    arrow: true,
  },
  {
    from: "Intake / Companion / Voice / Matcher",
    to: "Engine 3 Core API (:8080) — AES-256-GCM + PostgreSQL",
    arrow: true,
  },
  {
    from: "Live Peer Listening Room",
    to: "WebSocket + LiveKit WebRTC + 60s Listener Cooldown",
    arrow: true,
  },
  {
    from: "Platform Governance & Privacy",
    to: "KMS Key Rotation + Immutable AuditEvent + Privacy Exports",
    arrow: true,
  },
  {
    from: "Optional Clinical Interoperability",
    to: "Auxiliary FHIR R4 (:8000, 34 resources) + Read-Only FastMCP (:8002)",
    arrow: false,
  },
];

// ── Animation ──────────────────────────────────────────────────────────────

const fade = {
  hidden: { opacity: 0, y: 20 },
  visible: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.5 },
  }),
};

// ── Component ──────────────────────────────────────────────────────────────

/**
 * How It Works dedicated marketing page — PeerCove stepped-care workflow deep dive.
 *
 * @param session - Active auth session for CTA variant.
 */
export function HowItWorksPage({ session }: { session: AuthResponse | null }) {
  const dashboardHref =
    (session?.session.activeRoleRedirectUrl ?? "/peercove/member").replace(
      /^\/(?:en|hi|ta)/,
      "",
    ) || "/peercove/member";

  return (
    <div className="pt-20">
      {/* ── Hero ── */}
      <section className="py-20 sm:py-28 bg-background relative overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-primary/5 rounded-full blur-3xl opacity-50 pointer-events-none" />
        <div className="max-w-[110rem] mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          <motion.div
            className="max-w-3xl mx-auto"
            initial="hidden"
            animate="visible"
            variants={fade}
          >
            <div className="flex items-center justify-center gap-2 mb-4">
              <Badge variant="outline" className="border-primary/30 text-primary text-xs">
                Stepped-Care Architecture
              </Badge>
              <Badge variant="secondary" className="text-xs">
                AI Companion + Peer Listening + Safety Sentinel
              </Badge>
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-foreground tracking-tight leading-[1.08] mb-6">
              How PeerCove Guides Members Through Stepped Mental Wellness
            </h1>
            <p className="text-lg sm:text-xl text-muted-foreground leading-relaxed mb-8">
              PeerCove connects consent-gated text and voice intake, trained Peer
              Listener rooms, supervisor pod quality audits (PC-*), deterministic
              crisis escalation, and zero-knowledge administration in one platform.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3">
              {!session ? (
                <>
                  <OAuthPkceButton href="/signup" size="lg" className="rounded-full px-8">
                    Get started <ArrowRight className="ml-2 w-4 h-4" />
                  </OAuthPkceButton>
                  <Link href="/demo-login">
                    <Button size="lg" variant="outline" className="rounded-full px-8">
                      Explore 5-Role Demo
                    </Button>
                  </Link>
                </>
              ) : (
                <Link href={dashboardHref as any}>
                  <Button size="lg" className="rounded-full px-8">
                    Open Dashboard <ArrowRight className="ml-2 w-4 h-4" />
                  </Button>
                </Link>
              )}
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── Member journey ── */}
      <section className="py-20 sm:py-24 bg-secondary/30">
        <div className="max-w-[110rem] mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fade}
            className="mb-14"
          >
            <div className="flex items-center gap-3 mb-3">
              <UserCheck className="w-5 h-5 text-primary" />
              <span className="text-primary font-semibold tracking-wider uppercase text-sm">
                For Members
              </span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground">
              The Member Sanctuary Journey (Tier 1 to Tier 2)
            </h2>
            <p className="mt-3 text-lg text-muted-foreground max-w-2xl">
              From consent-first intake and somatic grounding to LiveKit peer
              listening rooms and encrypted journaling, members stay in control
              at every step.
            </p>
          </motion.div>

          <div className="relative space-y-0">
            {memberSteps.map((step, i) => (
              <div key={i} className="flex items-stretch gap-8">
                {/* Timeline */}
                <div className="flex flex-col items-center shrink-0 pt-6">
                  <motion.div
                    initial={{ scale: 0 }}
                    whileInView={{ scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ type: "spring", stiffness: 300, delay: i * 0.1 }}
                    className="w-12 h-12 rounded-full bg-background border-2 border-primary/20 flex items-center justify-center z-10 relative"
                  >
                    <span className="text-primary font-bold text-sm">{step.step}</span>
                  </motion.div>
                  {i < memberSteps.length - 1 && (
                    <div className="w-0.5 flex-1 bg-border/60 my-2" />
                  )}
                </div>

                {/* Content */}
                <motion.div
                  custom={i}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true }}
                  variants={fade}
                  className="flex-1 pb-10"
                >
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-9 h-9 rounded-xl bg-background border border-border flex items-center justify-center">
                      {step.icon}
                    </div>
                    <h3 className="text-xl font-bold text-foreground">{step.title}</h3>
                    <Badge
                      variant="outline"
                      className="text-[10px] font-mono ml-auto border-primary/30 text-primary"
                    >
                      {step.layerBadge}
                    </Badge>
                  </div>
                  <p className="text-muted-foreground leading-relaxed ml-12">
                    {step.description}
                  </p>
                </motion.div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Care Team, Supervisor & Safety Operations journey ── */}
      <section className="py-20 sm:py-24 bg-background">
        <div className="max-w-[110rem] mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fade}
            className="mb-14"
          >
            <div className="flex items-center gap-3 mb-3">
              <Headphones className="w-5 h-5 text-primary" />
              <span className="text-primary font-semibold tracking-wider uppercase text-sm">
                Support, Supervision &amp; Governance
              </span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground">
              Peer Listener, Supervisor, Safety Ops &amp; Admin Flow
            </h2>
            <p className="mt-3 text-lg text-muted-foreground max-w-2xl">
              Every peer session is backed by supervisor pod readiness
              (PC-AL-101, PC-BE-201, PC-SS-202, PC-SC-301), human Safety
              Operations triage, and zero-knowledge platform administration.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
            {careTeamSteps.map((step, i) => (
              <motion.div
                key={i}
                custom={i}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fade}
                className="relative"
              >
                <Card className="h-full border-border/50 bg-card">
                  <CardContent className="pt-5 space-y-3">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-primary">{step.step}</span>
                      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                        {step.icon}
                      </div>
                    </div>
                    <h3 className="font-bold text-card-foreground text-sm">{step.title}</h3>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {step.description}
                    </p>
                  </CardContent>
                </Card>
                {i < careTeamSteps.length - 1 && (
                  <div className="hidden xl:flex absolute -right-2 top-1/2 -translate-y-1/2 z-10">
                    <ArrowRight className="w-4 h-4 text-muted-foreground/40" />
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Technical data flow ── */}
      <section className="py-20 sm:py-24 bg-secondary/30">
        <div className="max-w-[110rem] mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fade}
            className="text-center max-w-3xl mx-auto mb-14"
          >
            <span className="text-primary font-semibold tracking-wider uppercase text-sm">
              Three-Engine Architecture
            </span>
            <h2 className="mt-2 text-3xl sm:text-4xl font-bold text-foreground">
              End-to-End Flow Across Core Services &amp; Auxiliary Interop
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Engine 2 AI agents hold zero database credentials and route every
              turn through the pre-inference Safety Sentinel before Engine 3
              persists encrypted state.
            </p>
          </motion.div>

          <div className="max-w-2xl mx-auto space-y-3">
            {architectureFlow.map((flow, i) => (
              <motion.div
                key={i}
                custom={i}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fade}
                className="flex flex-col items-center"
              >
                <div className="w-full flex items-center gap-4 p-4 rounded-xl bg-card border border-border">
                  <div className="flex-1 text-sm font-medium text-foreground">
                    {flow.from}
                  </div>
                  <ArrowRight className="w-4 h-4 text-primary shrink-0" />
                  <div className="flex-1 text-sm font-mono text-primary text-right">
                    {flow.to}
                  </div>
                </div>
                {flow.arrow && <ArrowDown className="w-4 h-4 text-border my-1" />}
              </motion.div>
            ))}
          </div>

          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.5, duration: 0.6 }}
            className="mt-12 flex items-center justify-center gap-3 text-sm text-muted-foreground max-w-xl mx-auto text-center"
          >
            <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
            Non-clinical boundaries are enforced across every agent and workspace:
            no automated medical diagnoses, prescriptions, or unreviewed admin
            access to member journals.
          </motion.div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-20 sm:py-28 bg-background">
        <div className="max-w-[110rem] mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
          >
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
              Walk Through Every Role Yourself
            </h2>
            <p className="text-lg text-muted-foreground max-w-xl mx-auto mb-10">
              Launch your Member Sanctuary or explore all five stepped-care RBAC
              workspaces in seconds via demo access.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3">
              {!session ? (
                <>
                  <OAuthPkceButton href="/signup" size="lg" className="rounded-full px-10 h-12">
                    Get started <ArrowRight className="ml-2 w-4 h-4" />
                  </OAuthPkceButton>
                  <Link href="/demo-login">
                    <Button size="lg" variant="outline" className="rounded-full px-8 h-12">
                      Try 5-Role Demo
                    </Button>
                  </Link>
                </>
              ) : (
                <Link href={dashboardHref as any}>
                  <Button size="lg" className="rounded-full px-10 h-12">
                    Open Dashboard <ArrowRight className="ml-2 w-4 h-4" />
                  </Button>
                </Link>
              )}
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
