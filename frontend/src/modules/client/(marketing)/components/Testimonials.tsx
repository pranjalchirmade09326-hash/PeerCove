/**
 * Testimonials — patient-centered reassurance section for the landing page.
 *
 * Layer: client / (marketing) / components
 *
 * Describes what patients can expect without implying unsupported services.
 */

"use client";

import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import {
  Heart,
  MessageCircle,
  Mic,
  HandHeart,
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

// ── Compliance pillars ──────────────────────────────────────────────────────

const supportOptions = [
  {
    icon: <MessageCircle className="w-7 h-7 text-emerald-600" />,
    title: "Put it into words",
    description: "Use a guided chat to share what has been on your mind.",
  },
  {
    icon: <Mic className="w-7 h-7 text-sky-600" />,
    title: "Talk it through",
    description: "Choose voice intake if speaking feels more natural.",
  },
  {
    icon: <HandHeart className="w-7 h-7 text-violet-600" />,
    title: "Take one next step",
    description: "Continue to your care workspace when you are ready.",
  },
];

// ── Component ──────────────────────────────────────────────────────────────

/**
 * Patient-centered section outlining available ways to get started.
 */
export default function Testimonials() {
  return (
    <section id="support" className="py-20 sm:py-28 bg-[#f7faf8]">
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
            Your space, your pace
          </span>
          <h2 className="mt-2 text-3xl sm:text-4xl font-bold text-foreground">
            Start in the way that feels right for you
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            A first step can be as simple as putting your thoughts into words.
            Choose chat or voice, and continue when you feel ready.
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
              <Card className="h-full rounded-3xl border-emerald-900/5 bg-white shadow-sm transition-shadow hover:shadow-md">
                <CardContent className="space-y-4 p-7">
                  <div className="flex size-14 items-center justify-center rounded-2xl bg-emerald-50">
                    {option.icon}
                  </div>
                  <h3 className="text-lg font-bold text-foreground">{option.title}</h3>
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
          className="mx-auto mt-10 flex max-w-3xl items-start gap-4 rounded-3xl border border-emerald-900/10 bg-white/80 p-6 text-sm leading-6 text-slate-600"
        >
          <Heart className="mt-1 size-5 shrink-0 text-emerald-700" />
          <p>
            PeerCove offers guided intake and care coordination; it is not a
            crisis service or a replacement for professional medical care. If
            you may be in immediate danger, contact your local emergency service.
          </p>
        </motion.div>
      </div>
    </section>
  );
}
