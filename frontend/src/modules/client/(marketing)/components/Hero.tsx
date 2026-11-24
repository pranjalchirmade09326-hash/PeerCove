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
} from "lucide-react";

export default function Hero({ session }: { session: AuthResponse | null }) {
  return (
    <section className="relative isolate overflow-hidden bg-[#f7faf8] pb-20 pt-28 sm:pt-36 lg:pb-28">
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute -left-32 top-12 size-[28rem] rounded-full bg-emerald-100/70 blur-3xl" />
        <div className="absolute -right-32 top-24 size-[32rem] rounded-full bg-sky-100/70 blur-3xl" />
      </div>

      <div className="mx-auto grid max-w-7xl items-center gap-14 px-5 sm:px-8 lg:grid-cols-[1.05fr_0.95fr] lg:gap-20">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mx-auto max-w-2xl text-center lg:mx-0 lg:text-left"
        >
          <Badge className="mb-6 gap-2 rounded-full border border-emerald-200 bg-white/80 px-4 py-2 text-sm font-medium text-emerald-900 shadow-none hover:bg-white">
            <Heart className="size-4 fill-emerald-100 text-emerald-700" />
            You don&apos;t have to figure it out all at once
          </Badge>

          <h1 className="text-4xl font-semibold leading-[1.08] tracking-tight text-slate-950 sm:text-5xl lg:text-6xl">
            A little space to
            <span className="block text-emerald-800">talk things through.</span>
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-lg leading-8 text-slate-600 lg:mx-0">
            When you&apos;re ready, start with a guided chat or voice conversation.
            PeerCove helps you take the next step at your own pace.
          </p>

          <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row lg:justify-start">
            {!session ? (
              <>
                <OAuthPkceButton
                  href="/signup"
                  size="lg"
                  className="h-12 rounded-full bg-emerald-800 px-7 text-base text-white shadow-sm hover:bg-emerald-900"
                >
                  Get started
                  <ArrowRight className="ml-2 size-4" />
                </OAuthPkceButton>
                <OAuthPkceButton
                  href="/login"
                  variant="outline"
                  size="lg"
                  className="h-12 rounded-full border-slate-300 bg-white/70 px-7 text-base text-slate-800 hover:bg-white"
                >
                  Sign in
                </OAuthPkceButton>
              </>
            ) : (
              <Link href="/signup">
                <Button
                  size="lg"
                  className="h-12 rounded-full bg-emerald-800 px-7 text-base text-white hover:bg-emerald-900"
                >
                  Go to your care space
                  <ArrowRight className="ml-2 size-4" />
                </Button>
              </Link>
            )}
          </div>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-3 text-sm text-slate-600 lg:justify-start">
            <span className="inline-flex items-center gap-2">
              <ShieldCheck className="size-4 text-emerald-700" />
              A gentle place to begin
            </span>
            <span>Chat or voice, your choice</span>
            <span>            Support, at your pace</span>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.97, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.12 }}
          className="relative mx-auto w-full max-w-lg"
        >
          <div className="absolute -left-8 top-12 size-28 rounded-full bg-emerald-200/50 blur-2xl" />
          <div className="absolute -right-6 bottom-10 size-32 rounded-full bg-sky-200/60 blur-2xl" />
          <div className="relative rounded-[2rem] border border-white bg-white/90 p-5 shadow-[0_24px_80px_-32px_rgba(15,80,65,0.28)] sm:p-7">
            <div className="flex items-center justify-between border-b border-slate-100 pb-5">
              <div className="flex items-center gap-3">
                <div className="flex size-11 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-800">
                  <Heart className="size-5" />
                </div>
                <div>
                  <p className="font-semibold text-slate-900">PeerCove AI guide</p>
                  <p className="text-sm text-slate-500">A guided way to get started</p>
                </div>
              </div>
              <span className="size-2.5 rounded-full bg-emerald-500 ring-4 ring-emerald-100" />
            </div>

            <div className="space-y-4 py-6">
              <div className="max-w-[85%] rounded-2xl rounded-tl-sm bg-[#f0f7f4] p-4 text-sm leading-6 text-slate-700">
                Hi, welcome. What&apos;s been on your mind lately?
              </div>
              <div className="ml-auto max-w-[78%] rounded-2xl rounded-tr-sm bg-emerald-800 p-4 text-sm leading-6 text-white">
                I&apos;m not sure where to start.
              </div>
              <div className="flex items-center gap-2 px-1 text-xs text-slate-500">
                <span className="flex gap-1">
                  <span className="size-1.5 animate-pulse rounded-full bg-emerald-500" />
                  <span className="size-1.5 animate-pulse rounded-full bg-emerald-500 [animation-delay:120ms]" />
                  <span className="size-1.5 animate-pulse rounded-full bg-emerald-500 [animation-delay:240ms]" />
                </span>
                That&apos;s okay. We can take it one step at a time.
              </div>
            </div>

            <div className="grid gap-3 border-t border-slate-100 pt-5 sm:grid-cols-2">
              <div className="flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50/70 p-4">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-white text-emerald-800 shadow-sm">
                  <MessageCircle className="size-5" />
                </span>
                <span>
                  <span className="block font-medium text-slate-900">
                    Chat when you&apos;re ready
                  </span>
                  <span className="text-xs text-slate-500">Write when ready</span>
                </span>
              </div>
              <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-sky-50 text-sky-800">
                  <Mic className="size-5" />
                </span>
                <span>
                  <span className="block font-medium text-slate-900">
                    Talk it through
                  </span>
                  <span className="text-xs text-slate-500">Talk it through</span>
                </span>
              </div>
            </div>
            <p className="mt-4 text-center text-xs leading-5 text-slate-500">
              Choose what feels comfortable. You can continue at your own pace.
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
