/**
 * Footer — site-wide footer for the PeerCove marketing landing page.
 *
 * Layer: client / (marketing) / components
 *
 * Four-column layout: brand tagline, Platform links, Workspaces links (all 5 roles),
 * and Trust & Architecture links. Uses @/i18n/navigation Link for all internal routes.
 */

"use client";

import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Link } from "@/i18n/navigation";
import { AppLogo } from "@/modules/client/shared/components/AppLogo";

const platformLinks = [
  { label: "Safety & Support", href: "/#support" },
  { label: "How It Works", href: "/how-it-works" },
  { label: "Demo Workspaces", href: "/demo-login" },
  { label: "Sign In", href: "/login" },
  { label: "Get Started", href: "/signup" },
] as const;

const workspaceLinks = [
  { label: "Member Space", href: "/demo-login" },
  { label: "Peer Listener", href: "/demo-login" },
  { label: "Listener Supervisor", href: "/demo-login" },
  { label: "Safety Operations", href: "/demo-login" },
  { label: "Platform Admin", href: "/demo-login" },
] as const;

const trustLinks = [
  { label: "Privacy & Consent", href: "/hipaa" },
  { label: "AI Wellbeing Companion", href: "/ai-agents" },
  { label: "Stepped-Care Journey", href: "/how-it-works" },
  { label: "Safety & Crisis Support", href: "/#support" },
] as const;

/**
 * Marketing page footer tailored to PeerCove's peer listening, guided wellness,
 * zero-knowledge privacy, and auxiliary clinical interoperability tier.
 */
export default function Footer() {
  return (
    <motion.footer
      className="bg-secondary/30 border-t border-border"
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.5 }}
    >
      <div className="max-w-7xl mx-auto px-5 sm:px-8 py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-[1.5fr_1fr_1fr_1fr] gap-8 lg:gap-12">
          {/* Brand */}
          <div className="sm:col-span-2 lg:col-span-1">
            <Link href="/" className="inline-flex items-center space-x-2 text-primary">
              <AppLogo size={32} className="w-8 h-8" />
              <span className="text-2xl font-bold text-foreground">PeerCove</span>
            </Link>
            <p className="mt-4 text-muted-foreground text-sm leading-relaxed max-w-sm">
              A calm, supportive harbor for peer listening, guided text and voice
              wellness intake, encrypted journaling, and stepped-care safety.
            </p>
            <div className="mt-4 flex flex-wrap gap-1.5">
              <Badge variant="outline" className="text-[10px] border-primary/30 text-primary">
                Peer Support
              </Badge>
              <Badge variant="outline" className="text-[10px] border-primary/30 text-primary">
                AES-256-GCM Privacy
              </Badge>
              <Badge variant="outline" className="text-[10px] border-border text-muted-foreground">
                Crisis Sentinel
              </Badge>
            </div>
          </div>

          {/* Platform */}
          <div>
            <h3 className="font-semibold text-foreground">Platform</h3>
            <ul className="mt-4 space-y-2.5 text-sm">
              {platformLinks.map((item) => (
                <li key={item.label}>
                  <Link
                    href={item.href}
                    className="text-muted-foreground hover:text-primary transition-colors"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Workspaces */}
          <div>
            <h3 className="font-semibold text-foreground">Workspaces</h3>
            <ul className="mt-4 space-y-2.5 text-sm">
              {workspaceLinks.map((item) => (
                <li key={item.label}>
                  <Link
                    href={item.href}
                    className="text-muted-foreground hover:text-primary transition-colors"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Trust & Architecture */}
          <div>
            <h3 className="font-semibold text-foreground">Trust &amp; Architecture</h3>
            <ul className="mt-4 space-y-2.5 text-sm">
              {trustLinks.map((item) => (
                <li key={item.label}>
                  <Link
                    href={item.href}
                    className="text-muted-foreground hover:text-primary transition-colors"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-12 pt-8 border-t border-border flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} PeerCove. All rights reserved.
          </p>
          <div className="flex flex-wrap items-center justify-center sm:justify-end gap-x-4 gap-y-1 text-xs text-muted-foreground">
            <span>Peer Listening &amp; Guided Wellness</span>
            <span className="text-border">·</span>
            <span>Zero-Knowledge Admin Boundary</span>
            <span className="text-border">·</span>
            <span>AES-256-GCM Privacy</span>
          </div>
        </div>
      </div>
    </motion.footer>
  );
}
