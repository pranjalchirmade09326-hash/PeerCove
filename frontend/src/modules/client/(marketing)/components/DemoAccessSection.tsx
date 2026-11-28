/**
 * DemoAccessSection — showcases all 5 PeerCove RBAC workspaces with instant demo access.
 *
 * Layer: client / (marketing) / components
 */

"use client";

import React from "react";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Sparkles,
  ArrowRight,
  Globe,
  HeartHandshake,
  Headphones,
  ClipboardCheck,
  ShieldAlert,
  Shield,
  CheckCircle2,
} from "lucide-react";
import { motion } from "framer-motion";

const demoRoles = [
  {
    title: "Member",
    route: "/peercove/member",
    description:
      "Personal sanctuary with AI Wellbeing Companion, guided chat & voice intake, mood pulse, AES-256-GCM journal, goals, and peer listening rooms.",
    icon: HeartHandshake,
  },
  {
    title: "Peer Listener",
    route: "/peercove/listener",
    description:
      "Active support offer queue, LiveKit/WebRTC listening rooms, 4-7-8 breathwork pacer, encrypted SOAP debrief notes, and 60s decompression cooldown.",
    icon: Headphones,
  },
  {
    title: "Listener Supervisor",
    route: "/peercove/listener-supervisor",
    description:
      "Pod roster eligibility management, conduct & boundary audits, and training signoffs (PC-AL-101, PC-BE-201, PC-SS-202, PC-SC-301).",
    icon: ClipboardCheck,
  },
  {
    title: "Safety Operations",
    route: "/peercove/safety-operations",
    description:
      "Assigned Crisis Sentinel escalation queue, redacted safety case actions, verified helplines (14416, 988, 112), and human follow-ups.",
    icon: ShieldAlert,
  },
  {
    title: "Platform Administrator",
    route: "/peercove/platform-administrator",
    description:
      "Zero-knowledge system health, 5-role Ed25519 RBAC reviews, KMS key rotation, P01–P09 workflow registry, and immutable audit logs.",
    icon: Shield,
  },
] as const;

export default function DemoAccessSection() {
  return (
    <section
      id="demo-access"
      className="relative isolate overflow-hidden bg-background py-20 sm:py-28"
    >
      {/* Background decoration */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute left-1/2 top-0 h-96 w-96 -translate-x-1/2 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute bottom-0 left-1/4 h-72 w-72 rounded-full bg-accent/20 blur-3xl" />
      </div>

      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="mb-16 text-center"
        >
          <Badge className="mb-4 gap-2 rounded-full border border-primary/20 bg-primary/10 px-4 py-2 text-sm font-medium text-primary hover:bg-primary/15">
            <Sparkles className="size-4" />
            Instant 5-Role Demo Access
          </Badge>

          <h2 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
            Explore every PeerCove workspace in seconds
          </h2>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
            No setup required. Sign in with pre-configured demo accounts across
            all five stepped-care RBAC roles — from Member Sanctuary to
            Zero-Knowledge Platform Administration.
          </p>
        </motion.div>

        {/* Demo Cards Grid */}
        <div className="mb-10 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {demoRoles.map((role, index) => {
            const Icon = role.icon;
            return (
              <motion.div
                key={role.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.08 }}
                viewport={{ once: true }}
              >
                <Card className="h-full border border-border bg-card transition-colors hover:border-primary/40">
                  <CardHeader className="pb-3">
                    <div className="mb-3 flex items-center justify-between gap-2">
                      <div className="flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                        <Icon className="size-5" />
                      </div>
                      <Badge
                        variant="outline"
                        className="border-border font-mono text-[10px] text-muted-foreground"
                      >
                        {role.route}
                      </Badge>
                    </div>
                    <CardTitle className="text-xl text-card-foreground">
                      {role.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-sm leading-relaxed text-muted-foreground">
                      {role.description}
                    </CardDescription>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>

        {/* Features Grid */}
        <div className="mb-12 grid grid-cols-1 gap-6 md:grid-cols-2">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="rounded-2xl border border-border bg-card p-6"
          >
            <h3 className="mb-3 flex items-center gap-2 text-lg font-semibold text-card-foreground">
              <Sparkles className="size-5 text-primary" />
              What&apos;s Included
            </h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="size-4 shrink-0 text-primary" />
                One-click sign-in across all 5 PeerCove RBAC workspaces
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="size-4 shrink-0 text-primary" />
                Pre-seeded mood pulse, journal, pod roster, and safety cases
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="size-4 shrink-0 text-primary" />
                Live AI Companion, guided text &amp; voice intake, and Crisis Sentinel
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="size-4 shrink-0 text-primary" />
                Ed25519 JWKS session isolation per role with zero setup
              </li>
            </ul>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="rounded-2xl border border-border bg-card p-6"
          >
            <h3 className="mb-3 flex items-center gap-2 text-lg font-semibold text-card-foreground">
              <Globe className="size-5 text-primary" />
              Designed For Walkthroughs
            </h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="size-4 shrink-0 text-primary" />
                End-to-end stepped-care escalation from Member to Safety Ops
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="size-4 shrink-0 text-primary" />
                Supervisor pod QA &amp; PC-* module signoff verification
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="size-4 shrink-0 text-primary" />
                Zero-knowledge admin KMS rotation &amp; audit trail inspection
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="size-4 shrink-0 text-primary" />
                Multilingual support across English, Hindi, and Tamil locales
              </li>
            </ul>
          </motion.div>
        </div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="flex flex-col items-center justify-center gap-4 sm:flex-row"
        >
          <Link href="/demo-login">
            <Button
              size="lg"
              className="rounded-full bg-primary px-8 text-primary-foreground hover:bg-primary/90"
            >
              <Globe className="mr-2 size-4" />
              Try Demo Accounts
              <ArrowRight className="ml-2 size-4" />
            </Button>
          </Link>

          <Link href="/signup">
            <Button
              size="lg"
              variant="outline"
              className="rounded-full border-border px-8"
            >
              Create Account
              <ArrowRight className="ml-2 size-4" />
            </Button>
          </Link>
        </motion.div>

        {/* Info Note */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          viewport={{ once: true }}
          className="mt-12 rounded-xl border border-primary/20 bg-muted/60 p-4 text-center"
        >
          <p className="text-sm text-muted-foreground">
            <strong className="text-foreground">Note:</strong> Demo accounts let
            you test every PeerCove role immediately. Private journal and safety
            notes remain separated from Platform Administrator views by design.
          </p>
        </motion.div>
      </div>
    </section>
  );
}
