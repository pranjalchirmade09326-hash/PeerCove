/**
 * FhirEmrPage — dedicated marketing page explaining PeerCove's Auxiliary
 * HL7 FHIR R4 Interoperability Tier.
 *
 * Layer: client / (marketing) / pages
 *
 * Clarifies architectural separation: PeerCove's primary core services
 * (peercove-fastapi :8080 + peercove-iam-py :5001) power the 5-role stepped-care
 * peer platform, while the Auxiliary Interoperability Tier (fhir-server :8000,
 * fhir-gql :8001, fhir-staging) supports 34 HL7 FHIR R4 resources with dual-format
 * JSON negotiation and multi-tenant JWT scoping.
 */

"use client";

import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "@/i18n/navigation";
import { OAuthPkceButton } from "@/modules/client/auth/components/OAuthPkceButton";
import {
  User,
  UserCheck,
  Calendar,
  ClipboardList,
  Activity,
  Pill,
  FileText,
  CheckCircle2,
  XCircle,
  ArrowRight,
  Layers,
  Zap,
  Globe,
  ShieldCheck,
} from "lucide-react";
import type { AuthResponse } from "@/modules/server/auth/types";

// ── Representative FHIR R4 resources (out of 34 supported) ──────────────────

const resources = [
  {
    icon: <User className="w-6 h-6 text-primary" />,
    name: "Patient",
    description:
      "Member/patient demographics, identifiers, and communication preferences scoped by tenant org_id and user_id.",
    fields: ["name", "birthDate", "gender", "telecom", "identifier"],
  },
  {
    icon: <UserCheck className="w-6 h-6 text-primary" />,
    name: "Practitioner",
    description:
      "Caregiver and clinical collaborator profiles with qualifications, specialties, and role linkages.",
    fields: ["name", "qualification", "specialty", "telecom"],
  },
  {
    icon: <Calendar className="w-6 h-6 text-primary" />,
    name: "Appointment",
    description:
      "Scheduled follow-up or clinical handoff bookings supporting standard FHIR R4 status transitions.",
    fields: ["status", "start", "end", "participant", "serviceType"],
  },
  {
    icon: <ClipboardList className="w-6 h-6 text-primary" />,
    name: "Encounter",
    description:
      "Structured care episode records linking stepped-care handoffs to clinical workflows.",
    fields: ["status", "class", "subject", "participant", "period"],
  },
  {
    icon: <Activity className="w-6 h-6 text-primary" />,
    name: "Observation",
    description:
      "Structured wellbeing indicators, vitals (/api/v1/vitals), and standardized clinical measurements.",
    fields: ["status", "code", "subject", "value[x]", "effectiveDateTime"],
  },
  {
    icon: <Pill className="w-6 h-6 text-primary" />,
    name: "CarePlan & Condition",
    description:
      "Stepped-care plans, SNOMED CT terminology mappings (/api/v1/terminology), and longitudinal context.",
    fields: ["status", "intent", "category", "subject", "period"],
  },
  {
    icon: <FileText className="w-6 h-6 text-primary" />,
    name: "DocumentReference",
    description:
      "Consented summaries, RiskAssessment, QuestionnaireResponse, and AuditEvent / Provenance records.",
    fields: ["status", "type", "subject", "date", "author", "content"],
  },
];

// ── Why FHIR comparison ────────────────────────────────────────────────────

const comparison = [
  {
    aspect: "Data Format",
    fhir: "Dual-format application/fhir+json & application/json via Accept header",
    legacy: "Proprietary database schemas — different per vendor",
  },
  {
    aspect: "Interoperability",
    fhir: "34 standardized HL7 FHIR R4 resources in an isolated auxiliary tier",
    legacy: "Requires fragile CSV exports or custom point-to-point ETL",
  },
  {
    aspect: "AI Tool Access",
    fhir: "OpenAPI schema drives read-only (GET) FastMCP tools across 16 groups",
    legacy: "Unstructured text scraping without schema validation",
  },
  {
    aspect: "Tenant Isolation",
    fhir: "Multi-tenant Ed25519 JWT scoping (user_id + org_id) + Redis 7 rate limits",
    legacy: "Coarse perimeter auth with manual tenant filtering",
  },
  {
    aspect: "Core Separation",
    fhir: "Encrypted peer sanctuary (Engine 3) remains separate until consented handoff",
    legacy: "Monolithic clinical tables mixing private journals with EMR",
  },
];

