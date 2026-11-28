/**
 * McpPage — dedicated marketing page explaining PeerCove's Auxiliary Read-Only FastMCP Gateway.
 *
 * Layer: client / (marketing) / pages
 *
 * Accurately documents backend/fhir-mcp (:8002, /mcp streamable-http):
 * dynamically generated from fhir-server:8000/openapi.json via FastMCP.from_openapi(),
 * strictly restricted to read-only (GET) tools across 16 FHIR resource groups
 * (all POST/PATCH/DELETE excluded via MCPType.EXCLUDE), with JWKS AuthForwardingMiddleware.
 * Generic across MCP clients — no specific third-party AI products named.
 */

"use client";

import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "@/i18n/navigation";
import { OAuthPkceButton } from "@/modules/client/auth/components/OAuthPkceButton";
import {
  Server,
  Terminal,
  Database,
  ShieldCheck,
  Zap,
  ArrowRight,
  CheckCircle2,
  Plug,
  Code2,
  Lock,
} from "lucide-react";
import type { AuthResponse } from "@/modules/server/auth/types";

// ── Read-only MCP tool groups (16 FHIR resource groups from openapi.json) ───

const mcpToolGroups = [
  {
    name: "GET · Patients & Practitioners",
    description:
      "Read-only OpenAPI GET tools for Patients, Practitioners, and PractitionerRoles.",
    returns: "FHIR R4 Patient / Practitioner / PractitionerRole bundles",
    scope: "JWKS Bearer forwarded; scoped to user_id & org_id",
  },
  {
    name: "GET · Scheduling & Organizations",
    description:
      "Inspect Organizations, Locations, HealthcareServices, Schedules, and Slots.",
    returns: "Availability and organization metadata via GET only",
    scope: "Tenant-scoped read access; zero mutations",
  },
  {
    name: "GET · Appointments & Encounters",
    description:
      "Query Appointments and Encounters generated during consented clinical handoffs.",
    returns: "Appointment[] and Encounter[] (read-only)",
    scope: "AuthForwardingMiddleware verifies IAM JWKS",
  },
  {
    name: "GET · Observations & Conditions",
    description:
      "Read structured FHIR R4 Observations and Conditions for authorized reviews.",
    returns: "Observation[] and Condition[] resources",
    scope: "All POST/PATCH/DELETE excluded via MCPType.EXCLUDE",
  },
  {
    name: "GET · Service & Medication Requests",
    description:
      "Retrieve ServiceRequests and MedicationRequests from auxiliary FHIR storage.",
    returns: "ServiceRequest[] and MedicationRequest[]",
    scope: "Strict GET-only RouteMap enforcement",
  },
  {
    name: "GET · Diagnostics & Documents",
    description:
      "Inspect DiagnosticReports and DocumentReferences over streamable-HTTP /mcp.",
    returns: "DiagnosticReport[] and DocumentReference[]",
    scope: "Read-only; 401 on missing or expired JWT",
  },
];

// ── How it works steps ────────────────────────────────────────────────────

const howItWorks = [
  {
    step: "01",
    title: "OpenAPI Schema Ingestion at Startup",
    description:
      "peercove-fhir-mcp (:8002) fetches /openapi.json from fhir-server (:8000) and builds typed tools via FastMCP.from_openapi().",
  },
  {
    step: "02",
    title: "Strict GET-Only RouteMap Filtering",
    description:
      "RouteMap(methods=[\"GET\"], mcp_type=MCPType.TOOL) exposes 16 FHIR resource groups while MCPType.EXCLUDE blocks every POST, PATCH, and DELETE route.",
  },
  {
    step: "03",
    title: "JWKS JWT Validation & Forwarding",
    description:
      "AuthForwardingMiddleware validates incoming Bearer tokens against IAM JWKS (decode_token), rejecting missing or expired tokens with 401.",
  },
  {
    step: "04",
    title: "Streamable-HTTP Execution at /mcp",
    description:
      "Authorized MCP clients call GET tools over streamable-HTTP (/mcp), forwarding the caller's token via ContextVar and BearerAuth to fhir-server.",
  },
  {
    step: "05",
    title: "Isolated From Core Peer Sanctuary",
    description:
      "Private member journals, mood notes, and peer listening chats remain encrypted inside Engine 3 (peercove-fastapi) and are never exposed as MCP tools.",
  },
];

// ── Use cases ──────────────────────────────────────────────────────────────

