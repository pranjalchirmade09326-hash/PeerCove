/**
 * AI Wellbeing Agents dedicated marketing page.
 *
 * Route: /[locale]/(marketing)/ai-agents
 *
 * Server component. Fetches current session and renders AiAgentsPage
 * explaining PeerCove's live Engine 2 (:8018) LangGraph agents and voice service:
 * Safety Sentinel (<2ms), Guided Text Intake & Wellbeing Companion,
 * Live Voice Intake & Companion (Sarvam + Gemini), and Peer Listener Matcher.
 */

import type { Metadata } from "next";
import { getServerSession } from "@/modules/server/auth/get-session";
import RootNavbar from "@/modules/client/(marketing)/components/RootNavbar";
import Footer from "@/modules/client/(marketing)/components/Footer";
import { AiAgentsPage } from "@/modules/client/(marketing)/pages/AiAgentsPage";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "AI Wellbeing Agents",
  description:
    "Explore PeerCove's live Engine 2 LangGraph agents: <2ms deterministic Safety Sentinel, Guided Text Intake & Wellbeing Companion, Live Voice Intake (Sarvam + Gemini), and Peer Matcher.",
  openGraph: {
    title: "AI Wellbeing Agents | PeerCove",
    description:
      "Live LangGraph & Sarvam/Gemini voice wellbeing agents with zero direct DB access and <2ms pre-inference Safety Sentinel.",
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
    title: "AI Wellbeing Agents | PeerCove",
    description:
      "Live Safety Sentinel, Guided Text & Voice Intake, Wellbeing Companion, and Peer Matcher in PeerCove.",
    images: ["/en/opengraph-image"],
  },
};

/** AI Wellbeing Agents explanation page. */
export default async function AiAgentsRoute() {
  const session = await getServerSession();
  return (
    <>
      <RootNavbar session={session} />
      <main>
        <AiAgentsPage session={session} />
      </main>
      <Footer />
    </>
  );
}