// ── Auxiliary tier services ─────────────────────────────────────────────────

const workflowMap = [
  { step: "Core Stepped Care (peercove-fastapi :8080)", resource: "AES-256-GCM Core" },
  { step: "Auxiliary REST API (fhir-server :8000)", resource: "34 FHIR R4 Resources" },
  { step: "Middleware Bridge (fhir-gql :8001)", resource: "Client Proxy" },
  { step: "Document Pipeline (fhir-staging)", resource: "Async Ingestion" },
  { step: "Read-Only AI Gateway (fhir-mcp :8002/mcp)", resource: "GET-Only MCP" },
];

// ── Animation variants ──────────────────────────────────────────────────────

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
 * Full dedicated Auxiliary HL7 FHIR R4 Interoperability Tier page.
 *
 * @param session - Active auth session for CTA button variant.
 */
export function FhirEmrPage({ session }: { session: AuthResponse | null }) {
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
          <motion.div
            className="max-w-3xl"
            initial="hidden"
            animate="visible"
            variants={fade}
          >
            <div className="flex items-center gap-2 mb-4">
              <Badge variant="outline" className="border-primary/30 text-primary text-xs">
                Auxiliary Interoperability Tier
              </Badge>
              <Badge variant="secondary" className="text-xs">
                HL7 FHIR R4 · 34 Resources
              </Badge>
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-foreground tracking-tight leading-[1.08] mb-6">
              Optional HL7 FHIR R4 Interoperability Alongside PeerCove
            </h1>
            <p className="text-lg sm:text-xl text-muted-foreground leading-relaxed mb-8">
              PeerCove&apos;s primary core (Engine 3) protects peer support, mood,
              and encrypted journals. Alongside it, our Auxiliary Interoperability
              Tier (fhir-server :8000, fhir-gql :8001, fhir-staging) supports{" "}
              <strong className="text-foreground">34 HL7 FHIR R4 resources</strong>{" "}
              for health systems that need clinical handoffs and standards-based
              exchange.
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
                href="#resources"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-full border border-border text-sm font-medium text-foreground hover:bg-secondary transition-colors"
              >
                Explore FHIR Resources <ArrowRight className="w-4 h-4" />
              </a>
            </div>
          </motion.div>

          {/* Quick facts */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.6 }}
            className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-6 p-8 rounded-2xl bg-secondary/40 border border-border/50"
          >
            {[
              { icon: <Globe className="w-5 h-5 text-primary" />, label: "Global Standard", value: "HL7 FHIR R4" },
              { icon: <Layers className="w-5 h-5 text-primary" />, label: "Supported Resources", value: "34" },
              { icon: <Zap className="w-5 h-5 text-primary" />, label: "Content Negotiation", value: "Dual JSON" },
              { icon: <ShieldCheck className="w-5 h-5 text-primary" />, label: "Access Scoping", value: "Multi-Tenant JWT" },
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

      {/* ── FHIR Resources ── */}
      <section id="resources" className="py-20 sm:py-24 bg-secondary/30">
        <div className="max-w-[110rem] mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fade}
            className="text-center max-w-3xl mx-auto mb-16"
          >
            <span className="text-primary font-semibold tracking-wider uppercase text-sm">
              34 FHIR R4 Resources
            </span>
            <h2 className="mt-2 text-3xl sm:text-4xl font-bold text-foreground">
              Representative Resources in the Auxiliary Tier
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Built on async FastAPI, PostgreSQL 15, and Redis 7, fhir-server
              exposes 34 R4 resources including CarePlan, RiskAssessment,
              QuestionnaireResponse, Provenance, and AuditEvent.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {resources.map((res, i) => (
              <motion.div
                key={res.name}
                custom={i}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fade}
              >
                <Card className="h-full border border-border bg-card hover:border-primary/40 hover:shadow-md transition-all">
                  <CardContent className="pt-6 space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20">
                        {res.icon}
                      </div>
                      <div>
                        <p className="font-bold text-lg text-card-foreground">{res.name}</p>
                        <p className="text-[10px] font-mono text-muted-foreground">
                          HL7 FHIR R4
                        </p>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {res.description}
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {res.fields.map((f) => (
                        <span
                          key={f}
                          className="text-[10px] font-mono px-2 py-0.5 rounded bg-secondary text-muted-foreground"
                        >
                          {f}
                        </span>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Architectural Separation & Sample Payload ── */}
      <section className="py-20 sm:py-24 bg-background">
        <div className="max-w-[110rem] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7 }}
            >
              <span className="text-primary font-semibold tracking-wider uppercase text-sm">
                Clean Separation
              </span>
              <h2 className="mt-2 text-3xl sm:text-4xl font-bold text-foreground mb-6">
                Core Sanctuary First, Auxiliary FHIR When Needed
              </h2>
              <p className="text-muted-foreground leading-relaxed mb-8">
                PeerCove keeps everyday peer support, mood tracking, and
                AES-256-GCM journals inside Engine 3 (peercove-fastapi), while
                the optional Auxiliary Interoperability Tier serves clinical
                integration, dual-format JSON, and OpenAPI schema generation for
                read-only FastMCP.
              </p>
              {workflowMap.map((item, i) => (
                <motion.div
                  key={i}
                  custom={i}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true }}
                  variants={fade}
                  className="flex items-center gap-4 py-3 border-b border-border/50 last:border-0"
                >
                  <ArrowRight className="w-4 h-4 text-primary shrink-0" />
                  <span className="text-sm text-foreground flex-1">{item.step}</span>
                  <Badge variant="outline" className="text-[10px] font-mono shrink-0 border-primary/30 text-primary">
                    {item.resource}
                  </Badge>
                </motion.div>
              ))}
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7 }}
              className="bg-card border border-border rounded-2xl p-6 font-mono text-xs space-y-3"
            >
              <div className="flex items-center justify-between pb-3 border-b border-border">
                <span className="font-semibold text-card-foreground text-sm">
                  Sample FHIR Observation (application/fhir+json)
                </span>
                <Badge variant="outline" className="text-[10px] border-primary/30 text-primary">
                  R4
                </Badge>
              </div>
              {[
                { key: "resourceType", value: '"Observation"' },
                { key: "status", value: '"final"' },
                { key: "code.text", value: '"Wellbeing Check-In"' },
                { key: "valueString", value: '"Consented stepped-care summary"' },
                { key: "subject.ref", value: '"Patient/PAT-00241"' },
                { key: "effectiveDateTime", value: '"2026-06-16T10:30:00Z"' },
                { key: "meta.tag", value: '"org-scoped-jwt"' },
              ].map((row, i) => (
                <div key={i} className="flex gap-3">
                  <span className="text-muted-foreground shrink-0 min-w-[130px]">
                    {row.key}:
                  </span>
                  <span className="text-primary">{row.value}</span>
                </div>
              ))}
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── FHIR vs Legacy comparison ── */}
      <section className="py-20 sm:py-24 bg-secondary/30">
        <div className="max-w-[110rem] mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fade}
            className="text-center max-w-3xl mx-auto mb-12"
          >
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground">
              Auxiliary FHIR R4 vs. Legacy Proprietary Formats
            </h2>
          </motion.div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-4 text-muted-foreground font-semibold w-1/4">
                    Aspect
                  </th>
                  <th className="text-left py-3 px-4 font-semibold w-[37.5%]">
                    <span className="flex items-center gap-2 text-primary">
                      <CheckCircle2 className="w-4 h-4" /> PeerCove — Auxiliary FHIR R4
                    </span>
                  </th>
                  <th className="text-left py-3 px-4 text-muted-foreground font-semibold w-[37.5%]">
                    <span className="flex items-center gap-2">
                      <XCircle className="w-4 h-4 text-destructive" /> Legacy Proprietary EMR
                    </span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {comparison.map((row, i) => (
                  <motion.tr
                    key={i}
                    custom={i}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true }}
                    variants={fade}
                    className="border-b border-border/50 hover:bg-secondary/30 transition-colors"
                  >
                    <td className="py-4 px-4 font-medium text-foreground">{row.aspect}</td>
                    <td className="py-4 px-4 text-muted-foreground">
                      <span className="flex items-start gap-2">
                        <CheckCircle2 className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                        {row.fhir}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-muted-foreground">
                      <span className="flex items-start gap-2">
                        <XCircle className="w-4 h-4 text-destructive shrink-0 mt-0.5" />
                        {row.legacy}
                      </span>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-20 sm:py-28">
        <div className="max-w-[110rem] mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
          >
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
              Stepped Care With Standards-Based Clinical Interop
            </h2>
            <p className="text-lg text-muted-foreground max-w-xl mx-auto mb-10">
              Start with PeerCove&apos;s 5-role demo or explore how the read-only
              FastMCP gateway queries these 34 FHIR R4 resources.
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
