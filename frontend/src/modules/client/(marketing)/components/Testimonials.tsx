/**
 * Testimonials — member-centered reassurance & safety boundary section for the landing page.
 *
 * Layer: client / (marketing) / components
 *
 * Surfaces authentic PeerCove expectations alongside the deterministic <2ms Crisis Sentinel
 * boundary and verified emergency helplines (Tele-MANAS 14416, 988, 112).
 */

"use client";

import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import {
  MessageCircle,
  Mic,
  HandHeart,
  ShieldAlert,
} from "lucide-react";

// ── Animation variants ──────────────────────────────────────────────────────

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

// ── Member support pillars ──────────────────────────────────────────────────

const supportOptions = [
  {
    icon: <MessageCircle className="w-7 h-7 text-primary" />,
    title: "Guided reflections & grounding",
    description:
      "Start with the AI Wellbeing Companion for 4-7-8 breathing, 5-4-3-2-1 sensory grounding, or structured text intake in English, Hindi, or Hinglish.",
  },
  {
    icon: <Mic className="w-7 h-7 text-primary" />,
    title: "Speak naturally, keep transcripts private",
    description:
      "Use LiveKit voice intake when talking feels easier than typing. PeerCove stores AES-256-GCM encrypted transcript text — never raw audio recordings.",
  },
  {
    icon: <HandHeart className="w-7 h-7 text-primary" />,
    title: "Non-clinical human peer support",
    description:
      "Connect with trained, supervisor-verified Peer Listeners in confidential listening rooms without medical jargon, diagnoses, or judgment.",
  },
];

// ── Component ──────────────────────────────────────────────────────────────

/**
 * Member-centered section outlining authentic expectations and Crisis Sentinel boundaries.
 */
export default function Testimonials() {
  return (
    <section id="support" className="py-20 sm:py-28 bg-secondary/30">
      <div className="max-w-[110rem] mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center max-w-3xl mx-auto mb-16"
        >
          <span className="text-primary font-semibold tracking-wider uppercase text-sm">
            Your sanctuary, your pace
          </span>
          <h2 className="mt-2 text-3xl sm:text-4xl font-bold text-foreground">
            Honest peer support with clear safety boundaries
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            PeerCove combines private self-help tools, trained peer listeners,
            and deterministic safety guardrails so you always know what to expect.
          </p>
        </motion.div>

        <motion.div
          className="grid gap-6 md:grid-cols-3"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
        >
          {supportOptions.map((option, i) => (
            <motion.div key={i} variants={itemVariants}>
              <Card className="h-full rounded-3xl border border-border bg-card shadow-sm transition-shadow hover:shadow-md">
                <CardContent className="space-y-4 p-7">
                  <div className="flex size-14 items-center justify-center rounded-2xl bg-primary/10">
                    {option.icon}
                  </div>
                  <h3 className="text-lg font-bold text-card-foreground">
                    {option.title}
                  </h3>
                  <p className="text-sm leading-6 text-muted-foreground">
                    {option.description}
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.3, duration: 0.7 }}
          className="mx-auto mt-10 flex max-w-3xl items-start gap-4 rounded-3xl border border-primary/20 bg-card p-6 text-sm leading-6 text-muted-foreground shadow-sm"
        >
          <ShieldAlert className="mt-1 size-5 shrink-0 text-primary" />
          <div className="space-y-2">
            <p>
              <strong className="text-foreground">
                Non-Clinical Boundary &amp; Crisis Sentinel:
              </strong>{" "}
              PeerCove provides AI-guided wellbeing tools and trained peer
              listening — it is not a crisis service and does not diagnose,
              prescribe, or replace licensed clinical or emergency medical care.
            </p>
            <p>
              Every message passes through our deterministic{" "}
              <strong className="text-foreground">&lt;2ms Crisis Sentinel</strong>{" "}
              before AI inference. If acute distress is detected, PeerCove
              immediately surfaces human Safety Operations handoffs and verified
              helplines:{" "}
              <strong className="text-foreground">Tele-MANAS 14416</strong>{" "}
              (+91 9999 666 555),{" "}
              <strong className="text-foreground">988</strong> (US Lifeline), and{" "}
              <strong className="text-foreground">112</strong> (Emergency).
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
