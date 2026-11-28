/**
 * AiAgentsPage — dedicated marketing page explaining PeerCove's live Engine 2 LangGraph agents.
 *
 * Layer: client / (marketing) / pages
 *
 * Covers: Safety Sentinel (<2ms pre-inference circuit breaker), Guided Text Intake &
 * Wellbeing Companion, Live Voice Intake & Companion (Sarvam STT/TTS + Gemini fallback),
 * Peer Listener Matcher, and strict non-clinical + zero-DB-access safeguards.
 */

"use client";

import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "@/i18n/navigation";
import { OAuthPkceButton } from "@/modules/client/auth/components/OAuthPkceButton";
import {
  ShieldAlert,
  MessageSquare,
  Mic,
  Headphones,
  ArrowRight,
  CheckCircle2,
  Sparkles,
  Database,
  ShieldCheck,
  Lock,
  Clock,
} from "lucide-react";
import type { AuthResponse } from "@/modules/server/auth/types";

// ── Live Engine 2 (:8018) LangGraph Agents & Voice Service ──────────────────

const agents = [
  {
    id: "safety-sentinel",
    icon: <ShieldAlert className="w-8 h-8 text-primary" />,
    status: "Live · <2ms",
    title: "Safety Sentinel",
    subtitle: "Pre-inference deterministic crisis circuit breaker (safety_sentinel)",
    description:
      "Every incoming message enters the LangGraph StateGraph through safety_sentinel before any LLM inference runs. Deterministic regex tripwires across English, Hindi (Devanagari), and Hinglish detect acute crisis signals in under 2ms, short-circuit to END, and surface immediate help.",
    howItWorks: [
      "Executes prior to LLM generation with zero model-latency dependency",
      "Scans English, Hinglish (Romanized Hindi), and Hindi (Devanagari)",
      "Sets is_crisis: true and short-circuits directly out of the graph",
      "Surfaces verified helplines: Tele-MANAS 14416, US 988, and Emergency 112",
      "Routes escalation alerts to human Safety Operations for follow-up",
    ],
    outputs: [
      "Deterministic <2ms risk gate",
      "Tele-MANAS 14416 & 988 / 112 guidance",
      "Voice crisis alert synthesis",
      "Safety Operations escalation trigger",
    ],
  },
  {
    id: "intake-companion",
    icon: <MessageSquare className="w-8 h-8 text-primary" />,
    status: "Live",
    title: "Guided Text Intake & Wellbeing Companion",
    subtitle: "SSE streaming intake & Tier 1 somatic grounding (intake + companion)",
    description:
      "Guides members at their own pace via POST /api/agent/intake SSE streaming with 20-turn session memory and strict language matching. The Tier 1 AI Wellbeing Companion offers evidence-informed somatic and mindfulness practices without clinical diagnosis or prescriptions.",
    howItWorks: [
      "Consent-gated entry via PeerCoveIntakeGate before any turn runs",
      "Streams natural, non-clinical reflections over SSE (text_delta / agent_end)",
      "Delivers 4-7-8 Breathing, 5-4-3-2-1 Sensory Grounding, Box Breathing & PMR",
      "Responds fluently in English, Hindi, or Hinglish matching member preference",
      "Persists mood check-ins and encrypted journal entries via Engine 3 REST APIs",
    ],
    outputs: [
      "4-7-8 & Box Breathing guidance",
      "5-4-3-2-1 Sensory Grounding & PMR",
      "Structured consent-gated intake summary",
      "AES-256-GCM encrypted reflection entries",
    ],
  },
  {
    id: "voice-service",
    icon: <Mic className="w-8 h-8 text-primary" />,
    status: "Live",
    title: "Live Voice Intake & Companion",
    subtitle: "Bidirectional WebSocket voice pipeline (/ws/audio) with Sarvam + Gemini",
    description:
      "Real-time hands-free voice intake and grounding over an EdDSA-authenticated WebSocket (/ws/audio) with AudioWorklet 16kHz PCM capture, ~300ms pre-speech adaptive VAD ring buffer, Sarvam STT (saaras:v3) with Gemini multimodal fallback, and calming 24kHz Sarvam TTS (bulbul:v3).",
    howItWorks: [
      "Authenticates WebSocket stream with IAM Ed25519 JWKS token validation",
      "Captures 16kHz PCM audio with adaptive Voice Activity Detection (VAD)",
      "Transcribes Hindi, Hinglish, and English via Sarvam saaras:v3 + Gemini fallback",
      "Synthesizes calm 24kHz voice responses (Sarvam bulbul:v3) including crisis alerts",
      "Stores encrypted transcript text only — raw audio recordings are never stored",
    ],
    outputs: [
      "Bidirectional /ws/audio voice stream",
      "Auto-detected EN / HI / Hinglish STT",
      "24kHz calming TTS audio synthesis",
      "Transcript-only encrypted persistence",
    ],
  },
  {
    id: "peer-matcher",
    icon: <Headphones className="w-8 h-8 text-primary" />,
    status: "Live",
    title: "Peer Listener Matcher",
    subtitle: "Human-in-the-loop stepped-care escalation (peer_matcher)",
    description:
      "When a member expresses interest in speaking with a trained human peer, peer_matcher coordinates with Engine 3 (/api/v1/peer/match-requests) to pair them with an eligible, supervisor-verified Peer Listener and open the encrypted LiveKit/WebRTC listening room modal.",
    howItWorks: [
      "Detects human peer support intent in the LangGraph StateGraph",
      "Dispatches match request to Engine 3 with bounded 1.5s timeout",
      "Pairs with supervisor-verified listeners within active capacity windows",
      "Launches confidential WebRTC/LiveKit listening room (open_session_modal)",
      "Preserves stepped-care continuity into post-call mood & SOAP debrief",
    ],
    outputs: [
      "Verified Peer Listener pairing",
      "Encrypted LiveKit / WebRTC room handoff",
      "Shared 4-7-8 breathwork pacer",
      "Stepped-care Tier 1 -> Tier 2 bridge",
    ],
  },
];

