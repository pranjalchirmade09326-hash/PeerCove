/**
 * HipaaPage — dedicated marketing page explaining PeerCove's privacy-first,
 * HIPAA-aligned security architecture.
 *
 * Layer: client / (marketing) / pages
 *
 * Covers: AES-256-GCM envelope encryption + KMS key rotation, zero-knowledge
 * admin isolation, 5-role Ed25519 JWKS RBAC, immutable AuditEvent logging,
 * explicit intake/voice consent with transcript-only storage & /api/v1/privacy-requests,
 * Engine 2 agent DB isolation, read-only FastMCP gateway, and Crisis Sentinel governance.
 */

"use client";

import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "@/i18n/navigation";
import { OAuthPkceButton } from "@/modules/client/auth/components/OAuthPkceButton";
import {
  ShieldCheck,
  Lock,
  Eye,
  ClipboardList,
  Server,
  Users,
  KeyRound,
  FileCheck,
  ShieldAlert,
  CheckCircle2,
  ArrowRight,
} from "lucide-react";
import type { AuthResponse } from "@/modules/server/auth/types";

// ── Security & privacy pillars ──────────────────────────────────────────────

const safeguards = [
  {
    icon: <Lock className="w-6 h-6 text-primary" />,
    title: "AES-256-GCM Envelope Encryption & KMS",
    badge: "Technical Safeguard",
    points: [
      "Application-layer AES-256-GCM (12-byte IV + 16-byte AuthTag + Ciphertext) before PostgreSQL storage",
      "Versioned KMS key ring with live rotation (/api/v1/admin/kms/rotate) and backward decryption",
      "Protects mood notes, journal titles/bodies, goals, intakes, conduct audits, and safety notes",
      "TLS encryption in transit with bounded sessions (480 min max, 60 min idle, token rotation)",
    ],
  },
  {
    icon: <Users className="w-6 h-6 text-primary" />,
    title: "Zero-Knowledge Admin & 5-Role RBAC",
    badge: "Access Control",
    points: [
      "Asymmetric Ed25519 JWT signing + /.well-known/jwks.json verification in peercove-iam-py",
      "Least-privilege RBAC across Member, Listener, Supervisor, Safety Ops, and Platform Admin",
      "Platform Administrators oversee health & telemetry with zero access to private journals or chats",
      "Non-clinical Peer Listeners remain bound by PC-BE-201 scope and consented context only",
    ],
  },
  {
    icon: <ClipboardList className="w-6 h-6 text-primary" />,
    title: "Immutable AuditEvent Trail",
    badge: "Audit Controls",
    points: [
      "Append-only AuditEvent records for role changes, KMS key rotation, and eligibility signoffs",
      "Logs occurred_at, actor_user_id, action_code, resource_type, resource_id, and outcome",
      "Excludes private conversational plaintext and encrypted journal content from admin logs",
      "Compliance-ready telemetry via /api/v1/admin/audit-events",
    ],
  },
  {
    icon: <Eye className="w-6 h-6 text-primary" />,
    title: "Explicit Consent & Privacy Requests",
    badge: "Member Rights",
    points: [
      "PeerCoveIntakeGate enforces explicit consent before text intake or live voice streaming",
      "Voice intake stores encrypted transcript text only — never raw audio recordings",
      "Self-service /api/v1/privacy-requests tracks export_data state and fulfillment timestamps",
      "Clear non-clinical notices prior to every AI-guided session",
    ],
  },
  {
    icon: <Server className="w-6 h-6 text-primary" />,
    title: "Agent & Interop Isolation",
    badge: "Architecture",
    points: [
      "Engine 2 LangGraph service (:8018) holds zero database credentials",
      "All persistence passes through Engine 3 (:8080) authenticated REST endpoints",
      "Auxiliary FastMCP gateway (:8002/mcp) enforces strictly read-only (GET) access via MCPType.EXCLUDE",
      "JWKS AuthForwardingMiddleware validates and scopes multi-tenant FHIR tokens",
    ],
  },
  {
    icon: <ShieldAlert className="w-6 h-6 text-primary" />,
    title: "Safety Sentinel & Escalation Governance",
    badge: "Crisis Safety",
    points: [
      "Deterministic <2ms pre-inference Safety Sentinel runs before any LLM response",
      "Safety Operations queue uses redacted notes and encrypted SafetyCaseAction logs",
      "Verified regional crisis helplines: Tele-MANAS 14416, 988, KIRAN 1800-599-0019, 112",
      "BAA-ready architecture for covered-entity deployments using the auxiliary FHIR R4 tier",
    ],
  },
];

