/**
 * How It Works dedicated marketing page for PeerCove.
 *
 * Route: /[locale]/(marketing)/how-it-works
 *
 * Server component. Fetches current session and renders the stepped-care
 * peer mental wellness workflow across Member Sanctuary, Peer Listener,
 * Listener Supervisor, Safety Operations, Platform Admin, and Auxiliary Interop.
 */

import type { Metadata } from "next";
import { getServerSession } from "@/modules/server/auth/get-session";
import RootNavbar from "@/modules/client/(marketing)/components/RootNavbar";
import Footer from "@/modules/client/(marketing)/components/Footer";
import { HowItWorksPage } from "@/modules/client/(marketing)/pages/HowItWorksPage";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "How It Works",
  description:
    "How PeerCove connects consent-gated text and voice intake, <2ms Crisis Sentinel guardrails, trained Peer Listener LiveKit rooms, supervisor pods, and encrypted wellbeing tracking.",
  openGraph: {
    title: "How It Works | PeerCove",
    description:
      "Step-by-step PeerCove stepped-care workflow across Member Sanctuary, Peer Listening, Supervision (PC-*), Safety Operations, and Zero-Knowledge Administration.",
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
    title: "How It Works | PeerCove",
    description:
      "Explore PeerCove's stepped-care peer mental wellness workflow from guided intake to LiveKit listening rooms.",
    images: ["/en/opengraph-image"],
  },
};

/** Full stepped-care peer wellness workflow explanation page. */
export default async function HowItWorksRoute() {
  const session = await getServerSession();
  return (
    <>
      <RootNavbar session={session} />
      <main>
        <HowItWorksPage session={session} />
      </main>
      <Footer />
    </>
  );
}
