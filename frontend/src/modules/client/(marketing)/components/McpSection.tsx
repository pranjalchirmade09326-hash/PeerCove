/**
 * McpSection — dedicated section highlighting PeerCove's Read-Only FastMCP Gateway.
 *
 * Layer: client / (marketing) / components
 *
 * Explains how PeerCove's auxiliary FastMCP gateway (fhir-mcp on port 8002 at /mcp)
 * uses FastMCP.from_openapi() to expose strictly read-only (GET) tools across 16
 * HL7 FHIR R4 resource groups with JWKS JWT forwarding.
 */

"use client";

import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import {
  Server,
  Terminal,
  Database,
  Brain,
  Shield,
  Lock,
} from "lucide-react";

// ── MCP capability list ─────────────────────────────────────────────────────

const capabilities = [
  {
    icon: <Database className="w-4 h-4 text-primary shrink-0" />,
    text: "Auto-generated from fhir-server OpenAPI schema across 16 HL7 FHIR R4 resource groups",
  },
  {
    icon: <Brain className="w-4 h-4 text-primary shrink-0" />,
    text: "Connect any standards-compliant MCP client over streamable-HTTP (/mcp on port 8002)",
  },
  {
    icon: <Shield className="w-4 h-4 text-primary shrink-0" />,
    text: "AuthForwardingMiddleware validates Bearer JWTs against IAM Ed25519 JWKS on every call",
  },
  {
    icon: <Lock className="w-4 h-4 text-primary shrink-0" />,
    text: "Strictly read-only (GET only) — all POST, PATCH, and DELETE methods are excluded",
  },
];

// ── Terminal log lines ──────────────────────────────────────────────────────

const terminalLogs = [
  {
    prefix: "[INIT]",
    text: "PeerCove FastMCP Gateway started on :8002 (/mcp streamable-http)",
    color: "text-muted-foreground",
  },
  {
    prefix: "[SPEC]",
    text: "FastMCP.from_openapi() loaded fhir-server:8000/openapi.json (16 GET groups)",
    color: "text-primary",
  },
  {
    prefix: "[RULE]",
    text: "RouteMap: GET -> MCPType.TOOL | POST/PATCH/DELETE -> MCPType.EXCLUDE",
    color: "text-foreground",
  },
  {
    prefix: "[AUTH]",
    text: "Ed25519 JWKS validated Bearer token -> forwarding scoped context",
    color: "text-primary",
  },
  {
    prefix: "[TOOL]",
    text: "GET /api/fhir/v1/Patient/PAT-00241 -> 200 application/fhir+json",
    color: "text-foreground",
  },
  {
    prefix: "[TOOL]",
    text: "GET /api/fhir/v1/Observations?patient=PAT-00241 -> 3 resources",
    color: "text-foreground",
  },
  {
    prefix: "[TOOL]",
    text: "GET /api/fhir/v1/Conditions?patient=PAT-00241 -> 2 resources",
    color: "text-foreground",
  },
  {
    prefix: "[SAFE]",
    text: "Write operations disabled at gateway boundary — zero mutations permitted",
    color: "text-primary",
  },
];

// ── Component ──────────────────────────────────────────────────────────────

/**
 * Dedicated Read-Only FastMCP Gateway section with terminal simulation.
 */
export default function McpSection() {
  return (
    <section
      id="mcp"
      className="py-20 sm:py-28 bg-secondary/30 overflow-hidden"
    >
      <div className="max-w-[110rem] mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center max-w-3xl mx-auto mb-16"
        >
          <span className="text-primary font-semibold tracking-wider uppercase text-sm">
            Auxiliary FastMCP Gateway
          </span>
          <h2 className="mt-2 text-3xl sm:text-4xl font-bold text-foreground">
            Read-Only FHIR R4 Context via MCP
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            PeerCove&apos;s auxiliary interoperability tier includes a{" "}
            <span className="text-foreground font-semibold">FastMCP server</span>{" "}
            on port <span className="font-mono text-sm text-foreground">8002</span>{" "}
            that exposes strictly read-only (<span className="font-mono text-sm">GET</span>)
            FHIR tools across 16 resource groups.
          </p>
        </motion.div>

        {/* Two-column layout */}
        <div className="grid lg:grid-cols-2 gap-12 items-start">
          {/* Left: capabilities */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            className="space-y-8"
          >
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
                <Server className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-foreground">
                  FastMCP Read-Only Gateway
                </h3>
                <Badge variant="outline" className="text-[10px] mt-1 border-primary/30 text-primary">
                  GET-Only · 16 FHIR Groups
                </Badge>
              </div>
            </div>

            <p className="text-muted-foreground leading-relaxed">
              Generated at startup via{" "}
              <span className="font-mono text-xs bg-muted px-1.5 py-0.5 rounded text-foreground">
                FastMCP.from_openapi()
              </span>{" "}
              against{" "}
              <span className="font-mono text-xs bg-muted px-1.5 py-0.5 rounded text-foreground">
                fhir-server:8000/openapi.json
              </span>
              , the gateway validates every request via IAM JWKS and forwards the
              user&apos;s scoped Bearer token — with zero direct database access
              and zero write mutations.
            </p>

            <ul className="space-y-4">
              {capabilities.map((cap, i) => (
                <motion.li
                  key={i}
                  initial={{ opacity: 0, x: -10 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1, duration: 0.5 }}
                  className="flex items-start gap-3"
                >
                  {cap.icon}
                  <span className="text-sm text-muted-foreground leading-relaxed">
                    {cap.text}
                  </span>
                </motion.li>
              ))}
            </ul>

            {/* Compatible clients */}
            <div className="pt-4 border-t border-border/50">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                Works With Standards-Compliant MCP Clients
              </p>
              <div className="flex flex-wrap gap-2">
                {[
                  "Streamable-HTTP Clients",
                  "Clinical Research Tools",
                  "Workflow Orchestrators",
                  "Open Source MCP Clients",
                ].map((ai) => (
                  <Badge key={ai} variant="secondary" className="text-xs">
                    {ai}
                  </Badge>
                ))}
              </div>
            </div>
          </motion.div>

          {/* Right: terminal */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            className="bg-card border border-border rounded-2xl overflow-hidden shadow-xl"
          >
            {/* Terminal top bar */}
            <div className="flex items-center justify-between px-5 py-3 border-b border-border bg-muted/40">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-muted-foreground/30" />
                <div className="w-2.5 h-2.5 rounded-full bg-muted-foreground/30" />
                <div className="w-2.5 h-2.5 rounded-full bg-muted-foreground/30" />
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground font-mono">
                <Terminal className="w-3.5 h-3.5" />
                peercove-fhir-mcp :8002/mcp
              </div>
              <Badge variant="outline" className="text-[10px] border-primary/30 text-primary">
                Read-Only
              </Badge>
            </div>

            {/* Terminal body */}
            <div className="p-5 font-mono text-xs space-y-2 bg-background/50 min-h-[300px]">
              {terminalLogs.map((log, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: 8 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.08, duration: 0.4 }}
                  className="flex gap-3 leading-relaxed"
                >
                  <span className="text-muted-foreground/60 shrink-0 select-none">
                    {log.prefix}
                  </span>
                  <span className={log.color}>{log.text}</span>
                </motion.div>
              ))}

              {/* Blinking cursor */}
              <div className="flex gap-3">
                <span className="text-muted-foreground/60 shrink-0 select-none">
                  [WAIT]{" "}
                </span>
                <span className="text-muted-foreground">
                  Listening for authenticated GET tool calls
                  <span className="inline-block w-2 h-4 bg-primary ml-1 animate-pulse" />
                </span>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