const useCases = [
  {
    icon: <ShieldCheck className="w-5 h-5 text-primary" />,
    title: "Auditable Read-Only Clinical Context",
    description:
      "Authorized clinical systems inspect auxiliary FHIR R4 resources over MCP with zero risk of unapproved writes or record tampering.",
  },
  {
    icon: <Database className="w-5 h-5 text-primary" />,
    title: "Zero-Drift OpenAPI Tool Generation",
    description:
      "FastMCP.from_openapi() keeps MCP tool schemas synchronized with fhir-server's OpenAPI specification automatically.",
  },
  {
    icon: <Code2 className="w-5 h-5 text-primary" />,
    title: "Standards-Based Streamable-HTTP",
    description:
      "Connect any MCP-compatible client to :8002/mcp using standard Bearer JWTs issued by peercove-iam-py.",
  },
  {
    icon: <Plug className="w-5 h-5 text-primary" />,
    title: "Multi-Tenant Security Boundary",
    description:
      "Token forwarding preserves the caller's user_id and org_id permissions all the way down to fhir-server.",
  },
];

// ── Terminal log lines ─────────────────────────────────────────────────────

const terminalLines = [
  { label: "[INIT] ", text: "peercove-fhir-mcp started on :8002 (streamable-http /mcp)" },
  { label: "[SPEC] ", text: "FastMCP.from_openapi() loaded fhir-server:8000/openapi.json" },
  { label: "[RULE] ", text: "RouteMap applied: GET-only across 16 groups (mutations EXCLUDED)" },
  { label: "[AUTH] ", text: "AuthForwardingMiddleware verified Ed25519 JWT via IAM JWKS" },
  { label: "[TOOL] ", text: "GET /api/fhir/v1/patients/PAT-00241 -> 200 OK" },
  { label: "[TOOL] ", text: "GET /api/fhir/v1/observations?patient=PAT-00241 -> 3 records" },
  { label: "[TOOL] ", text: "GET /api/fhir/v1/encounters?patient=PAT-00241 -> 1 record" },
  { label: "[SAFE] ", text: "Write/mutation requests blocked by MCPType.EXCLUDE (read-only)" },
];

// ── Animation ──────────────────────────────────────────────────────────────

const fade = {
  hidden: { opacity: 0, y: 20 },
  visible: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.07, duration: 0.5 },
  }),
};

// ── Component ──────────────────────────────────────────────────────────────

/**
 * FastMCP Gateway dedicated marketing page — strictly read-only (GET) auxiliary tier.
 *
 * @param session - Active auth session for CTA variant.
 */
