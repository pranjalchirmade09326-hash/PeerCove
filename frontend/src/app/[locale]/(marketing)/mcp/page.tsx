/**
 * Read-Only FastMCP Gateway dedicated marketing page.
 *
 * Route: /[locale]/(marketing)/mcp
 *
 * Server component. Fetches current session and renders McpPage explaining
 * PeerCove's auxiliary FastMCP gateway (fhir-mcp :8002/mcp) exposing strictly
 * read-only (GET) tools across 16 HL7 FHIR R4 resource groups with JWKS JWT forwarding.
 */

import type { Metadata } from "next";
import { getServerSession } from "@/modules/server/auth/get-session";
import RootNavbar from "@/modules/client/(marketing)/components/RootNavbar";
import Footer from "@/modules/client/(marketing)/components/Footer";
import { McpPage } from "@/modules/client/(marketing)/pages/McpPage";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "FastMCP Gateway",
  description:
    "Strictly read-only (GET) Model Context Protocol gateway (:8002/mcp) generated via FastMCP.from_openapi() across 16 HL7 FHIR R4 resource groups with JWKS JWT forwarding.",
  openGraph: {
    title: "FastMCP Gateway | PeerCove",
    description:
      "Read-only streamable-HTTP FastMCP gateway exposing 16 HL7 FHIR R4 resource groups with zero write mutations.",
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
    title: "FastMCP Gateway | PeerCove",
    description:
      "Strictly read-only FastMCP gateway across 16 FHIR R4 resource groups on :8002/mcp.",
    images: ["/en/opengraph-image"],
  },
};

/** Read-Only FastMCP Gateway explanation page. */
export default async function McpRoute() {
  const session = await getServerSession();
  return (
    <>
      <RootNavbar session={session} />
      <main>
        <McpPage session={session} />
      </main>
      <Footer />
    </>
  );
}