// ── Oversight & Safety Principles ───────────────────────────────────────────

const oversightPrinciples = [
  {
    icon: <Database className="w-5 h-5 text-primary" />,
    title: "Zero Direct DB Access",
    description:
      "The Engine 2 agent container holds zero PostgreSQL credentials. All persistence routes through authenticated Engine 3 REST APIs.",
  },
  {
    icon: <ShieldAlert className="w-5 h-5 text-primary" />,
    title: "Pre-Inference Safety Sentinel",
    description:
      "Every turn hits the deterministic <2ms regex circuit breaker first — crisis helplines never depend on LLM latency or generation.",
  },
  {
    icon: <ShieldCheck className="w-5 h-5 text-primary" />,
    title: "Non-Clinical Boundaries",
    description:
      "Agents never diagnose conditions or prescribe treatments. They offer somatic grounding, guided reflection, and peer listener matching.",
  },
  {
    icon: <Lock className="w-5 h-5 text-primary" />,
    title: "Transcript-Only Voice Consent",
    description:
      "Explicit consent gates precede intake and voice sessions. PeerCove stores AES-256-GCM encrypted transcripts, never raw voice audio.",
  },
];

// ── Animation ──────────────────────────────────────────────────────────────

const fade = {
  hidden: { opacity: 0, y: 20 },
  visible: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.07, duration: 0.5 },
  }),
};

// ── Component ──────────────────────────────────────────────────────────────

/**
 * AI Wellbeing Agents dedicated marketing page.
 *
 * @param session - Active auth session for CTA variant.
 */