export function McpPage({ session }: { session: AuthResponse | null }) {
  const dashboardHref =
    (session?.session.activeRoleRedirectUrl ?? "/peercove/member").replace(
      /^\/(?:en|hi|ta)/,
      "",
    ) || "/peercove/member";

  return (
    <div className="pt-20">
      {/* ── Hero ── */}
      <section className="py-20 sm:py-28 bg-background relative overflow-hidden">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-3xl opacity-50 pointer-events-none" />
        <div className="max-w-[110rem] mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <motion.div className="max-w-3xl" initial="hidden" animate="visible" variants={fade}>
            <div className="flex items-center gap-2 mb-4">
              <Badge variant="outline" className="border-primary/30 text-primary text-xs">
                Auxiliary FastMCP Gateway (:8002/mcp)
              </Badge>
              <Badge variant="secondary" className="text-xs">
                Read-Only (GET) · 16 Resource Groups
              </Badge>
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-foreground tracking-tight leading-[1.08] mb-6">
              Read-Only FastMCP Gateway for Auxiliary FHIR R4 Data
            </h1>
            <p className="text-lg sm:text-xl text-muted-foreground leading-relaxed mb-8">
              PeerCove&apos;s auxiliary Model Context Protocol (MCP) service (
              <span className="font-mono">fhir-mcp</span>) exposes 16 HL7 FHIR R4
              resource groups over streamable-HTTP
              at <span className="font-mono">:8002/mcp</span>. Generated via{" "}
              <span className="font-mono">FastMCP.from_openapi()</span>, it
              enforces strictly read-only (<span className="font-mono">GET</span>)
              access and forwards validated JWKS Bearer tokens.
            </p>
            <div className="flex flex-wrap gap-3">
              {!session ? (
                <>
                  <OAuthPkceButton href="/signup" size="lg" className="rounded-full px-8">
                    Get started <ArrowRight className="ml-2 w-4 h-4" />
                  </OAuthPkceButton>
                  <Link href="/demo-login">
                    <Button variant="outline" size="lg" className="rounded-full px-7">
                      Explore 5-role demo
                    </Button>
                  </Link>
                </>
              ) : (
                <Link href={dashboardHref as any}>
                  <Button size="lg" className="rounded-full px-8">
                    Open Dashboard <ArrowRight className="ml-2 w-4 h-4" />
                  </Button>
                </Link>
              )}
              <a
                href="#tools"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-full border border-border text-sm font-medium text-foreground hover:bg-secondary transition-colors"
              >
                Browse 16 Tool Groups <ArrowRight className="w-4 h-4" />
              </a>
            </div>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.6 }}
            className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-6 p-8 rounded-2xl bg-secondary/40 border border-border/50"
          >
            {[
              { icon: <Server className="w-5 h-5 text-primary" />, value: ":8002/mcp", label: "Streamable-HTTP endpoint" },
              { icon: <Database className="w-5 h-5 text-primary" />, value: "16 Groups", label: "FHIR R4 GET resources" },
              { icon: <Lock className="w-5 h-5 text-primary" />, value: "GET Only", label: "All mutations excluded" },
              { icon: <Zap className="w-5 h-5 text-primary" />, value: "JWKS", label: "AuthForwardingMiddleware" },
            ].map((f, i) => (
              <div key={i} className="text-center">
                <div className="flex justify-center mb-2">{f.icon}</div>
                <p className="text-2xl font-bold text-foreground">{f.value}</p>
                <p className="text-sm text-muted-foreground mt-1">{f.label}</p>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── What is FastMCP in PeerCove ── */}
      <section className="py-20 sm:py-24 bg-secondary/30">
        <div className="max-w-[110rem] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7 }}
            >
              <span className="text-primary font-semibold tracking-wider uppercase text-sm">
                Read-Only Design
              </span>
              <h2 className="mt-2 text-3xl sm:text-4xl font-bold text-foreground mb-6">
                OpenAPI-Driven MCP Tools With Zero Write Surface
              </h2>
              <p className="text-muted-foreground leading-relaxed mb-6">
                Rather than hand-coding brittle tool wrappers or allowing AI
                clients to mutate records, PeerCove&apos;s{" "}
                <span className="font-mono text-xs bg-secondary px-1.5 py-0.5 rounded">
                  fhir-mcp
                </span>{" "}
                reads <span className="font-mono text-xs bg-secondary px-1.5 py-0.5 rounded">
                  fhir-server:8000/openapi.json
                </span>{" "}
                and restricts exposed operations strictly to{" "}
                <span className="font-mono text-xs bg-secondary px-1.5 py-0.5 rounded">
                  GET
                </span>{" "}
                routes.
              </p>
              <div className="space-y-3">
                {[
                  "Generated dynamically via FastMCP.from_openapi() on :8002/mcp",
                  "Strictly read-only (GET) across 16 FHIR R4 resource groups",
                  "All POST, PATCH, and DELETE operations blocked via MCPType.EXCLUDE",
                  "AuthForwardingMiddleware verifies Bearer JWTs via IAM JWKS",
                ].map((point, i) => (
                  <div key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                    <CheckCircle2 className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                    {point}
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Terminal */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7 }}
              className="bg-card border border-border rounded-2xl overflow-hidden shadow-xl"
            >
              <div className="flex items-center justify-between px-5 py-3 border-b border-border bg-muted/40">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-muted-foreground/30" />
                  <div className="w-2.5 h-2.5 rounded-full bg-muted-foreground/30" />
                  <div className="w-2.5 h-2.5 rounded-full bg-primary/60" />
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground font-mono">
                  <Terminal className="w-3.5 h-3.5" />
                  peercove-fhir-mcp (:8002/mcp)
                </div>
                <Badge variant="outline" className="text-[10px] border-primary/30 text-primary">
                  Read-Only
                </Badge>
              </div>
              <div className="p-5 font-mono text-[11px] space-y-2 bg-background/50 min-h-[320px]">
                {terminalLines.map((line, i) => (
                  <motion.div
                    key={i}
                    custom={i}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true }}
                    variants={fade}
                    className="flex gap-2 leading-relaxed"
                  >
                    <span className="text-muted-foreground shrink-0">{line.label}</span>
                    <span className="text-foreground">{line.text}</span>
                  </motion.div>
                ))}
                <div className="flex gap-2 pt-1">
                  <span className="text-muted-foreground">{"[WAIT] "}</span>
                  <span className="text-muted-foreground">
                    Listening for GET tool calls on /mcp
                    <span className="inline-block w-1.5 h-3.5 bg-primary ml-1 animate-pulse" />
                  </span>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── How it works timeline ── */}
      <section className="py-20 sm:py-24 bg-background">
        <div className="max-w-[110rem] mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fade}
            className="text-center max-w-3xl mx-auto mb-16"
          >
            <span className="text-primary font-semibold tracking-wider uppercase text-sm">
              Execution Flow
            </span>
            <h2 className="mt-2 text-3xl sm:text-4xl font-bold text-foreground">
              From OpenAPI Discovery to Scoped Read Responses
            </h2>
          </motion.div>

          <div className="max-w-3xl mx-auto space-y-6">
            {howItWorks.map((step, i) => (
              <motion.div
                key={step.step}
                custom={i}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fade}
                className="flex items-start gap-6 p-6 rounded-2xl bg-secondary/40 border border-border/50"
              >
                <div className="w-12 h-12 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
                  <span className="text-primary font-bold text-sm">{step.step}</span>
                </div>
                <div>
                  <h3 className="font-bold text-foreground mb-1">{step.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {step.description}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Available tool groups ── */}
      <section id="tools" className="py-20 sm:py-24 bg-secondary/30">
        <div className="max-w-[110rem] mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fade}
            className="text-center max-w-3xl mx-auto mb-16"
          >
            <span className="text-primary font-semibold tracking-wider uppercase text-sm">
              16 Resource Groups
            </span>
            <h2 className="mt-2 text-3xl sm:text-4xl font-bold text-foreground">
              Read-Only (GET) FHIR Resource Groups on /mcp
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Every generated tool maps exclusively to an OpenAPI GET route on
              fhir-server (:8000) and requires a valid IAM JWKS Bearer token.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {mcpToolGroups.map((tool, i) => (
              <motion.div
                key={tool.name}
                custom={i}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fade}
              >
                <Card className="h-full border-border bg-card hover:border-primary/40 transition-colors">
                  <CardContent className="pt-5 space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <span className="font-mono text-sm font-bold text-primary bg-primary/10 px-2.5 py-1 rounded-lg">
                        {tool.name}
                      </span>
                      <ShieldCheck className="w-4 h-4 text-primary shrink-0 mt-1" />
                    </div>
                    <p className="text-sm text-card-foreground font-medium">
                      {tool.description}
                    </p>
                    <div className="space-y-1">
                      <p className="text-[11px] text-muted-foreground">
                        <span className="font-semibold text-foreground">Returns: </span>
                        {tool.returns}
                      </p>
                      <p className="text-[11px] text-muted-foreground">
                        <span className="font-semibold text-primary">Security: </span>
                        {tool.scope}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Use cases ── */}
      <section className="py-20 sm:py-24 bg-background">
        <div className="max-w-[110rem] mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fade}
            className="text-center max-w-3xl mx-auto mb-16"
          >
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground">
              Designed for Safe, Standards-Based Tool Access
            </h2>
          </motion.div>
          <div className="grid md:grid-cols-2 gap-6">
            {useCases.map((uc, i) => (
              <motion.div
                key={i}
                custom={i}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fade}
              >
                <Card className="h-full border-border bg-card">
                  <CardContent className="pt-6 flex items-start gap-4">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                      {uc.icon}
                    </div>
                    <div>
                      <h3 className="font-bold text-card-foreground mb-2">{uc.title}</h3>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {uc.description}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-20 sm:py-28 bg-secondary/30">
        <div className="max-w-[110rem] mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
          >
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
              Explore PeerCove&apos;s Stepped Care &amp; Auxiliary Interop
            </h2>
            <p className="text-lg text-muted-foreground max-w-xl mx-auto mb-10">
              Try the 5-role PeerCove demo or review how our read-only FastMCP
              gateway pairs with the 34-resource HL7 FHIR R4 tier.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3">
              {!session ? (
                <>
                  <OAuthPkceButton href="/signup" size="lg" className="rounded-full px-10 h-12">
                    Get started <ArrowRight className="ml-2 w-4 h-4" />
                  </OAuthPkceButton>
                  <Link href="/demo-login">
                    <Button variant="outline" size="lg" className="rounded-full px-8 h-12">
                      Explore 5-role demo
                    </Button>
                  </Link>
                </>
              ) : (
                <Link href={dashboardHref as any}>
                  <Button size="lg" className="rounded-full px-10 h-12">
                    Open Dashboard <ArrowRight className="ml-2 w-4 h-4" />
                  </Button>
                </Link>
              )}
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
