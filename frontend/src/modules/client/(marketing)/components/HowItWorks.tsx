/**
 * HowItWorks — animated timeline introducing the PeerCove member stepped-care journey.
 *
 * Layer: client / (marketing) / components
 *
 * Shows the path from entering the Member Sanctuary through guided intake and
 * Crisis Sentinel guardrails to Peer Listener LiveKit rooms and ongoing wellbeing tracking.
 */

"use client";

import { motion } from "framer-motion";
import {
  CheckCircle2,
  UserCheck,
  Mic,
  Headphones,
  ShieldCheck,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

// ── Animation variants ──────────────────────────────────────────────────────

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.2 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6 } },
};

// ── Workflow steps ──────────────────────────────────────────────────────────

const steps = [
  {
    number: "01",
    icon: <UserCheck className="w-6 h-6 text-primary" />,
    title: "Enter your Member Sanctuary",
    badge: "Consent-first",
    description:
      "Sign up or try a demo role. Start in a private space with somatic grounding exercises (4-7-8 breathing, 5-4-3-2-1 sensory grounding, Box Breathing, PMR).",
  },
  {
    number: "02",
    icon: <Mic className="w-6 h-6 text-primary" />,
    title: "Guided text or voice intake with <2ms Safety Sentinel",
    badge: "Transcript-only",
    description:
      "Share at your own pace via SSE text chat or LiveKit/WebSocket voice intake. Our deterministic Safety Sentinel checks every turn in under 2ms before inference.",
  },
  {
    number: "03",
    icon: <Headphones className="w-6 h-6 text-primary" />,
    title: "Match with a trained Peer Listener",
    badge: "WebRTC / LiveKit",
    description:
      "Connect 1-on-1 in an encrypted listening room with supervisor-verified peers, an in-call 4-7-8 breathwork pacer, and structured SOAP reflection.",
  },
  {
    number: "04",
    icon: <ShieldCheck className="w-6 h-6 text-primary" />,
    title: "Track mood, encrypted journal & stepped care",
    badge: "AES-256-GCM",
    description:
      "Continue with daily mood pulse check-ins, an AES-256-GCM encrypted journal, wellbeing goals, and human Safety Operations handoffs whenever needed.",
  },
];

// ── Component ──────────────────────────────────────────────────────────────

/**
 * Animated alternating-side timeline showing how members move through PeerCove.
 */
export default function HowItWorks() {
  return (
    <motion.section
      id="how-it-works"
      className="py-20 sm:py-28 bg-background overflow-hidden relative"
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.15 }}
      variants={containerVariants}
    >
      <div className="absolute top-0 right-0 w-1/3 h-full bg-gradient-to-l from-secondary/20 to-transparent pointer-events-none" />

      <div className="max-w-[110rem] mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <motion.div variants={itemVariants} className="text-center max-w-3xl mx-auto">
          <span className="text-primary font-semibold tracking-wider uppercase text-sm">
            Stepped-care flow
          </span>
          <h2 className="mt-2 text-3xl sm:text-4xl font-bold text-foreground">
            Four calm steps, at your own pace
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Begin with self-guided grounding, escalate smoothly to a trained Peer
            Listener room, and stay protected by deterministic safety guardrails.
          </p>
        </motion.div>

        <div className="relative mt-20">
          {/* Vertical line */}
          <motion.div
            className="absolute left-8 top-0 bottom-0 w-0.5 bg-border rounded-full lg:left-1/2 lg:-translate-x-1/2"
            style={{ originY: 0 }}
            initial={{ scaleY: 0 }}
            whileInView={{ scaleY: 1 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 1.2, ease: "easeOut" }}
          >
            <div className="absolute top-0 bottom-0 w-full bg-gradient-to-b from-primary/50 via-primary to-primary/50 opacity-50" />
          </motion.div>

          <motion.div
            className="relative flex flex-col items-start gap-y-12"
            variants={containerVariants}
          >
            {steps.map((step, index) => {
              const isEven = index % 2 === 0;
              return (
                <motion.div
                  key={index}
                  variants={itemVariants}
                  className={`w-full flex items-start gap-6 lg:w-1/2 ${
                    isEven
                      ? "lg:self-start lg:pr-12"
                      : "lg:self-end lg:flex-row-reverse lg:pl-12"
                  }`}
                >
                  {/* Step circle */}
                  <motion.div
                    className="relative z-10 flex-shrink-0"
                    initial={{ scale: 0 }}
                    whileInView={{ scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ type: "spring", stiffness: 300, damping: 20 }}
                  >
                    <div className="w-16 h-16 bg-background border-4 border-primary/20 rounded-full flex items-center justify-center shadow-lg shadow-primary/10 relative overflow-hidden group">
                      <div className="absolute inset-0 bg-primary/5 group-hover:bg-primary/10 transition-colors" />
                      <span className="text-xl font-bold text-primary relative z-10">
                        {step.number}
                      </span>
                    </div>
                  </motion.div>

                  {/* Step content */}
                  <div className={`pt-2 ${!isEven ? "lg:text-right" : ""}`}>
                    <div
                      className={`flex items-center gap-2 mb-1 ${
                        !isEven ? "lg:flex-row-reverse" : ""
                      }`}
                    >
                      <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-primary/10 shrink-0">
                        {step.icon}
                      </span>
                      <h3 className="text-xl font-bold text-foreground">
                        {step.title}
                      </h3>
                      <CheckCircle2 className="w-5 h-5 text-primary hidden lg:block shrink-0" />
                    </div>
                    <Badge variant="secondary" className="text-[10px] font-semibold mb-2">
                      {step.badge}
                    </Badge>
                    <p className="mt-1 text-muted-foreground leading-relaxed">
                      {step.description}
                    </p>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      </div>
    </motion.section>
  );
}
