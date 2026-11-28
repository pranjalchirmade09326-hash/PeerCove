"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { OAuthPkceButton } from "@/modules/client/auth/components/OAuthPkceButton";
import type { AuthResponse } from "@/modules/server/auth/types";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Heart,
  MessageCircle,
  Mic,
  ShieldCheck,
  Users,
} from "lucide-react";

export default function Hero({ session }: { session: AuthResponse | null }) {
  const dashboardHref =
    (session?.session.activeRoleRedirectUrl ?? "/peercove/member").replace(
      /^\/(?:en|hi|ta)/,
      "",
    ) || "/peercove/member";

  return (
    <section className="relative isolate overflow-hidden bg-background pb-20 pt-28 sm:pt-36 lg:pb-28">
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute -left-32 top-12 size-[28rem] rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute -right-32 top-24 size-[32rem] rounded-full bg-accent/30 blur-3xl" />
      </div>

      <div className="mx-auto grid max-w-7xl items-center gap-14 px-5 sm:px-8 lg:grid-cols-[1.05fr_0.95fr] lg:gap-20">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mx-auto max-w-2xl text-center lg:mx-0 lg:text-left"
        >
          <Badge className="mb-6 gap-2 rounded-full border border-primary/20 bg-card/80 px-4 py-2 text-sm font-medium text-foreground shadow-none hover:bg-card">
            <Heart className="size-4 fill-primary/15 text-primary" />
            Stepped-care peer mental wellness, at your pace
          </Badge>

          <h1 className="text-4xl font-semibold leading-[1.08] tracking-tight text-foreground sm:text-5xl lg:text-6xl">
            A calm harbor to
            <span className="block text-primary">talk things through.</span>
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-lg leading-8 text-muted-foreground lg:mx-0">
            Start with PeerCove&apos;s AI Wellbeing Companion through guided chat
            or LiveKit voice intake, match with a trained Peer Listener in a
            confidential listening room, and track mood, encrypted journaling,
            and goals in one sanctuary.
          </p>

          <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row lg:justify-start">
            {!session ? (
              <>
                <OAuthPkceButton
                  href="/signup"
                  size="lg"
                  className="h-12 rounded-full bg-primary px-7 text-base text-primary-foreground shadow-sm hover:bg-primary/90"
                >
                  Get started
                  <ArrowRight className="ml-2 size-4" />
                </OAuthPkceButton>
                <OAuthPkceButton
                  href="/login"
                  variant="outline"
                  size="lg"
                  className="h-12 rounded-full border-border bg-card/70 px-7 text-base text-foreground hover:bg-card"
                >
                  Sign in
                </OAuthPkceButton>
                <Link href="/demo-login">
                  <Button
                    variant="ghost"
                    size="lg"
                    className="h-12 rounded-full px-5 text-base text-muted-foreground hover:text-foreground"
                  >
                    Try 5-role demo
                  </Button>
                </Link>
              </>
            ) : (
              <Link href={dashboardHref as any}>
                <Button
                  size="lg"
                  className="h-12 rounded-full bg-primary px-7 text-base text-primary-foreground hover:bg-primary/90"
                >
                  Go to your sanctuary
                  <ArrowRight className="ml-2 size-4" />
                </Button>
              </Link>
            )}
          </div>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-3 text-sm text-muted-foreground lg:justify-start">
            <span className="inline-flex items-center gap-2">
              <ShieldCheck className="size-4 text-primary" />
              &lt;2ms Crisis Sentinel guardrails
            </span>
            <span className="inline-flex items-center gap-2">
              <Users className="size-4 text-primary" />
              Trained peer listening rooms
            </span>
            <span>Support, at your pace</span>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.97, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.12 }}
          className="relative mx-auto w-full max-w-lg"
        >
          <div className="absolute -left-8 top-12 size-28 rounded-full bg-primary/15 blur-2xl" />
          <div className="absolute -right-6 bottom-10 size-32 rounded-full bg-accent/25 blur-2xl" />
          <div className="relative rounded-[2rem] border border-border bg-card/95 p-5 shadow-xl shadow-primary/10 sm:p-7">
            <div className="flex items-center justify-between border-b border-border pb-5">
              <div className="flex items-center gap-3">
                <div className="flex size-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <Heart className="size-5" />
                </div>
                <div>
                  <p className="font-semibold text-card-foreground">
                    PeerCove Wellbeing Companion
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Guided intake &amp; peer matching
                  </p>
                </div>
              </div>
              <span className="size-2.5 rounded-full bg-primary ring-4 ring-primary/20" />
            </div>

            <div className="space-y-4 py-6">
              <div className="max-w-[85%] rounded-2xl rounded-tl-sm bg-muted p-4 text-sm leading-6 text-foreground">
                Welcome to your sanctuary. Would you like a 4-7-8 grounding
                exercise, guided intake, or a confidential Peer Listener room?
              </div>
              <div className="ml-auto max-w-[78%] rounded-2xl rounded-tr-sm bg-primary p-4 text-sm leading-6 text-primary-foreground">
                I&apos;m feeling overwhelmed and would like to talk with someone.
              </div>
              <div className="flex items-center gap-2 px-1 text-xs text-muted-foreground">
                <span className="flex gap-1">
                  <span className="size-1.5 animate-pulse rounded-full bg-primary" />
                  <span className="size-1.5 animate-pulse rounded-full bg-primary [animation-delay:120ms]" />
                  <span className="size-1.5 animate-pulse rounded-full bg-primary [animation-delay:240ms]" />
                </span>
                Take a breath — matching you with an active Peer Listener.
              </div>
            </div>

            <div className="grid gap-3 border-t border-border pt-5 sm:grid-cols-2">
              <div className="flex items-center gap-3 rounded-2xl border border-primary/25 bg-primary/10 p-4">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-card text-primary shadow-sm">
                  <MessageCircle className="size-5" />
                </span>
                <span>
                  <span className="block font-medium text-card-foreground">
                    Guided text intake
                  </span>
                  <span className="text-xs text-muted-foreground">
                    Write at your own pace
                  </span>
                </span>
              </div>
              <div className="flex items-center gap-3 rounded-2xl border border-border bg-background p-4">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-secondary text-primary">
                  <Mic className="size-5" />
                </span>
                <span>
                  <span className="block font-medium text-card-foreground">
                    Talk it through
                  </span>
                  <span className="text-xs text-muted-foreground">
                    Live voice &amp; peer rooms
                  </span>
                </span>
              </div>
            </div>
            <p className="mt-4 text-center text-xs leading-5 text-muted-foreground">
              Consent-first transcripts only. Deterministic Crisis Sentinel active
              before every response.
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