export function AiAgentsPage({ session }: { session: AuthResponse | null }) {
  const dashboardHref =
    (session?.session.activeRoleRedirectUrl ?? "/peercove/member").replace(
      /^\/(?:en|hi|ta)/,
      "",
    ) || "/peercove/member";

  return (
    <div className="pt-20">
      {/* ── Hero ── */}
      <section className="py-20 sm:py-28 bg-background relative overflow-hidden">
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-3xl opacity-50 pointer-events-none" />
        <div className="max-w-[110rem] mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <motion.div className="max-w-3xl" initial="hidden" animate="visible" variants={fade}>
            <div className="flex items-center gap-2 mb-4">
              <Badge variant="outline" className="border-primary/30 text-primary text-xs">
                Engine 2 · LangGraph (:8018)
              </Badge>
              <Badge variant="secondary" className="text-xs">
                Live Text &amp; Voice Wellbeing Agents
              </Badge>
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-foreground tracking-tight leading-[1.08] mb-6">
              Live Wellbeing Agents Built Around Safety, Consent &amp; Peer Care
            </h1>
            <p className="text-lg sm:text-xl text-muted-foreground leading-relaxed mb-8">
              PeerCove&apos;s Engine 2 orchestrates a LangGraph StateGraph and
              bidirectional Sarvam/Gemini voice pipeline — starting every turn with
              a deterministic &lt;2ms Safety Sentinel before offering grounding,
              guided intake, or a live Peer Listener match.
            </p>
            <div className="flex flex-wrap gap-3">
              {!session ? (
                <>
                  <OAuthPkceButton href="/signup" size="lg" className="rounded-full px-8">
                    Get started <ArrowRight className="ml-2 w-4 h-4" />
                  </OAuthPkceButton>
                  <Link href="/demo-login">
                    <Button size="lg" variant="outline" className="rounded-full px-8">
                      Try 5-Role Demo
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
              <a
                href="#agents"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-full border border-border text-sm font-medium hover:bg-secondary transition-colors"
              >
                Explore Live Agents <ArrowRight className="w-4 h-4" />
              </a>
            </div>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.6 }}
            className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-6 p-8 rounded-2xl bg-secondary/40 border border-border/50"
          >
            {[
              { icon: <Sparkles className="w-5 h-5 text-primary" />, value: "4", label: "Live LangGraph & voice services" },
              { icon: <Clock className="w-5 h-5 text-primary" />, value: "<2ms", label: "Pre-inference Safety Sentinel" },
              { icon: <Mic className="w-5 h-5 text-primary" />, value: "EN/HI", label: "English, Hindi & Hinglish voice" },
              { icon: <Database className="w-5 h-5 text-primary" />, value: "0", label: "Direct DB credentials in Engine 2" },
            ].map((f, i) => (
              <div key={i} className="text-center">
                <div className="flex justify-center mb-2">{f.icon}</div>
                <p className="text-2xl font-bold text-foreground">{f.value}</p>
                <p className="text-sm text-muted-foreground mt-1">{f.label}</p>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── Agents ── */}
      <section id="agents" className="py-20 sm:py-24 bg-secondary/30">
        <div className="max-w-[110rem] mx-auto px-4 sm:px-6 lg:px-8 space-y-20">
          {agents.map((agent, ai) => (
            <motion.div
              key={agent.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7 }}
              className={`grid lg:grid-cols-2 gap-12 items-start ${
                ai % 2 === 1 ? "lg:grid-flow-col-dense" : ""
              }`}
            >
              {/* Text side */}
              <div className={ai % 2 === 1 ? "lg:col-start-2" : ""}>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-14 h-14 rounded-2xl border border-primary/20 bg-primary/10 flex items-center justify-center">
                    {agent.icon}
                  </div>
                  <div>
                    <Badge
                      variant="outline"
                      className="text-[10px] mb-1 border-primary/30 text-primary"
                    >
                      {agent.status}
                    </Badge>
                    <h2 className="text-2xl font-bold text-foreground">{agent.title}</h2>
                  </div>
                </div>
                <p className="text-muted-foreground font-medium mb-3">{agent.subtitle}</p>
                <p className="text-muted-foreground leading-relaxed mb-6">{agent.description}</p>

                <div className="space-y-2 mb-6">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    How It Works
                  </p>
                  {agent.howItWorks.map((step, i) => (
                    <div key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                      <span className="font-bold shrink-0 mt-0.5 text-primary">{i + 1}.</span>
                      {step}
                    </div>
                  ))}
                </div>
              </div>

              {/* Output card */}
              <div className={ai % 2 === 1 ? "lg:col-start-1 lg:row-start-1" : ""}>
                <Card className="border border-primary/20 bg-card">
                  <CardContent className="pt-6">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-4">
                      Verified Capabilities &amp; Outputs
                    </p>
                    <div className="space-y-3">
                      {agent.outputs.map((output, i) => (
                        <div
                          key={i}
                          className="flex items-center gap-3 p-3 rounded-xl bg-background border border-border/50"
                        >
                          <CheckCircle2 className="w-4 h-4 shrink-0 text-primary" />
                          <span className="text-sm text-foreground font-medium">{output}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── Guardrails & Isolation ── */}
      <section className="py-20 sm:py-24 bg-background">
        <div className="max-w-[110rem] mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fade}
            className="text-center max-w-3xl mx-auto mb-16"
          >
            <span className="text-primary font-semibold tracking-wider uppercase text-sm">
              Safety &amp; Isolation
            </span>
            <h2 className="mt-2 text-3xl sm:text-4xl font-bold text-foreground">
              Deterministic Guardrails Before Every Inference
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Engine 2 never touches database secrets directly and never provides
              medical diagnoses — every step preserves human agency and member consent.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {oversightPrinciples.map((p, i) => (
              <motion.div
                key={i}
                custom={i}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fade}
              >
                <Card className="h-full border-border/50 bg-card">
                  <CardContent className="pt-6 space-y-3">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                      {p.icon}
                    </div>
                    <h3 className="font-bold text-card-foreground">{p.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {p.description}
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-20 sm:py-28 bg-secondary/30">
        <div className="max-w-[110rem] mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
          >
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
              Experience Guided Text &amp; Live Voice Support
            </h2>
            <p className="text-lg text-muted-foreground max-w-xl mx-auto mb-10">
              Start in your Member Sanctuary with somatic grounding, voice intake,
              and trained Peer Listener rooms.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3">
              {!session ? (
                <>
                  <OAuthPkceButton href="/signup" size="lg" className="rounded-full px-10 h-12">
                    Get started <ArrowRight className="ml-2 w-4 h-4" />
                  </OAuthPkceButton>
                  <Link href="/demo-login">
                    <Button size="lg" variant="outline" className="rounded-full px-8 h-12">
                      Explore 5-Role Demo
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
