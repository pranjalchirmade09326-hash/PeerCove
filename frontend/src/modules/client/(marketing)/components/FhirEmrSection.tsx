/**
 * FhirEmrSection — Auxiliary HL7 FHIR R4 interoperability showcase section.
 *
 * Layer: client / (marketing) / components
 *
 * Highlights PeerCove's optional Auxiliary Clinical Interoperability Tier
 * (backend/fhir-server :8000, fhir-gql :8001, fhir-staging) supporting 34
 * HL7 FHIR R4 resources with dual-format JSON and multi-tenant JWT scoping.
 */

"use client";

import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Database,
  User,
  UserCheck,
  Calendar,
  ClipboardList,
  Activity,
  Pill,
  FileText,
  CheckCircle2,
  XCircle,
} from "lucide-react";

// ── Representative FHIR resource cards (34 total in fhir-server) ────────────

const fhirResources = [
  {
    icon: <User className="w-5 h-5 text-primary" />,
    resource: "Patient",
    description: "Structured member/patient demographics and scoped identifiers for external clinical handoffs.",
  },
  {
    icon: <UserCheck className="w-5 h-5 text-primary" />,
    resource: "Practitioner",
    description: "External clinical provider profiles, credentials, and organization roles.",
  },
  {
    icon: <Calendar className="w-5 h-5 text-primary" />,
    resource: "Appointment",
    description: "Stepped-care clinical referrals with standardized FHIR status codes.",
  },
  {
    icon: <ClipboardList className="w-5 h-5 text-primary" />,
    resource: "Encounter",
    description: "Structured encounter summaries bridged during authorized stepped-care referrals.",
  },
  {
    icon: <Activity className="w-5 h-5 text-primary" />,
    resource: "Observation",
    description: "Structured vitals, wellness scores, and intake measurements when exported.",
  },
  {
    icon: <Pill className="w-5 h-5 text-primary" />,
    resource: "Condition",
    description: "Standardized condition codes supported across SNOMED CT terminology endpoints.",
  },
  {
    icon: <FileText className="w-5 h-5 text-primary" />,
    resource: "DocumentReference",
    description: "Clinical referrals, safety summaries, and staging extraction documents.",
  },
];

// ── Comparison: Auxiliary FHIR R4 vs. Proprietary Formats ──────────────────

const fhirAdvantages = [
  {
    pro: "34 HL7 FHIR R4 resources with dual-format application/fhir+json + application/json",
    con: "Vendor lock-in — data trapped in proprietary record formats",
  },
  {
    pro: "Read-only (GET) FastMCP gateway exposes 16 resource groups over streamable-HTTP",
    con: "Integrations must parse unstructured text or fragile CSV exports",
  },
  {
    pro: "Isolated from Engine 3 AES-256-GCM member journals via multi-tenant JWT scoping",
    con: "Monolithic storage couples private wellbeing notes with external clinic APIs",
  },
  {
    pro: "Built-in AuditEvent, Provenance, CarePlan, and RiskAssessment R4 endpoints",
    con: "Compliance requires costly custom middleware mappings",
  },
];

// ── Animation variants ──────────────────────────────────────────────────────

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.45 } },
};

// ── Component ──────────────────────────────────────────────────────────────

/**
 * Auxiliary FHIR R4 interoperability section with resource showcase and comparison.
 */
export default function FhirEmrSection() {
  return (
    <section id="fhir-emr" className="py-20 sm:py-28 bg-secondary/30">
      <div className="max-w-[110rem] mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center max-w-3xl mx-auto mb-16"
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 mb-4">
            <Database className="w-4 h-4 text-primary" />
            <span className="text-sm font-semibold text-primary">
              Auxiliary HL7 FHIR R4 Tier
            </span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground">
            Optional Clinical Interoperability Powered by FHIR R4
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            While PeerCove&apos;s core wellbeing sanctuary runs on Engine 3 with
            AES-256-GCM envelope encryption, our auxiliary{" "}
            <span className="font-mono text-sm text-foreground">fhir-server</span>{" "}
            supports 34 HL7 FHIR R4 resources for seamless external healthcare
            interoperability.
          </p>
        </motion.div>

        {/* FHIR resource grid */}
        <motion.div
          className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 mb-20"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
        >
          {fhirResources.map((res, i) => (
            <motion.div key={i} variants={itemVariants}>
              <Card className="h-full border border-border bg-card hover:border-primary/40 hover:shadow-md transition-all">
                <CardContent className="pt-5 space-y-3">
                  <div className="flex items-center gap-2">
                    {res.icon}
                    <Badge variant="outline" className="text-[10px] font-mono border-border">
                      {res.resource}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {res.description}
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          ))}

          {/* 27 more R4 resources */}
          <motion.div variants={itemVariants}>
            <Card className="border border-dashed border-border bg-card/50 h-full">
              <CardContent className="pt-5 flex flex-col items-center justify-center h-full text-center gap-2 min-h-[100px]">
                <Database className="w-5 h-5 text-primary" />
                <p className="text-xs font-medium text-foreground">
                  34 Total R4 Resources
                </p>
                <p className="text-[11px] text-muted-foreground">
                  Including CarePlan, RiskAssessment, QuestionnaireResponse &amp; AuditEvent
                </p>
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>

        {/* FHIR vs. proprietary comparison */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="max-w-4xl mx-auto"
        >
          <h3 className="text-2xl font-bold text-foreground text-center mb-8">
            Why Auxiliary FHIR R4 vs. Proprietary Record Silos?
          </h3>

          <div className="grid md:grid-cols-2 gap-6">
            {/* FHIR column */}
            <Card className="border-primary/20 bg-primary/5">
              <CardContent className="pt-6 space-y-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
                    <CheckCircle2 className="w-4 h-4 text-primary" />
                  </div>
                  <span className="font-bold text-foreground">
                    PeerCove — Auxiliary FHIR R4 Tier
                  </span>
                </div>
                <ul className="space-y-3">
                  {fhirAdvantages.map((adv, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <CheckCircle2 className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                      <span className="text-foreground/80">{adv.pro}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            {/* Proprietary column */}
            <Card className="border-border bg-card/70">
              <CardContent className="pt-6 space-y-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center">
                    <XCircle className="w-4 h-4 text-muted-foreground" />
                  </div>
                  <span className="font-bold text-muted-foreground">
                    Legacy Proprietary Formats
                  </span>
                </div>
                <ul className="space-y-3">
                  {fhirAdvantages.map((adv, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <XCircle className="w-4 h-4 text-destructive shrink-0 mt-0.5" />
                      <span className="text-muted-foreground">{adv.con}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
