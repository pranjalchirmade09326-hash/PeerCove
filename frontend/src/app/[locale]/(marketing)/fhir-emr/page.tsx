/**
 * Auxiliary HL7 FHIR R4 Interoperability dedicated marketing page.
 *
 * Route: /[locale]/(marketing)/fhir-emr
 *
 * Server component. Fetches current session and renders FhirEmrPage explaining
 * PeerCove's optional Auxiliary Clinical Interoperability Tier (fhir-server :8000,
 * fhir-gql :8001, fhir-staging) supporting 34 HL7 FHIR R4 resources.
 */

import type { Metadata } from "next";
import { getServerSession } from "@/modules/server/auth/get-session";
import RootNavbar from "@/modules/client/(marketing)/components/RootNavbar";
import Footer from "@/modules/client/(marketing)/components/Footer";
import { FhirEmrPage } from "@/modules/client/(marketing)/pages/FhirEmrPage";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Auxiliary FHIR R4 Interoperability",
  description:
    "Optional HL7 FHIR R4 REST and middleware tier (fhir-server :8000, fhir-gql :8001) supporting 34 clinical resources with dual-format JSON and multi-tenant JWT scoping.",
  openGraph: {
    title: "Auxiliary FHIR R4 Interoperability | PeerCove",
    description:
      "34 HL7 FHIR R4 resources with dual-format application/fhir+json negotiation and tenant-scoped Ed25519 JWT isolation.",
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
    title: "Auxiliary FHIR R4 Interoperability | PeerCove",
    description:
      "Optional HL7 FHIR R4 tier supporting 34 resources alongside PeerCove's AES-256-GCM core.",
    images: ["/en/opengraph-image"],
  },
};

/** Auxiliary FHIR R4 Interoperability explanation page. */
export default async function FhirEmrRoute() {
  const session = await getServerSession();
  return (
    <>
      <RootNavbar session={session} />
      <main>
        <FhirEmrPage session={session} />
      </main>
      <Footer />
    </>
  );
}
