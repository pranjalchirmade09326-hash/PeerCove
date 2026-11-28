/**
 * Features — member-centered overview of PeerCove's stepped-care wellness platform.
 *
 * Layer: client / (marketing) / components
 *
 * Highlights the 6 implemented pillars: AI Wellbeing Companion & Grounding,
 * Guided Text & Live Voice Intake, Peer Listener Matching & LiveKit Rooms,
 * Mood Pulse + AES-256-GCM Encrypted Journal + Goals, Deterministic <2ms Crisis Sentinel,
 * and Zero-Knowledge Admin Governance & Auxiliary FHIR R4 / FastMCP Interop.
 */

"use client";

import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Sparkles,
  Mic,
  Headphones,
  Heart,
  ShieldAlert,
  Lock,
} from "lucide-react";

// ── Animation variants ──────────────────────────────────────────────────────

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1 } },
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: { y: 0, opacity: 1, transition: { duration: 0.5, ease: "easeOut" as const } },
};

// ── Feature definitions ─────────────────────────────────────────────────────

const features = [
  {
    icon: <Sparkles className="h-8 w-8 text-primary" />,
    title: "AI Wellbeing Companion & Grounding",
    badge: "Tier 1 · Live",
    description:
      "Start in your Member Sanctuary with guided 4-7-8 Breathing, 5-4-3-2-1 Sensory Grounding, Box Breathing, and Progressive Muscle Relaxation in English, Hindi, and Hinglish.",
  },
  {
    icon: <Mic className="h-8 w-8 text-primary" />,
    title: "Guided Text & Live Voice Intake",
    badge: "Chat & Voice",
    description:
      "Consent-gated SSE text intake and bidirectional WebSocket voice intake (Saaras v3, Bulbul v3, and Gemini fallback) store encrypted transcripts only — never raw audio.",
  },
  {
    icon: <Headphones className="h-8 w-8 text-primary" />,
    title: "Peer Listener Matching & LiveKit Rooms",
    badge: "Tier 2 · E2EE",
    description:
      "Connect 1-on-1 with supervisor-verified Peer Listeners over WebRTC/LiveKit video, voice, or chat rooms with an in-call 4-7-8 breathwork pacer and encrypted SOAP debrief.",
  },
  {
    icon: <Heart className="h-8 w-8 text-primary" />,
    title: "Mood Pulse, Encrypted Journal & Goals",
    badge: "AES-256-GCM",
    description:
      "Track daily mood pulse trends, write privately in an AES-256-GCM envelope-encrypted journal with KMS key rotation, and set personal wellbeing goals.",
  },
  {
    icon: <ShieldAlert className="h-8 w-8 text-primary" />,
    title: "Deterministic <2ms Crisis Sentinel",
    badge: "Tier 3 · Safety",
    description:
      "A pre-inference safety tripwire runs in under 2ms before any AI inference, surfacing Tele-MANAS 14416, 988, 112, and human-led Safety Operations escalation.",
  },
  {
    icon: <Lock className="h-8 w-8 text-primary" />,
    title: "Zero-Knowledge Governance & Interop",
    badge: "FHIR R4 & MCP",
    description:
      "Least-privilege 5-role Ed25519 JWKS RBAC keeps Platform Admins isolated from private journals, alongside an optional 34-resource HL7 FHIR R4 and read-only FastMCP tier.",
  },
];

// ── Component ──────────────────────────────────────────────────────────────

/**
 * Animated six-card feature grid showcasing PeerCove's implemented capabilities.
 */
export default function Features() {
  return (
    <motion.section
      id="features"
      className="py-20 sm:py-28 bg-secondary/30"
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.15 }}
      variants={containerVariants}
    >
      <div className="max-w-[110rem] mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div variants={itemVariants} className="text-center max-w-3xl mx-auto mb-16">
          <span className="text-primary font-semibold tracking-wider uppercase text-sm">
            Stepped-Care Mental Wellness
          </span>
          <h2 className="mt-2 text-3xl sm:text-4xl font-bold text-foreground">
            Support that meets you where you are
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            From private grounding tools and guided voice intake to trained peer
            listening rooms and deterministic crisis escalation, every layer is
            built around your safety and privacy.
          </p>
        </motion.div>

        <motion.div
          className="grid gap-8 md:grid-cols-2 lg:grid-cols-3"
          variants={containerVariants}
        >
          {features.map((feature, index) => (
            <motion.div
              key={index}
              variants={itemVariants}
              whileHover={{ y: -5 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <Card className="h-full border-border/50 bg-card/50 backdrop-blur-sm hover:bg-card hover:border-border transition-all duration-300 group">
                <CardHeader>
                  <div className="flex items-start justify-between mb-4">
                    <div className="inline-flex items-center justify-center h-14 w-14 rounded-2xl bg-primary/10 group-hover:bg-primary/15 transition-colors">
                      {feature.icon}
                    </div>
                    <Badge variant="secondary" className="text-[10px] font-semibold">
                      {feature.badge}
                    </Badge>
                  </div>
                  <CardTitle className="text-xl font-bold text-foreground">
                    {feature.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground leading-relaxed">
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </motion.section>
  );
}
