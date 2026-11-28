/**
 * Marketing landing page for PeerCove.
 *
 * Route: /[locale]/(marketing)
 *
 * Server component. Fetches the current session to control CTA button
 * variants (Sign Up vs. Open Dashboard). Composes the full public-facing
 * landing page:
 *
 *   RootNavbar        — PeerCove member-centered navigation and account actions
 *   Hero              — welcoming stepped-care wellness introduction and intake preview
 *   Features          — six core PeerCove pillars across grounding, voice, peer rooms & safety
 *   DemoAccessSection — instant demo access across all 5 PeerCove RBAC roles
 *   HowItWorks        — four-step stepped-care member journey
 *   Testimonials      — authentic member expectations, Crisis Sentinel & emergency helplines
 *   Cta               — sanctuary sign-up and workflow call to action
 *   Footer            — platform, workspace, and trust links
 */

import type { Metadata } from "next";
import { getServerSession } from "@/modules/server/auth/get-session";
import RootNavbar from "@/modules/client/(marketing)/components/RootNavbar";
import Hero from "@/modules/client/(marketing)/components/Hero";
import Features from "@/modules/client/(marketing)/components/Features";
import HowItWorks from "@/modules/client/(marketing)/components/HowItWorks";
import Testimonials from "@/modules/client/(marketing)/components/Testimonials";
import Cta from "@/modules/client/(marketing)/components/Cta";
import DemoAccessSection from "@/modules/client/(marketing)/components/DemoAccessSection";
import Footer from "@/modules/client/(marketing)/components/Footer";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: {
    absolute: "PeerCove — Stepped-Care Peer Mental Wellness & Guided Support",
  },
  description:
    "A calm harbor for stepped-care mental wellness: AI Wellbeing Companion, consent-gated text & LiveKit voice intake, trained Peer Listener rooms, encrypted journaling, and <2ms Crisis Sentinel.",
  openGraph: {
    title: "PeerCove — Stepped-Care Peer Mental Wellness & Guided Support",
    description:
      "AI Wellbeing Companion, guided chat & LiveKit voice intake, trained Peer Listener rooms, AES-256-GCM encrypted journaling, and <2ms Crisis Sentinel.",
    siteName: "PeerCove",
    type: "website",
    images: [
      {
        url: "/en/opengraph-image",
        width: 1200,
        height: 630,
        alt: "PeerCove — Stepped-Care Peer Mental Wellness & Guided Support",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "PeerCove — Stepped-Care Peer Mental Wellness & Guided Support",
    description:
      "AI Wellbeing Companion, guided chat & LiveKit voice intake, trained Peer Listener rooms, and <2ms Crisis Sentinel.",
    images: ["/en/opengraph-image"],
  },
};

/** Marketing landing page. */
export default async function Home() {
  const session = await getServerSession();

  return (
    <>
      <RootNavbar session={session} />
      <main>
        <Hero session={session} />
        <Features />
        <DemoAccessSection />
        <HowItWorks />
        <Testimonials />
        <Cta session={session} />
      </main>
      <Footer />
    </>
  );
}
