/**
 * HIPAA & Privacy Architecture dedicated marketing page.
 *
 * Route: /[locale]/(marketing)/hipaa
 *
 * Server component. Fetches current session and renders HipaaPage explaining
 * PeerCove's AES-256-GCM envelope encryption, KMS key rotation, zero-knowledge
 * admin isolation, 5-role Ed25519 JWKS RBAC, immutable AuditEvent logs, and
 * explicit transcript-only consent controls.
 */

import type { Metadata } from "next";
import { getServerSession } from "@/modules/server/auth/get-session";
import RootNavbar from "@/modules/client/(marketing)/components/RootNavbar";
import Footer from "@/modules/client/(marketing)/components/Footer";
import { HipaaPage } from "@/modules/client/(marketing)/pages/HipaaPage";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "HIPAA & Privacy Architecture",
  description:
    "AES-256-GCM envelope encryption, live KMS key rotation, zero-knowledge admin isolation, 5-role Ed25519 JWKS RBAC, explicit consent gates, and immutable AuditEvent trails in PeerCove.",
  openGraph: {
    title: "HIPAA & Privacy Architecture | PeerCove",
    description:
      "How PeerCove protects member reflections, encrypted journals, and optional clinical FHIR interoperability.",
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
    title: "HIPAA & Privacy Architecture | PeerCove",
    description:
      "AES-256-GCM encryption, KMS key rotation, zero-knowledge admin isolation, and immutable AuditEvent trails in PeerCove.",
    images: ["/en/opengraph-image"],
  },
};

/** HIPAA & Privacy Architecture explanation page. */
export default async function HipaaRoute() {
  const session = await getServerSession();
  return (
    <>
      <RootNavbar session={session} />
      <main>
        <HipaaPage session={session} />
      </main>
      <Footer />
    </>
  );
}
