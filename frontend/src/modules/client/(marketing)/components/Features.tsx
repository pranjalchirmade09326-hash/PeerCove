/**
 * Features — patient-focused overview of PeerCove's care journey.
 *
 * Layer: client / (marketing) / components
 *
 * Highlights: guided chat and voice intake, appointments, and connected care.
 */

"use client";

import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  MessageCircle,
  CalendarDays,
  ClipboardList,
  Heart,
  Mic,
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
    icon: <MessageCircle className="h-8 w-8 text-primary" />,
    title: "Start with a conversation",
    badge: "Your pace",
    description:
      "Share what is on your mind through a guided chat or voice intake. Start wherever feels easiest, and take your time.",
  },
  {
    icon: <Mic className="h-8 w-8 text-primary" />,
    title: "Choose how to share",
    badge: "Chat or voice",
    description:
      "Write things down or talk them through. PeerCove gives you options for starting your care journey.",
  },
  {
    icon: <Heart className="h-8 w-8 text-primary" />,
    title: "Keep your care together",
    badge: "One space",
    description:
      "Find your appointments, health information, and care updates in your patient dashboard.",
  },
  {
    icon: <CalendarDays className="h-8 w-8 text-primary" />,
    title: "Prepare for appointments",
    badge: "Feel ready",
    description:
      "Share relevant details before your appointment so your care team has context for the conversation.",
  },
  {
    icon: <ClipboardList className="h-8 w-8 text-primary" />,
    title: "A guided next step",
    badge: "When ready",
    description:
      "After intake, continue to your patient workspace to see available care options and follow-up steps.",
  },
  {
    icon: <Heart className="h-8 w-8 text-primary" />,
    title: "Your care, connected",
    badge: "PeerCove",
    description:
      "Appointments, care conversations, and health records are brought together in one place.",
  },
];

// ── Component ──────────────────────────────────────────────────────────────

/**
 * Animated six-card feature grid.
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
            A calmer way to get started
          </span>
          <h2 className="mt-2 text-3xl sm:text-4xl font-bold text-foreground">
            Support that meets you where you are
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Start with a conversation, choose how you want to share, and find your
            next steps without having to do everything at once.
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