// ── Privacy practices ───────────────────────────────────────────────────────

const phiPractices = [
  {
    title: "Zero-Knowledge Separation",
    description:
      "Platform Administrators manage KMS rotation, P01–P09 workflows, and service health without ever reading private member conversations or journals.",
  },
  {
    title: "Transcript-Only Voice Consent",
    description:
      "LiveKit and WebSocket voice intake processes audio in real time and retains only encrypted transcript text after explicit consent — never raw audio.",
  },
  {
    title: "No Third-Party Ad or Model Training Sharing",
    description:
      "Member reflections, mood pulse data, and clinical interop payloads are never sold or shared for advertising.",
  },
  {
    title: "HIPAA-Aligned Safeguards & BAA Readiness",
    description:
      "Technical, administrative, and physical controls align with HIPAA Security, Privacy, and Breach Notification rules when deployed with the auxiliary FHIR R4 tier.",
  },
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
 * HIPAA & Privacy Architecture dedicated marketing page.
 *
 * @param session - Active auth session for CTA variant.
 */
export function HipaaPage({ session }: { session: AuthResponse | null }) {
  const dashboardHref =
    (session?.session.activeRoleRedirectUrl ?? "/peercove/member").replace(
      /^\/(?:en|hi|ta)/,
      "",
    ) || "/peercove/member";

  return (
    <div className="pt-20">
      {/* ── Hero ── */}
      <section className="py-20 sm:py-28 bg-background relative overflow-hidden">
        <div className="absolute top-0 left-0 w-[400px] h-[400px] bg-primary/10 rounded-full blur-3xl opacity-50 pointer-events-none" />
        <div className="max-w-[110rem] mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <motion.div className="max-w-3xl" initial="hidden" animate="visible" variants={fade}>
            <div className="flex items-center gap-2 mb-4">
              <Badge variant="outline" className="border-primary/30 text-primary text-xs">
                Zero-Knowledge Privacy &amp; HIPAA Alignment
              </Badge>
              <Badge variant="secondary" className="text-xs">
                AES-256-GCM · Ed25519 JWKS
              </Badge>
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-foreground tracking-tight leading-[1.08] mb-6">
              Privacy-First Security Built Into Every Layer of PeerCove
            </h1>
            <p className="text-lg sm:text-xl text-muted-foreground leading-relaxed mb-8">
              PeerCove combines application-layer AES-256-GCM envelope encryption,
              live KMS key rotation, 5-role Ed25519 RBAC, zero-knowledge admin
              isolation, and immutable AuditEvent logs to protect mental wellness
              spaces and optional clinical FHIR interoperability.
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
                href="#safeguards"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-full border border-border text-sm font-medium text-foreground hover:bg-secondary transition-colors"
              >
                View Safeguards <ArrowRight className="w-4 h-4" />
              </a>
            </div>
          </motion.div>

          {/* Stat row */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.6 }}
            className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-6 p-8 rounded-2xl bg-secondary/40 border border-border/50"
          >
            {[
              { icon: <Lock className="w-5 h-5 text-primary" />, value: "AES-256-GCM", label: "Envelope encryption + KMS" },
              { icon: <KeyRound className="w-5 h-5 text-primary" />, value: "Ed25519", label: "JWKS 5-role RBAC" },
              { icon: <ShieldCheck className="w-5 h-5 text-primary" />, value: "Zero-Knowledge", label: "Admin journal isolation" },
              { icon: <FileCheck className="w-5 h-5 text-primary" />, value: "BAA Ready", label: "HIPAA-aligned controls" },
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

      {/* ── Safeguards grid ── */}
      <section id="safeguards" className="py-20 sm:py-24 bg-secondary/30">
        <div className="max-w-[110rem] mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fade}
            className="text-center max-w-3xl mx-auto mb-16"
          >
            <span className="text-primary font-semibold tracking-wider uppercase text-sm">
              Security &amp; HIPAA Safeguards
            </span>
            <h2 className="mt-2 text-3xl sm:text-4xl font-bold text-foreground">
              Six Implemented Control Domains
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Aligning with HIPAA Technical, Physical, and Administrative
              Safeguards alongside member privacy rights, AI isolation, and
              Crisis Sentinel governance.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {safeguards.map((s, i) => (
              <motion.div
                key={s.title}
                custom={i}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fade}
              >
                <Card className="h-full border border-border bg-card">
                  <CardContent className="pt-6 space-y-4">
                    <div className="flex items-start justify-between">
                      <div className="w-11 h-11 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
                        {s.icon}
                      </div>
                      <Badge variant="secondary" className="text-[10px]">
                        {s.badge}
                      </Badge>
                    </div>
                    <h3 className="font-bold text-lg text-card-foreground">
                      {s.title}
                    </h3>
                    <ul className="space-y-2">
                      {s.points.map((p, j) => (
                        <li
                          key={j}
                          className="flex items-start gap-2 text-sm text-muted-foreground"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5 text-primary mt-0.5 shrink-0" />
                          {p}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Privacy & Governance Practices ── */}
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
                Data Minimization
              </span>
              <h2 className="mt-2 text-3xl sm:text-4xl font-bold text-foreground mb-6">
                How PeerCove Protects Sensitive Mental Wellness Data
              </h2>
              <p className="text-muted-foreground leading-relaxed mb-8">
                Whether operating as a non-clinical peer sanctuary or connected to
                an organization&apos;s auxiliary FHIR R4 tier, PeerCove enforces
                cryptographic isolation, explicit consent, and minimum-necessary
                access across every service.
              </p>
              <div className="space-y-5">
                {phiPractices.map((p, i) => (
                  <motion.div
                    key={i}
                    custom={i}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true }}
                    variants={fade}
                    className="flex items-start gap-4 p-4 rounded-xl bg-secondary/50 border border-border/50"
                  >
                    <CheckCircle2 className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-foreground">{p.title}</p>
                      <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                        {p.description}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7 }}
              className="space-y-6"
            >
              {/* BAA card */}
              <Card className="border-primary/20 bg-primary/5">
                <CardContent className="pt-6">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                      <FileCheck className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-bold text-foreground mb-2">
                        Covered-Entity &amp; BAA Readiness
                      </h3>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        For organizations pairing PeerCove&apos;s stepped-care
                        sanctuary with the auxiliary HL7 FHIR R4 interoperability
                        tier, PeerCove&apos;s encryption, KMS rotation, RBAC, and
                        audit controls support Business Associate Agreement (BAA)
                        deployments.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Audit trails card */}
              <Card className="border-border bg-card">
                <CardContent className="pt-6">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center">
                      <ClipboardList className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-bold text-card-foreground mb-2">
                        Immutable AuditEvent Logs
                      </h3>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        Every administrative action, KMS rotation, training
                        signoff, privacy request, and safety escalation writes an
                        append-only AuditEvent record — without exposing
                        conversational plaintext.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Non-clinical & Crisis boundary card */}
              <Card className="border-border bg-card">
                <CardContent className="pt-6">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center">
                      <ShieldAlert className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-bold text-card-foreground mb-2">
                        Deterministic Safety &amp; Zero-DB AI Isolation
                      </h3>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        Engine 2 agents carry zero database credentials and run
                        a &lt;2ms deterministic Crisis Sentinel before any model
                        inference, while auxiliary FastMCP access remains strictly
                        read-only (GET).
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
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
              Privacy-Preserving Stepped Care From Day One
            </h2>
            <p className="text-lg text-muted-foreground max-w-xl mx-auto mb-10">
              Inspect zero-knowledge KMS rotation, RBAC boundaries, and consent
              controls directly inside the 5-role demo.
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
