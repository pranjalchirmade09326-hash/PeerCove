/**
 * Cta — final call-to-action section on the PeerCove marketing page.
 *
 * Layer: client / (marketing) / components
 *
 * Invites visitors to enter their Member Sanctuary, explore the 5-role demo
 * workspaces, or learn how PeerCove's stepped-care workflow operates.
 */

"use client";

import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { OAuthPkceButton } from "@/modules/client/auth/components/OAuthPkceButton";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import type { AuthResponse } from "@/modules/server/auth/types";

/**
 * Full-width CTA banner encouraging sign-up, demo exploration, or dashboard entry.
 *
 * @param session - Active auth session; controls CTA button variant.
 */
export default function Cta({ session }: { session: AuthResponse | null }) {
  const dashboardHref =
    (session?.session.activeRoleRedirectUrl ?? "/peercove/member").replace(
      /^\/(?:en|hi|ta)/,
      "",
    ) || "/peercove/member";

  return (
    <section className="py-20 sm:py-28">
      <div className="max-w-[110rem] mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="relative rounded-[2.5rem] overflow-hidden bg-primary px-6 py-16 sm:px-16 sm:py-24 text-center shadow-2xl"
        >
          {/* Decorative SVG */}
          <div className="absolute inset-0 opacity-10">
            <svg className="h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none">
              <path d="M0 100 C 20 0 50 0 100 100 Z" fill="currentColor" className="text-primary-foreground" />
            </svg>
          </div>

          <div className="relative z-10 max-w-3xl mx-auto">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-primary-foreground tracking-tight">
              Step into a calmer wellness sanctuary today
            </h2>
            <p className="mt-6 text-lg sm:text-xl text-primary-foreground/80 max-w-2xl mx-auto">
              Begin with guided chat or voice intake, connect with a trained Peer
              Listener in a confidential room, and keep mood pulse and
              encrypted journals in one private space.
            </p>

            <div className="mt-10 flex flex-col sm:flex-row justify-center gap-4">
              {!session ? (
                <>
                  <OAuthPkceButton
                    href="/signup"
                    size="lg"
                    variant="secondary"
                    className="w-full sm:w-auto rounded-full px-8 h-14 text-lg font-semibold shadow-lg hover:shadow-xl transition-all"
                  >
                    Get started
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </OAuthPkceButton>
                  <Link href="/how-it-works">
                    <Button
                      size="lg"
                      variant="outline"
                      className="w-full sm:w-auto rounded-full px-8 h-14 text-lg bg-transparent border-primary-foreground text-primary-foreground hover:bg-primary-foreground/10"
                    >
                      See how PeerCove works
                    </Button>
                  </Link>
                </>
              ) : (
                <Link href={dashboardHref as any}>
                  <Button
                    size="lg"
                    variant="secondary"
                    className="w-full sm:w-auto rounded-full px-8 h-14 text-lg font-semibold shadow-lg hover:shadow-xl transition-all"
                  >
                    Open Dashboard
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
